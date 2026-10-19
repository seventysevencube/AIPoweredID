import { expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { providers } from "../server/providers";
import { configuration, databaseConfiguration } from "../server/config";
import { createHandler } from "../server/api";

// Fictional credentials and responses; the installed Supabase SDK runs against
// this deterministic transport. No account, network request, or email is used.
const env = {
  APP_ORIGIN: "https://workspace.test",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_fictional_server_key",
  AUTH_CODE_SECRET: "fictional-test-secret-more-than-thirty-two-characters",
  RESEND_API_KEY: "re_fictional_email_key",
  EMAIL_FROM: "AIPoweredID <signin@workspace.test>",
};
const user = { id: randomUUID(), email: "designer@example.test" };
const sessionId = randomUUID();
function token(sub = user.id, session_id = sessionId) {
  return [
    { alg: "HS256", typ: "JWT" },
    {
      sub,
      session_id,
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: "authenticated",
    },
    "fictional-signature",
  ]
    .map((part, index) =>
      index === 2
        ? part
        : Buffer.from(JSON.stringify(part)).toString("base64url"),
    )
    .join(".");
}
const session = (
  access = token(),
  refresh = "rotated-refresh-token",
  owner = user,
) => ({
  access_token: access,
  refresh_token: refresh,
  token_type: "bearer",
  expires_in: 3600,
  user: owner,
});
type Reply = { path: string; body: unknown; status?: number };
function fixture(replies: Reply[]) {
  const requests: Request[] = [];
  const transport: typeof fetch = async (input, init) => {
    const req = new Request(input, init);
    requests.push(req);
    const reply = replies.shift();
    expect(
      reply,
      `Unexpected provider request: ${new URL(req.url).pathname}`,
    ).toBeDefined();
    expect(new URL(req.url).pathname + new URL(req.url).search).toBe(
      reply!.path,
    );
    return Response.json(reply!.body, { status: reply!.status ?? 200 });
  };
  return { adapter: providers(env, transport), requests, replies };
}

test("configuration diagnostics name settings without revealing values", () => {
  expect(configuration(env).APP_ORIGIN).toBe(env.APP_ORIGIN);
  expect(
    databaseConfiguration({
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY,
    }),
  ).toEqual({
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: env.SUPABASE_SECRET_KEY,
  });
  for (const APP_ORIGIN of [
    "not-a-url",
    "http://workspace.test",
    "https://workspace.test/path",
    "https://person:password@workspace.test",
    "https://workspace.test?secret=private",
  ]) {
    expect(() => configuration({ ...env, APP_ORIGIN })).toThrow(
      /^Service setup required\. Check: APP_ORIGIN\.$/,
    );
  }
  expect(() =>
    configuration({
      ...env,
      AUTH_CODE_SECRET: "private",
      EMAIL_FROM: "invalid\nprivate",
    }),
  ).toThrow("Check: AUTH_CODE_SECRET, EMAIL_FROM.");
  expect(() => providers({})).toThrow("Service setup required");
});

test("native identity is issued through the SDK with no native link or token emailed", async () => {
  const access = token();
  const f = fixture([
    {
      path: "/auth/v1/admin/generate_link",
      body: {
        ...user,
        hashed_token: "internal-native-hash",
        action_link: "https://private-native-link.test",
        email_otp: "never-emailed",
      },
    },
    { path: "/auth/v1/verify", body: session(access) },
  ]);
  expect(await f.adapter.identity.issue(user.email)).toEqual({
    user_id: user.id,
    session_id: sessionId,
    email: user.email,
    access,
    refresh: "rotated-refresh-token",
  });
  expect(await f.requests[0].json()).toMatchObject({
    type: "magiclink",
    email: user.email,
  });
  expect(await f.requests[1].json()).toMatchObject({
    token_hash: "internal-native-hash",
    type: "email",
  });
  expect(f.requests[0].headers.get("apikey")).toBe(env.SUPABASE_SECRET_KEY);
  expect(f.replies).toHaveLength(0);
});

test("verified access is checked remotely and expired access refreshes to the returned native session", async () => {
  const access = token();
  const f = fixture([{ path: "/auth/v1/user", body: user }]);
  expect(
    (await f.adapter.identity.verify(access, "existing-refresh")).refresh,
  ).toBe("existing-refresh");
  expect(f.requests[0].headers.get("authorization")).toBe(`Bearer ${access}`);
  const refreshed = token();
  const r = fixture([
    {
      path: "/auth/v1/user",
      status: 401,
      body: { msg: "expired", code: "bad_jwt" },
    },
    {
      path: "/auth/v1/token?grant_type=refresh_token",
      body: session(refreshed),
    },
  ]);
  expect(await r.adapter.identity.verify(access, "old-refresh")).toMatchObject({
    access: refreshed,
    refresh: "rotated-refresh-token",
    session_id: sessionId,
  });
  expect(await r.requests[1].json()).toEqual({ refresh_token: "old-refresh" });
});

test("invalid refresh and mismatched native identity are rejected", async () => {
  const invalid = fixture([
    {
      path: "/auth/v1/token?grant_type=refresh_token",
      status: 400,
      body: { msg: "invalid", code: "refresh_token_not_found" },
    },
  ]);
  await expect(
    invalid.adapter.identity.verify("", "invalid-refresh"),
  ).rejects.toThrow("unauthorized");
  const mismatch = fixture([
    { path: "/auth/v1/user", body: { ...user, id: randomUUID() } },
  ]);
  await expect(
    mismatch.adapter.identity.verify(token(), "refresh"),
  ).rejects.toThrow("unauthorized");
  const wrongEmail = fixture([
    {
      path: "/auth/v1/admin/generate_link",
      body: { ...user, hashed_token: "internal-hash" },
    },
    {
      path: "/auth/v1/verify",
      body: session(token(), "refresh", {
        ...user,
        email: "other@example.test",
      }),
    },
  ]);
  await expect(wrongEmail.adapter.identity.issue(user.email)).rejects.toThrow(
    "identity_unavailable",
  );
});

test("temporary verification failure preserves cookies and never grants app access", async () => {
  const f = fixture([
    { path: "/auth/v1/user", status: 503, body: { msg: "paused" } },
  ]);
  let calls = 0;
  const handler = createHandler({
    ...f.adapter,
    rpc: async () => {
      calls++;
      throw Error("must not run");
    },
  });
  const response = await handler(
    new Request("https://workspace.test/api/projects", {
      headers: {
        cookie: `aid_access=${token()}; aid_refresh=existing-refresh`,
      },
    }),
  );
  expect(response.status).toBe(503);
  expect(response.headers.getSetCookie()).toEqual([]);
  expect(await response.json()).toMatchObject({
    error: "session_unavailable",
  });
  expect(calls).toBe(0);
  expect(f.requests).toHaveLength(1); // Outages do not trigger an unnecessary refresh.
});

test("Resend receives only the app code and failures are normalized", async () => {
  const f = fixture([{ path: "/emails", body: { id: "fictional-mail" } }]);
  await f.adapter.sendCode(user.email, "001234");
  const sent = await f.requests[0].json();
  expect(sent).toMatchObject({ from: env.EMAIL_FROM, to: [user.email] });
  expect(sent.text).toContain("001234");
  expect(JSON.stringify(sent)).not.toContain(env.SUPABASE_SECRET_KEY);
  expect(f.requests[0].headers.get("authorization")).toBe(
    `Bearer ${env.RESEND_API_KEY}`,
  );
  const failed = fixture([
    { path: "/emails", status: 429, body: { message: "provider detail" } },
  ]);
  await expect(failed.adapter.sendCode(user.email, "001234")).rejects.toThrow(
    "email_unavailable",
  );
  const offline = providers(env, async () => {
    throw Error("private provider detail");
  });
  await expect(offline.sendCode(user.email, "001234")).rejects.toThrow(
    "email_unavailable",
  );
});

test("database RPC uses the privileged server client and hides provider errors", async () => {
  const f = fixture([
    { path: "/rest/v1/rpc/app_rpc", body: { error: "unauthorized" } },
  ]);
  expect(
    await f.adapter.rpc("session", { user_id: user.id, session_id: sessionId }),
  ).toEqual({ error: "unauthorized" });
  expect(await f.requests[0].json()).toMatchObject({
    operation: "session",
    payload: { user_id: user.id },
  });
  expect(f.requests[0].headers.get("apikey")).toBe(env.SUPABASE_SECRET_KEY);
  const failed = fixture([
    {
      path: "/rest/v1/rpc/app_rpc",
      status: 500,
      body: { message: "private database detail" },
    },
  ]);
  await expect(failed.adapter.rpc("session", {})).rejects.toThrow(
    "database_unavailable",
  );
});
