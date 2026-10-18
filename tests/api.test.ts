import { beforeAll, afterAll, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { localDatabase } from "../scripts/local-db";
import { createHandler, type Identity } from "../server/api";
let db: Awaited<ReturnType<typeof localDatabase>>,
  handler: (r: Request) => Promise<Response>;
let code = "",
  email = "designer@example.test";
const issued: Identity = {
  email,
  user_id: randomUUID(),
  session_id: randomUUID(),
  access: "verified-by-adapter",
  refresh: "refresh",
};
const request = (path: string, method = "GET", body?: unknown, cookie = "") =>
  handler(
    new Request("https://workspace.test/api" + path, {
      method,
      headers: {
        origin: "https://workspace.test",
        cookie,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
beforeAll(async () => {
  db = await localDatabase();
  await db.rpc("pilot_set", { email, active: true });
  handler = createHandler({
    rpc: db.rpc,
    origin: "https://workspace.test",
    secret: "test-secret-at-least-thirty-two-characters",
    sendCode: async (_mail, value) => {
      code = value;
    },
    identity: {
      issue: async () => issued,
      verify: async (access) => {
        if (access !== issued.access) throw Error("unauthorized");
        return issued;
      },
    },
  });
});
afterAll(async () => {
  await db.db.close();
});
test("origin checks, code admission, secure cookies, strict save and current eligibility", async () => {
  expect(
    (
      await handler(
        new Request("https://workspace.test/api/auth/request-code", {
          method: "POST",
          headers: { origin: "https://evil.test" },
          body: JSON.stringify({ email }),
        }),
      )
    ).status,
  ).toBe(403);
  const requested = await request("/auth/request-code", "POST", { email });
  expect(requested.status).toBe(200);
  const { challenge_id } = await requested.json();
  expect(code).toMatch(/^\d{6}$/);
  const nativeCookie = "aid_access=" + issued.access;
  expect(
    (await request("/projects", "GET", undefined, nativeCookie)).status,
  ).toBe(401);
  const login = await request("/auth/verify-code", "POST", {
    challenge_id,
    code,
  });
  expect(login.status).toBe(200);
  expect(login.headers.getSetCookie().join(";")).toContain(
    "HttpOnly; SameSite=Strict; Secure",
  );
  const stored = await db.db.query<{ digest: string }>(
    "select digest from app.challenges",
  );
  expect(stored.rows[0].digest).not.toBe(code);
  expect(
    (await request("/auth/verify-code", "POST", { challenge_id, code })).status,
  ).toBe(400);
  const project_id = randomUUID();
  const created = await request(
    "/projects",
    "POST",
    { project_id, operation_id: randomUUID(), title: "API test" },
    nativeCookie,
  );
  expect(created.status).toBe(201);
  const readiness = async () =>
    (
      await (
        await request(`/projects/${project_id}`, "GET", undefined, nativeCookie)
      ).json()
    ).ai_readiness;
  const saveAnswers = async (
    section: string,
    revision: number,
    answers: Record<string, { text: string; status: string }>,
  ) => {
    const result = await request(
      `/projects/${project_id}/${section}`,
      "PUT",
      {
        operation_id: randomUUID(),
        base_revision: revision,
        data: { answers, items: [] },
      },
      nativeCookie,
    );
    expect(result.status).toBe(200);
  };
  expect((await readiness()).ready).toBe(false);
  const contextAnswers = Object.fromEntries(
    ["task", "desired", "current"].map((field) => [
      field,
      { text: `Known ${field}`, status: "provided" },
    ]),
  );
  await saveAnswers("context", 1, contextAnswers);
  await saveAnswers("audience", 1, {
    roles: { text: "Notes do not establish the audience", status: "unknown" },
  });
  expect(await readiness()).toEqual({
    ready: false,
    missing: [{ section: "audience", field: "roles" }],
  });
  await saveAnswers("audience", 2, {
    roles: { text: "   ", status: "provided" },
  });
  expect((await readiness()).ready).toBe(false); // Unchecking unknown cannot bypass an empty answer.
  await saveAnswers("audience", 3, {
    roles: { text: "Field technicians", status: "provided" },
  });
  expect((await readiness()).ready).toBe(true); // Optional evaluation details remain unanswered.
  await saveAnswers("context", 2, {
    ...contextAnswers,
    task: { text: "Hypothesis only", status: "unknown" },
  });
  expect(await readiness()).toEqual({
    ready: false,
    missing: [{ section: "context", field: "task" }],
  });
  expect(
    (
      await request(
        `/projects/${project_id}/context`,
        "PUT",
        {
          operation_id: randomUUID(),
          base_revision: 1,
          data: { answers: {}, items: [] },
          reviewed: true,
        },
        nativeCookie,
      )
    ).status,
  ).toBe(400);
  await db.rpc("pilot_set", { email, active: false });
  expect(
    (await request("/projects", "GET", undefined, nativeCookie)).status,
  ).toBe(401);
});
test("unknown email receives generic response without sending a code", async () => {
  code = "unchanged";
  const r = await request("/auth/request-code", "POST", {
    email: "outside@example.test",
  });
  expect(r.status).toBe(200);
  expect(code).toBe("unchanged");
});
