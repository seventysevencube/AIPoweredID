import { beforeAll, afterAll, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { localDatabase } from "../scripts/local-db";
let store: Awaited<ReturnType<typeof localDatabase>>;
let actor: { user_id: string; session_id: string };
const email = "designer@example.test";
const call = (op: string, p: Record<string, unknown> = {}) =>
  store.rpc(op, { ...actor, ...p });
async function challenge() {
  const id = randomUUID();
  await store.db.exec(
    "update app.challenges set issued_at=now()-interval '61 seconds'",
  );
  expect(
    await call("request_code", {
      email,
      challenge_id: id,
      digest: "hashed-code",
    }),
  ).toEqual({ ok: true });
  return id;
}
beforeAll(async () => {
  store = await localDatabase();
  await call("pilot_set", { email, active: true });
  const id = await challenge();
  await call("verify_code", { challenge_id: id, digest: "hashed-code" });
  actor = { user_id: randomUUID(), session_id: randomUUID() };
  expect(await call("admit", { email, challenge_id: id })).toEqual({
    ok: true,
  });
});
afterAll(async () => {
  await store.db.close();
});
test("single-use, expiry, five failures, resend and replacement are server enforced", async () => {
  const id = await challenge();
  expect(
    (
      await call("request_code", {
        email,
        challenge_id: randomUUID(),
        digest: "new",
      })
    ).error,
  ).toBe("rate_limited");
  for (let n = 1; n <= 5; n++)
    expect(
      (await call("verify_code", { challenge_id: id, digest: "wrong" })).error,
    ).toBe(n === 5 ? "code_expired" : "code_invalid");
  expect(
    (await call("verify_code", { challenge_id: id, digest: "hashed-code" }))
      .error,
  ).toBe("code_expired");
  const second = await challenge();
  expect(
    (await call("verify_code", { challenge_id: id, digest: "hashed-code" }))
      .error,
  ).toBe("code_invalid");
  await store.db.exec(
    "update app.challenges set expires_at=now()-interval '1 second'",
  );
  expect(
    (await call("verify_code", { challenge_id: second, digest: "hashed-code" }))
      .error,
  ).toBe("code_expired");
  const third = await challenge();
  const results = await Promise.all([
    call("verify_code", { challenge_id: third, digest: "hashed-code" }),
    call("verify_code", { challenge_id: third, digest: "hashed-code" }),
  ]);
  expect(results.filter((r) => r.email)).toHaveLength(1);
});
test("owner isolation, operation receipts, conflict and immutable history", async () => {
  const project_id = randomUUID(),
    operation_id = randomUUID();
  const request = { project_id, operation_id, title: "First project" };
  const created = await call("create", request);
  expect(await call("create", request)).toEqual(created);
  expect((await call("create", { ...request, title: "Other" })).error).toBe(
    "operation_reused",
  );
  const open = await call("open", { project_id });
  expect(Object.keys(open.records)).toHaveLength(7);
  const data = {
    answers: { title: { text: "Updated title", status: "provided" } },
    items: [],
  };
  const save = {
    project_id,
    section: "context",
    operation_id: randomUUID(),
    base_revision: 1,
    data,
  };
  const result = await call("save", save);
  expect(result.record.revision).toBe(2);
  expect(await call("save", save)).toEqual(result);
  expect(
    (await call("save", { ...save, operation_id: randomUUID() })).error,
  ).toBe("conflict");
  const history = await call("history", { project_id, section: "context" });
  expect(history.versions).toHaveLength(2);
  const old = history.versions[1];
  const restored = await call("restore", {
    project_id,
    section: "context",
    operation_id: randomUUID(),
    base_revision: 2,
    version_id: old.id,
  });
  expect(restored.record.revision).toBe(3);
  expect(restored.record.data).toEqual(old.data);
  expect(
    (await call("history", { project_id, section: "context" })).versions[2],
  ).toEqual(old);
  const saved = (await call("open", { project_id })).project.saved_at;
  await call("resume", { project_id, section: "audience" });
  expect((await call("open", { project_id })).project.saved_at).toBe(saved);
  const other = { user_id: randomUUID(), session_id: randomUUID() };
  expect((await call("open", { ...other, project_id })).error).toBe(
    "unauthorized",
  );
  await store.rpc("pilot_set", { email: "peer@example.test", active: true });
  const id = randomUUID();
  await store.rpc("request_code", {
    email: "peer@example.test",
    challenge_id: id,
    digest: "x",
  });
  await store.rpc("verify_code", { challenge_id: id, digest: "x" });
  await store.rpc("admit", {
    email: "peer@example.test",
    challenge_id: id,
    ...other,
  });
  expect((await call("open", { ...other, project_id })).error).toBe(
    "not_found",
  );
  await store.db.query(
    "insert into app.reviews(version_id,reviewer_id) values($1,$2)",
    [old.id, actor.user_id],
  );
  expect(
    (
      await store.db.query<{ revision: number }>(
        "select revision from app.versions v join app.reviews r on r.version_id=v.id",
      )
    ).rows[0].revision,
  ).toBe(1);
});
test("retention keeps ten recent versions per section, protects references and preserves retry/restore behavior", async () => {
  const project_id = randomUUID();
  await call("create", {
    project_id,
    operation_id: randomUUID(),
    title: "Retention",
  });
  const first = (await call("history", { project_id, section: "context" }))
    .versions[0];
  await store.db.query(
    "insert into app.reviews(version_id,reviewer_id) values($1,$2)",
    [first.id, actor.user_id],
  );
  const baseline = randomUUID();
  await store.db.query(
    "insert into app.baselines(id,project_id,stage,accepted_by) values($1,$2,'Analysis',$3)",
    [baseline, project_id, actor.user_id],
  );
  let oldRequest: Record<string, unknown> = {};
  let oldResult: any;
  let pruned: string = "";
  for (let base_revision = 1; base_revision < 15; base_revision++) {
    const request = {
      project_id,
      section: "context",
      operation_id: randomUUID(),
      base_revision,
      data: {
        answers: {
          title: { text: `Revision ${base_revision + 1}`, status: "provided" },
        },
        items: [],
      },
    };
    const saved = await call("save", request);
    const latest = (await call("history", { project_id, section: "context" }))
      .versions[0];
    if (base_revision === 1)
      await store.db.query(
        "insert into app.baseline_versions(baseline_id,version_id) values($1,$2)",
        [baseline, latest.id],
      );
    if (base_revision === 2) {
      oldRequest = request;
      oldResult = saved;
      pruned = latest.id;
    }
  }
  const history = (await call("history", { project_id, section: "context" }))
    .versions;
  expect(history.map((v: any) => v.revision)).toEqual([
    15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 2, 1,
  ]);
  expect(
    (await call("history", { project_id, section: "audience" })).versions,
  ).toHaveLength(1);
  expect(await call("save", oldRequest)).toEqual(oldResult);
  expect((await call("open", { project_id })).records.context.revision).toBe(
    15,
  );
  expect(
    (
      await call("restore", {
        project_id,
        section: "context",
        operation_id: randomUUID(),
        base_revision: 15,
        version_id: pruned,
      })
    ).error,
  ).toBe("not_found");
  const restored = await call("restore", {
    project_id,
    section: "context",
    operation_id: randomUUID(),
    base_revision: 15,
    version_id: history[9].id,
  });
  expect(restored.record.revision).toBe(16);
  expect(restored.record.data).toEqual(history[9].data);
  expect(
    (await call("history", { project_id, section: "context" })).versions.map(
      (v: any) => v.revision,
    ),
  ).toEqual([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 2, 1]);
});
test("native identity alone grants no access; removed pilot access revokes current admission", async () => {
  expect((await call("session", { session_id: randomUUID() })).error).toBe(
    "unauthorized",
  );
  await call("pilot_set", { email, active: false });
  expect((await call("projects")).error).toBe("unauthorized");
  expect(
    (
      await call("request_code", {
        email,
        challenge_id: randomUUID(),
        digest: "x",
      })
    ).error,
  ).toBe("not_eligible");
});
test("direct browser roles cannot read tables or call privileged RPC", async () => {
  for (const role of ["anon", "authenticated"]) {
    await store.db.exec(`set role ${role}`);
    await expect(store.db.query("select * from app.projects")).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      store.db.query("select public.app_rpc('projects','{}')"),
    ).rejects.toThrow(/permission denied/);
    await store.db.exec("reset role");
  }
});
