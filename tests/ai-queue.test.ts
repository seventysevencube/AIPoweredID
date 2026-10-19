import { afterEach, beforeEach, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localDatabase } from "../scripts/local-db";
import {
  enqueueAnalysis,
  runNextSimulation,
  simulationPolicy,
  type SimulatedProvider,
  type Step,
} from "../server/ai/queue";
import { createHandler, type Identity, type Rpc } from "../server/api";
import { sections } from "../src/model";

let db: Awaited<ReturnType<typeof localDatabase>>;
let owner: Identity, peer: Identity, project: string;
let persistedPath: string | undefined;
const expected = Object.fromEntries(
  sections.map((s) => [s, s === "context" || s === "audience" ? 2 : 1]),
);
const intent = (changes: Record<string, unknown> = {}) => ({
  request_id: randomUUID(),
  expected_revisions: expected,
  ...changes,
});
const enqueue = (body = intent(), actor = owner, projectId = project) =>
  enqueueAnalysis(
    { rpc: db.aiRpc, policy: simulationPolicy },
    actor,
    projectId,
    body,
  );
const read = (id: string, actor = owner) =>
  db.aiRpc("job", { ...actor, project_id: project, job_id: id });
const budget = () => db.aiRpc("budget", owner);
async function admit(
  email: string,
  userId: string = randomUUID(),
): Promise<Identity> {
  const identity = {
    email,
    user_id: userId,
    session_id: randomUUID(),
    access: randomUUID(),
    refresh: randomUUID(),
  };
  await db.rpc("pilot_set", { email, active: true });
  const challenge_id = randomUUID();
  await db.rpc("request_code", { email, challenge_id, digest: "fixture" });
  await db.rpc("verify_code", { challenge_id, digest: "fixture" });
  await db.rpc("admit", { ...identity, challenge_id });
  return identity;
}
async function createProject(actor = owner) {
  const project_id = randomUUID();
  await db.rpc("create", {
    ...actor,
    project_id,
    operation_id: randomUUID(),
    title: "Fictional queue test",
  });
  for (const [section, keys] of [
    ["context", ["task", "desired", "current"]],
    ["audience", ["roles"]],
  ] as const)
    await db.rpc("save", {
      ...actor,
      project_id,
      section,
      operation_id: randomUUID(),
      base_revision: 1,
      data: {
        answers: Object.fromEntries(
          keys.map((k) => [k, { text: `Known ${k}`, status: "provided" }]),
        ),
        items: [],
      },
    });
  return project_id;
}
async function setup(path?: string) {
  db = await localDatabase(path);
  owner = await admit("designer@example.test");
  peer = await admit("peer@example.test");
  project = await createProject();
  await db.aiRpc("open_period", {
    starts_at: new Date(Date.now() - 60_000).toISOString(),
    ends_at: new Date(Date.now() + 86_400_000).toISOString(),
  });
}
beforeEach(async () => {
  persistedPath = undefined;
  await setup();
});
afterEach(async () => {
  await db.db.close();
  if (persistedPath) await rm(persistedPath, { recursive: true, force: true });
});
function provider(
  options: { repair?: boolean; fail?: Step; uncertain?: Step } = {},
) {
  const calls: Step[] = [];
  const simulated: SimulatedProvider = {
    kind: "simulated",
    async run({ step }) {
      calls.push(step);
      return {
        state:
          options.uncertain === step
            ? "uncertain"
            : options.fail === step
              ? "failed"
              : "completed",
        actualMicrousd: options.uncertain === step ? null : 10_000,
        result:
          options.uncertain === step || options.fail === step
            ? null
            : step === "review"
              ? { needs_repair: options.repair ?? false }
              : { simulated: true, text: step },
      };
    },
  };
  return { simulated, calls };
}
async function claim() {
  const claim_token = randomUUID();
  const result = await db.aiRpc("claim", { claim_token });
  return { ...result, identity: { job_id: result.job?.id, claim_token } };
}
async function expire() {
  await db.db.exec(
    "update app.ai_jobs set lease_until=now()-interval '1 second' where state='running'",
  );
}

test("idempotent enqueue pins the exact saved input and enforces current readiness/ownership", async () => {
  const body = intent();
  const first = await enqueue(body);
  expect(await enqueue(body)).toEqual(first);
  expect(
    (
      await enqueue({
        ...body,
        expected_revisions: { ...expected, context: 3 },
      })
    ).error,
  ).toBe("operation_reused");
  expect((await enqueue(intent(), peer)).error).toBe("not_found");
  expect((await read(first.job_id, peer)).error).toBe("not_found");
  expect(
    (await enqueue(intent({ expected_revisions: { ...expected, context: 1 } })))
      .error,
  ).toBe("ai_inputs_changed");
  await db.rpc("save", {
    ...owner,
    project_id: project,
    section: "audience",
    operation_id: randomUUID(),
    base_revision: 2,
    data: {
      answers: { roles: { text: "Some notes", status: "unknown" } },
      items: [],
    },
  });
  expect(
    (
      await enqueue(
        intent({ expected_revisions: { ...expected, audience: 3 } }),
      )
    ).error,
  ).toBe("ai_inputs_incomplete");
  expect((await read(first.job_id)).job.inputs_changed).toBe(true);
  for (let rev = 3; rev < 15; rev++)
    await db.rpc("save", {
      ...owner,
      project_id: project,
      section: "audience",
      operation_id: randomUUID(),
      base_revision: rev,
      data: {
        answers: { roles: { text: "\t\n\u00a0", status: "provided" } },
        items: [],
      },
    });
  expect(
    (
      await enqueue(
        intent({ expected_revisions: { ...expected, audience: 15 } }),
      )
    ).error,
  ).toBe("ai_inputs_incomplete");
  expect(
    (
      await db.db.query(
        "select v.id from app.versions v join app.ai_job_inputs i on i.version_id=v.id where i.job_id=$1",
        [first.job_id],
      )
    ).rows,
  ).toHaveLength(7);
});

test("only one global job runs, whole pipeline stays inside its reservation, duplicate deliveries recover results", async () => {
  const first = await enqueue();
  const peerProject = await createProject(peer);
  const second = await enqueue(intent(), peer, peerProject);
  const active = await claim();
  expect(active.job.id).toBe(first.job_id);
  expect((await claim()).error).toBe("ai_busy");
  expect((await budget()).reserved_microusd).toBe(1_000_000);
  await expire(); // no paid intent: safe to resume without an additional reservation
  const f = provider({ repair: true });
  expect((await runNextSimulation(db.aiRpc, f.simulated)).state).toBe(
    "completed",
  );
  expect(f.calls).toEqual(["generate", "review", "repair"]);
  expect(await budget()).toMatchObject({
    spent_microusd: 30_000,
    reserved_microusd: 0,
    paused: false,
  });
  const completed = await read(first.job_id);
  expect(completed.job.result.text).toBe("repair");
  expect(JSON.stringify(completed)).not.toMatch(
    /claim_token|input_snapshot|lease_until/,
  );
  const f2 = provider();
  expect((await runNextSimulation(db.aiRpc, f2.simulated)).job_id).toBe(
    second.job_id,
  );
  expect((await runNextSimulation(db.aiRpc, f2.simulated)).idle).toBe(true);
  expect(f2.calls).toEqual(["generate", "review"]);
});

test("money is integer microdollars; reservations block overspending and usage warns at $16", async () => {
  await db.db.exec("update app.ai_periods set spent_microusd=16000000");
  expect((await budget()).warning).toBe(true);
  await db.db.exec("update app.ai_periods set spent_microusd=19000000");
  await enqueue();
  await claim();
  expect((await enqueue()).error).toBe("ai_budget_exceeded");
  expect(await budget()).toMatchObject({
    spent_microusd: 19_000_000,
    reserved_microusd: 1_000_000,
  });
  expect(
    (
      await db.aiRpc("open_period", {
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 100_000).toISOString(),
      })
    ).error,
  ).toBe("invalid_period");
});

test("a saved paid intent with lost acknowledgement cannot lead to another provider invocation", async () => {
  const queued = await enqueue();
  const f = provider();
  const interrupted: Rpc = async (op, p) => {
    const r = await db.aiRpc(op, p);
    if (op === "begin_call") throw Error("lost acknowledgement");
    return r;
  };
  expect((await runNextSimulation(interrupted, f.simulated)).error).toBe(
    "ai_interrupted",
  );
  expect(f.calls).toEqual([]);
  await expire();
  expect((await runNextSimulation(db.aiRpc, f.simulated)).error).toBe(
    "ai_cost_pending",
  );
  expect((await enqueue()).error).toBe("ai_cost_pending");
  expect((await budget()).reserved_microusd).toBe(1_000_000);
  expect(
    (
      await db.aiRpc("reconcile", {
        job_id: queued.job_id,
        actual_microusd: 0,
        reference: "checked no provider request",
      })
    ).error,
  ).toBe("invalid_reconciliation");
  expect(
    await db.aiRpc("reconcile", {
      job_id: queued.job_id,
      actual_microusd: 0,
      worker_stopped: true,
      reference: "fixture: worker stopped; no provider invocation",
    }),
  ).toEqual({ ok: true });
  expect(await budget()).toMatchObject({
    spent_microusd: 0,
    reserved_microusd: 0,
    paused: false,
  });
  expect((await runNextSimulation(db.aiRpc, f.simulated)).idle).toBe(true); // no automatic retry
});

test("expired in-flight claims pause the pilot; stale workers can save a late result but cannot spend again", async () => {
  const q = await enqueue();
  const a = await claim();
  const call_id = randomUUID();
  expect(
    (await db.aiRpc("begin_call", { ...a.identity, step: "generate", call_id }))
      .execute,
  ).toBe(true);
  expect(
    (
      await db.aiRpc("begin_call", {
        ...a.identity,
        step: "generate",
        call_id: randomUUID(),
      })
    ).execute,
  ).toBe(false);
  await expire();
  expect((await claim()).error).toBe("ai_cost_pending");
  expect(
    (
      await db.aiRpc("begin_call", {
        ...a.identity,
        step: "review",
        call_id: randomUUID(),
      })
    ).error,
  ).toBe("ai_claim_lost");
  expect(
    (
      await db.aiRpc("outcome", {
        call_id,
        state: "completed",
        actual_microusd: 50_000,
        result: { simulated: true, text: "late result" },
      })
    ).error,
  ).toBe("ai_cost_pending");
  expect(await budget()).toMatchObject({
    paused: true,
    reserved_microusd: 1_000_000,
    spent_microusd: 0,
  });
  await db.aiRpc("reconcile", {
    job_id: q.job_id,
    actual_microusd: 50_000,
    worker_stopped: true,
    reference: "fixture provider receipt",
  });
  expect((await read(q.job_id)).job.artifacts.generate.text).toBe(
    "late result",
  );
  expect(await budget()).toMatchObject({
    spent_microusd: 50_000,
    reserved_microusd: 0,
  });
  const retry = await enqueue(intent({ retry_of: q.job_id }));
  const f = provider();
  expect((await runNextSimulation(db.aiRpc, f.simulated)).state).toBe(
    "completed",
  );
  expect(f.calls).toEqual(["review"]); // completed generation recovered, never generated twice
  expect((await read(retry.job_id)).job.result.text).toBe("late result");
});

test("a completed result survives a lost outcome acknowledgement and a fresh worker", async () => {
  const q = await enqueue();
  let interrupted = false;
  const rpc: Rpc = async (op, p) => {
    const r = await db.aiRpc(op, p);
    if (op === "outcome" && !interrupted) {
      interrupted = true;
      throw Error("lost ack");
    }
    return r;
  };
  const f = provider();
  expect((await runNextSimulation(rpc, f.simulated)).error).toBe(
    "ai_interrupted",
  );
  expect(f.calls).toEqual(["generate"]);
  await expire();
  expect((await runNextSimulation(db.aiRpc, f.simulated)).state).toBe(
    "completed",
  );
  expect(f.calls).toEqual(["generate", "review"]);
  expect((await read(q.job_id)).job.result.text).toBe("generate");
  expect((await budget()).spent_microusd).toBe(20_000);
});

test("known failures require explicit retries, reuse completed steps, and allow only the bounded repair", async () => {
  const q = await enqueue();
  const f = provider({ fail: "review" });
  expect((await runNextSimulation(db.aiRpc, f.simulated)).state).toBe("failed");
  expect((await budget()).reserved_microusd).toBe(0);
  expect((await runNextSimulation(db.aiRpc, f.simulated)).idle).toBe(true);
  const retry = await enqueue(intent({ retry_of: q.job_id }));
  const repair = provider({ repair: true });
  expect((await runNextSimulation(db.aiRpc, repair.simulated)).state).toBe(
    "completed",
  );
  expect(repair.calls).toEqual(["review", "repair"]);
  expect((await read(retry.job_id)).job.artifacts.generate.text).toBe(
    "generate",
  );
});

test("uncertain transport and unexpected overcharge preserve reservations and pause all later jobs", async () => {
  const q = await enqueue();
  const f: SimulatedProvider = {
    kind: "simulated",
    run: async () => {
      throw Error("private provider error");
    },
  };
  expect((await runNextSimulation(db.aiRpc, f)).error).toBe("ai_cost_pending");
  expect((await read(q.job_id)).job.state).toBe("cost_pending");
  await db.aiRpc("reconcile", {
    job_id: q.job_id,
    actual_microusd: 700_000,
    worker_stopped: true,
    reference: "fixture overcharge",
  });
  expect(await budget()).toMatchObject({
    spent_microusd: 700_000,
    reserved_microusd: 0,
    paused: true,
  });
  expect((await claim()).error).toBe("ai_cost_pending");
});

test("revoked access and deleted projects cannot start further calls or be recreated by late results", async () => {
  const q = await enqueue();
  const a = await claim();
  await db.rpc("pilot_set", { email: owner.email, active: false });
  expect(
    (
      await db.aiRpc("begin_call", {
        ...a.identity,
        step: "generate",
        call_id: randomUUID(),
      })
    ).error,
  ).toBe("unauthorized");
  await expire();
  expect((await claim()).cancelled).toBe(q.job_id);
  expect((await read(q.job_id)).error).toBe("unauthorized");
  await db.rpc("pilot_set", { email: owner.email, active: true });
  await db.db.exec(
    "update app.challenges set issued_at=now()-interval '61 seconds'",
  );
  owner = await admit(owner.email, owner.user_id);
  const q2 = await enqueue();
  expect(q2.job_id).toBeDefined();
  const a2 = await claim();
  const call_id = randomUUID();
  await db.aiRpc("begin_call", { ...a2.identity, step: "generate", call_id });
  await db.db.query("delete from app.projects where id=$1", [project]);
  await db.aiRpc("outcome", {
    call_id,
    state: "completed",
    actual_microusd: 10_000,
    result: { text: "must not restore deleted content" },
  });
  await db.aiRpc("finish", { ...a2.identity, success: false });
  const deleted = (
    await db.db.query<{ input_snapshot: unknown; result: unknown }>(
      "select input_snapshot,result from app.ai_jobs where id=$1",
      [q2.job_id],
    )
  ).rows[0];
  expect(deleted).toEqual({ input_snapshot: null, result: null });
  expect(
    (
      await db.db.query<{ result: unknown }>(
        "select * from app.ai_calls where job_id=$1",
        [q2.job_id],
      )
    ).rows[0].result,
  ).toBe(null);
  expect((await budget()).spent_microusd).toBe(10_000);
});

test("uncertain costs stay paused across a period boundary; no calendar reset releases them", async () => {
  await enqueue();
  const f = provider({ uncertain: "generate" });
  await runNextSimulation(db.aiRpc, f.simulated);
  await db.db.exec(
    "update app.ai_periods set ends_at=now()-interval '1 second',starts_at=now()-interval '2 days'",
  );
  await db.aiRpc("open_period", {
    starts_at: new Date().toISOString(),
    ends_at: new Date(Date.now() + 86_400_000).toISOString(),
  });
  expect(await budget()).toMatchObject({ spent_microusd: 0, paused: true });
  expect((await budget()).pending_microusd).toBe(1_000_000);
  expect((await enqueue()).error).toBe("ai_cost_pending");
  expect((await claim()).error).toBe("ai_cost_pending");
});

test("intent, reservations, sessions and recoverable artifacts survive closing and reopening the database", async () => {
  await db.db.close();
  persistedPath = await mkdtemp(join(tmpdir(), "aipoweredid-queue-"));
  await setup(persistedPath);
  const q = await enqueue();
  let interrupted = false;
  const lost: Rpc = async (op, p) => {
    const r = await db.aiRpc(op, p);
    if (op === "outcome" && !interrupted) {
      interrupted = true;
      throw Error("process stopped after saving result");
    }
    return r;
  };
  const f = provider();
  await runNextSimulation(lost, f.simulated);
  await db.db.close();
  db = await localDatabase(persistedPath);
  expect((await read(q.job_id)).job.artifacts.generate.text).toBe("generate");
  expect((await budget()).reserved_microusd).toBe(990_000);
  await expire();
  expect((await runNextSimulation(db.aiRpc, f.simulated)).state).toBe(
    "completed",
  );
  expect(f.calls).toEqual(["generate", "review"]);
  expect((await budget()).spent_microusd).toBe(20_000);
});

test("cost settlement is idempotent and a reported overcharge is recorded for reconciliation", async () => {
  const q = await enqueue();
  const a = await claim();
  const call_id = randomUUID();
  await db.aiRpc("begin_call", { ...a.identity, step: "generate", call_id });
  const outcome = {
    call_id,
    state: "completed",
    actual_microusd: 25_001,
    result: { simulated: true, text: "saved" },
  };
  expect(await db.aiRpc("outcome", outcome)).toEqual({ ok: true });
  expect(await db.aiRpc("outcome", outcome)).toEqual({ ok: true });
  expect(
    (await db.aiRpc("outcome", { ...outcome, actual_microusd: 1 })).error,
  ).toBe("operation_reused");
  expect(await budget()).toMatchObject({
    spent_microusd: 25_001,
    reserved_microusd: 974_999,
  });
  expect(
    (await db.aiRpc("finish", { ...a.identity, success: true })).error,
  ).toBe("ai_step_blocked");
  const next_id = randomUUID();
  await db.aiRpc("begin_call", {
    ...a.identity,
    step: "review",
    call_id: next_id,
  });
  expect(
    (
      await db.aiRpc("outcome", {
        call_id: next_id,
        state: "completed",
        actual_microusd: 300_000,
        result: { needs_repair: false },
      })
    ).error,
  ).toBe("ai_cost_pending");
  expect(
    (
      await db.db.query<{ observed_microusd: number }>(
        "select observed_microusd from app.ai_calls where id=$1",
        [next_id],
      )
    ).rows[0].observed_microusd,
  ).toBe(300_000);
  expect((await read(q.job_id)).job.state).toBe("cost_pending");
  const saved = await db.rpc("save", {
    ...owner,
    project_id: project,
    section: "evidence",
    operation_id: randomUUID(),
    base_revision: 1,
    data: {
      answers: {
        notes: {
          text: "Manual editing remains available.",
          status: "provided",
        },
      },
      items: [],
    },
  });
  expect(saved.record.revision).toBe(2);
});

test("provider input excludes inactive Other text and invalid review output fails without a regeneration loop", async () => {
  await db.rpc("save", {
    ...owner,
    project_id: project,
    section: "evidence",
    operation_id: randomUUID(),
    base_revision: 1,
    data: {
      answers: {
        causes: {
          text: "Tools or access",
          choices: ["Tools or access"],
          other: "Dormant private note must not be sent",
          status: "provided",
        },
      },
      items: [],
    },
  });
  const q = await enqueue(
    intent({ expected_revisions: { ...expected, evidence: 2 } }),
  );
  const calls: Step[] = [];
  const f: SimulatedProvider = {
    kind: "simulated",
    run: async ({ step, input }) => {
      calls.push(step);
      expect(JSON.stringify(input)).not.toContain("Dormant private note");
      expect(input.evidence.data.answers.causes.other).toBe("");
      return {
        state: "completed",
        actualMicrousd: 10_000,
        result:
          step === "review"
            ? { unusable: "no decision" }
            : { simulated: true, text: "draft" },
      };
    },
  };
  expect((await runNextSimulation(db.aiRpc, f)).state).toBe("failed");
  expect(calls).toEqual(["generate", "review"]);
  expect((await budget()).spent_microusd).toBe(20_000);
  expect((await read(q.job_id)).job.artifacts.generate.text).toBe("draft");
  expect((await runNextSimulation(db.aiRpc, f)).idle).toBe(true);
});

test("a stale pre-call worker is fenced and a closed period cannot authorize another step", async () => {
  await enqueue();
  const old = await claim();
  await expire();
  const fresh = await claim();
  expect(
    (
      await db.aiRpc("begin_call", {
        ...old.identity,
        step: "generate",
        call_id: randomUUID(),
      })
    ).error,
  ).toBe("ai_claim_lost");
  await db.db.exec(
    "update app.ai_periods set starts_at=now()-interval '2 days',ends_at=now()-interval '1 second'",
  );
  expect(
    (
      await db.aiRpc("begin_call", {
        ...fresh.identity,
        step: "generate",
        call_id: randomUUID(),
      })
    ).error,
  ).toBe("ai_period_closed");
  await expire();
  expect((await claim()).cancelled).toBe(fresh.job.id);
  expect(
    (
      await db.db.query<{ n: string }>(
        "select sum(reserved_microusd) as n from app.ai_jobs",
      )
    ).rows[0].n,
  ).toBe("0");
  expect((await enqueue()).error).toBe("ai_budget_unconfigured");
});

test("owner HTTP routes reject client pricing/actors; worker and accounting controls are not exposed", async () => {
  const handler = createHandler({
    rpc: db.rpc,
    identity: { issue: async () => owner, verify: async () => owner },
    secret: "fixture-secret-more-than-thirty-two-characters",
    origin: "https://workspace.test",
    sendCode: async () => {},
    ai: { rpc: db.aiRpc, policy: simulationPolicy },
  });
  const request = (path: string, method = "GET", body?: unknown) =>
    handler(
      new Request("https://workspace.test/api" + path, {
        method,
        headers: { origin: "https://workspace.test" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    );
  expect(
    (
      await request(`/projects/${project}/ai-jobs`, "POST", {
        ...intent(),
        allowance_microusd: 1,
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await request(`/projects/${project}/ai-jobs`, "POST", {
        ...intent(),
        user_id: peer.user_id,
      })
    ).status,
  ).toBe(400);
  const created = await request(
    `/projects/${project}/ai-jobs`,
    "POST",
    intent(),
  );
  expect(created.status).toBe(202);
  const q = await created.json();
  expect(
    (await request(`/projects/${project}/ai-jobs/${q.job_id}`)).status,
  ).toBe(200);
  expect((await request("/ai/budget")).status).toBe(200);
  expect(
    (await request("/ai/claim", "POST", { claim_token: randomUUID() })).status,
  ).toBe(404);
  expect(
    (await request("/ai/reconcile", "POST", { worker_stopped: true })).status,
  ).toBe(404);
  const hosted = createHandler({
    rpc: db.rpc,
    identity: { issue: async () => owner, verify: async () => owner },
    secret: "fixture-secret-more-than-thirty-two-characters",
    origin: "https://workspace.test",
    sendCode: async () => {},
  });
  expect(
    (await hosted(new Request("https://workspace.test/api/ai/budget"))).status,
  ).toBe(503);
  for (const role of ["anon", "authenticated"]) {
    await db.db.exec(`set role ${role}`);
    await expect(db.db.query("select * from app.ai_jobs")).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      db.db.query("select public.ai_rpc('claim','{}')"),
    ).rejects.toThrow(/permission denied/);
    await db.db.exec("reset role");
  }
});
