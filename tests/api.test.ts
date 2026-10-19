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
  const protectedVersion = (
    await db.rpc("history", {
      project_id,
      section: "context",
      user_id: issued.user_id,
      session_id: issued.session_id,
    })
  ).versions.at(-1);
  await db.db.query(
    "insert into app.reviews(version_id,reviewer_id) values($1,$2)",
    [protectedVersion.id, issued.user_id],
  );
  for (let revision = 3; revision < 15; revision++)
    await saveAnswers("context", revision, contextAnswers);
  const history = await (
    await request(
      `/projects/${project_id}/context/history`,
      "GET",
      undefined,
      nativeCookie,
    )
  ).json();
  expect(history.versions).toHaveLength(10);
  expect(history.versions.map((v: any) => v.revision)).toEqual([
    15, 14, 13, 12, 11, 10, 9, 8, 7, 6,
  ]);
  expect(
    (
      await db.db.query("select id from app.versions where id=$1", [
        protectedVersion.id,
      ])
    ).rows,
  ).toHaveLength(1);
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
test("open sign-up admits a new email only after its code verifies", async () => {
  const sent = new Map<string, string>();
  const sessions = new Map<string, Identity>();
  const open = createHandler({
    rpc: db.rpc,
    origin: "https://workspace.test",
    secret: "test-secret-at-least-thirty-two-characters",
    openSignup: true,
    sendCode: async (mail, value) => {
      sent.set(mail, value);
    },
    identity: {
      issue: async (mail) => {
        const value = {
          email: mail,
          user_id: randomUUID(),
          session_id: randomUUID(),
          access: randomUUID(),
          refresh: "refresh",
        };
        sessions.set(value.access, value);
        return value;
      },
      verify: async (access) => {
        const s = sessions.get(access);
        if (!s) throw Error("unauthorized");
        return s;
      },
    },
  });
  const call = (path: string, method = "GET", body?: unknown, cookie = "") =>
    open(
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
  expect((await (await call("/setup")).json()).open_signup).toBe(true);
  const newcomer = "Newcomer@Example.test";
  const requested = await call("/auth/request-code", "POST", {
    email: newcomer,
  });
  expect(requested.status).toBe(200);
  const { challenge_id, message } = await requested.json();
  expect(message).toContain("has been sent");
  const value = sent.get("newcomer@example.test")!;
  expect(value).toMatch(/^\d{6}$/);
  // The one-minute resend limit still applies to a newly registered email.
  expect(
    (await call("/auth/request-code", "POST", { email: newcomer })).status,
  ).toBe(429);
  const wrong = value === "000000" ? "111111" : "000000";
  expect(
    (await call("/auth/verify-code", "POST", { challenge_id, code: wrong }))
      .status,
  ).toBe(400);
  const login = await call("/auth/verify-code", "POST", {
    challenge_id,
    code: value,
  });
  expect(login.status).toBe(200);
  const user = (await login.json()).user;
  expect(user.email).toBe("newcomer@example.test");
  const cookie = "aid_access=" + sessions.values().next().value!.access;
  const projects = await call("/projects", "GET", undefined, cookie);
  expect(projects.status).toBe(200);
  // A new account starts with an empty, private project list.
  expect((await projects.json()).projects).toEqual([]);
});
