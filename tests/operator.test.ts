import { afterEach, beforeEach, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { localDatabase } from "../scripts/local-db";
import { describeStatus, microusd, monthPeriod } from "../server/ai/operator";
import {
  enqueueAnalysis,
  runNextSimulation,
  simulationPolicy,
} from "../server/ai/queue";
import { sections } from "../src/model";

let d: Awaited<ReturnType<typeof localDatabase>>;
beforeEach(async () => {
  d = await localDatabase();
});
afterEach(async () => {
  await d.db.close();
});

test("budget months and confirmed charges are parsed exactly", () => {
  expect(monthPeriod("2026-11")).toEqual({
    starts_at: "2026-11-01T00:00:00.000Z",
    ends_at: "2026-12-01T00:00:00.000Z",
  });
  expect(monthPeriod("2026-12").ends_at).toBe("2027-01-01T00:00:00.000Z");
  for (const bad of ["2026-13", "26-11", "2026-1", "November"])
    expect(() => monthPeriod(bad)).toThrow();
  expect(microusd("0.0123")).toBe(12_300);
  expect(microusd("$1.5")).toBe(1_500_000);
  expect(microusd("0")).toBe(0);
  for (const bad of ["-1", "0.1234567", "abc", "1e3"])
    expect(() => microusd(bad)).toThrow();
});

test("operator views list accounts and show a paused job that can then be reconciled", async () => {
  const email = "pilot@example.test",
    actor = { user_id: randomUUID(), session_id: randomUUID() },
    challenge_id = randomUUID(),
    project_id = randomUUID();
  await d.rpc("pilot_set", { email, active: true });
  await d.rpc("pilot_set", {
    email: "demo-visitor@example.test",
    active: true,
  });
  await d.rpc("request_code", { email, challenge_id, digest: "x" });
  await d.rpc("verify_code", { challenge_id, digest: "x" });
  await d.rpc("admit", { email, ...actor, challenge_id });
  await d.rpc("create", {
    ...actor,
    project_id,
    operation_id: randomUUID(),
    title: "P",
  });
  const accounts = (await d.operatorRpc("pilot_list", {})).accounts;
  expect(accounts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        email,
        active: true,
        signed_in: true,
        projects: 1,
      }),
      expect.objectContaining({
        email: "demo-visitor@example.test",
        signed_in: false,
        projects: 0,
      }),
    ]),
  );
  // No month open: status says so plainly.
  expect(describeStatus(await d.operatorRpc("ai_status", {}))).toContain(
    "No budget month is open now",
  );
  const month = new Date().toISOString().slice(0, 7);
  expect(await d.aiRpc("open_period", monthPeriod(month))).toHaveProperty(
    "period_id",
  );
  expect((await d.aiRpc("open_period", monthPeriod(month))).error).toBe(
    "invalid_period",
  );
  for (const [section, keys] of [
    ["context", ["task", "desired", "current"]],
    ["audience", ["roles"]],
  ] as const)
    await d.rpc("save", {
      ...actor,
      project_id,
      section,
      base_revision: 1,
      operation_id: randomUUID(),
      data: {
        answers: Object.fromEntries(
          keys.map((k) => [k, { text: "Known", status: "provided" }]),
        ),
        items: [],
      },
    });
  const queued = await enqueueAnalysis(
    { rpc: d.aiRpc, policy: { ...simulationPolicy, task: "analysis" } },
    actor,
    project_id,
    {
      request_id: randomUUID(),
      expected_revisions: Object.fromEntries(
        sections.map((s) => [s, ["context", "audience"].includes(s) ? 2 : 1]),
      ),
    },
  );
  // The provider's answer is lost: the charge is uncertain and AI pauses.
  await runNextSimulation(d.aiRpc, {
    kind: "simulated",
    run: async () => ({
      state: "uncertain",
      actualMicrousd: null,
      result: null,
    }),
  });
  const status = await d.operatorRpc("ai_status", {});
  expect(status.pause_reason).toBe("cost_confirmation_pending");
  expect(status.jobs).toEqual([
    expect.objectContaining({ id: queued.job_id, state: "cost_pending" }),
  ]);
  const text = describeStatus(status);
  expect(text).toContain("AI is PAUSED");
  expect(text).toContain(queued.job_id);
  expect(text).toContain("generate: uncertain, limit $0.6000");
  expect(
    await d.aiRpc("reconcile", {
      job_id: queued.job_id,
      actual_microusd: microusd("0.0123"),
      reference: "provider usage page, checked by operator",
      worker_stopped: true,
    }),
  ).toEqual({ ok: true });
  const after = await d.operatorRpc("ai_status", {});
  expect(after.pause_reason).toBeNull();
  expect(after.jobs).toEqual([]);
  expect(after.period.spent_microusd).toBe(12_300);
});

test("operator deletion and project listing still work after migration 6", async () => {
  const email = "owner@example.test",
    actor = { user_id: randomUUID(), session_id: randomUUID() },
    challenge_id = randomUUID(),
    project_id = randomUUID();
  await d.rpc("pilot_set", { email, active: true });
  await d.rpc("request_code", { email, challenge_id, digest: "x" });
  await d.rpc("verify_code", { challenge_id, digest: "x" });
  await d.rpc("admit", { email, ...actor, challenge_id });
  await d.rpc("create", {
    ...actor,
    project_id,
    operation_id: randomUUID(),
    title: "P",
  });
  expect(
    (await d.operatorRpc("list_projects", { owner_email: email })).projects,
  ).toHaveLength(1);
  expect(
    await d.operatorRpc("delete_project", { project_id, owner_email: email }),
  ).toEqual({ ok: true });
  expect((await d.operatorRpc("pilot_list", {})).accounts[0].projects).toBe(0);
});
