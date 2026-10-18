import { createHmac, randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import { recordDataSchema, sections } from "../src/model";

export type Rpc = (
  operation: string,
  payload: Record<string, unknown>,
) => Promise<any>;
export type Identity = {
  user_id: string;
  session_id: string;
  email: string;
  access: string;
  refresh: string;
};
export interface IdentityProvider {
  issue(email: string): Promise<Identity>;
  verify(access: string, refresh: string): Promise<Identity>;
}
export type Dependencies = {
  rpc: Rpc;
  identity: IdentityProvider;
  sendCode: (email: string, code: string) => Promise<void>;
  secret: string;
  origin: string;
  local?: boolean;
};
const emailSchema = z
  .object({ email: z.string().trim().toLowerCase().pipe(z.email()) })
  .strict();
const verifySchema = z
  .object({ challenge_id: z.uuid(), code: z.string().regex(/^\d{6}$/) })
  .strict();
const saveSchema = z
  .object({
    operation_id: z.uuid(),
    base_revision: z.number().int().positive(),
    data: recordDataSchema,
  })
  .strict();
const restoreSchema = z
  .object({
    operation_id: z.uuid(),
    base_revision: z.number().int().positive(),
    version_id: z.uuid(),
  })
  .strict();
const errorMessages: Record<string, string> = {
  unauthorized:
    "Please sign in again. Your recoverable edits are kept on this device.",
  rate_limited: "Please wait one minute before requesting another code.",
  code_invalid:
    "That code could not be verified. Check the code and try again.",
  code_expired:
    "This code is expired, replaced, used, or locked. Request a fresh code.",
  not_found: "This project or section is not available to your account.",
  conflict: "A newer version was saved. Review both copies before saving.",
  operation_reused:
    "This save identifier was already used for a different change.",
  invalid_request: "Check the information and try again.",
  too_large:
    "This change is too large to save. Keep a copy and shorten the entry.",
  email_unavailable:
    "The email provider did not confirm sending. Wait one minute, then request a new code.",
  identity_unavailable:
    "Sign-in could not be completed. Request a fresh code and try again.",
};
export function digest(secret: string, id: string, code: string) {
  return createHmac("sha256", secret).update(`${id}:${code}`).digest("hex");
}
function cookies(req: Request) {
  return Object.fromEntries(
    (req.headers.get("cookie") ?? "")
      .split(";")
      .map((s) => s.trim().split(/=(.*)/s).slice(0, 2))
      .filter((a) => a.length === 2),
  );
}
function sessionHeaders(session: Identity | null, secure: boolean) {
  const headers = new Headers();
  for (const [name, value] of [
    ["aid_access", session?.access ?? ""],
    ["aid_refresh", session?.refresh ?? ""],
  ])
    headers.append(
      "Set-Cookie",
      `${name}=${value}; Path=/; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}${session ? "" : "; Max-Age=0"}`,
    );
  return headers;
}
function response(body: unknown, status = 200, headers = new Headers()) {
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(JSON.stringify(body), { status, headers });
}
async function parseBody(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) throw new SyntaxError("Missing body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2_000_000) {
      await reader.cancel();
      throw Error("too_large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function createHandler(d: Dependencies) {
  if (d.secret.length < 32)
    throw new Error("A strong AUTH_CODE_SECRET is required");
  return async (req: Request): Promise<Response> => {
    try {
      if (
        req.method !== "GET" &&
        Number(req.headers.get("content-length") ?? 0) > 2_000_000
      )
        return response(
          {
            error: "too_large",
            message:
              "This change is too large to save. Keep a copy and shorten the entry.",
          },
          413,
        );
      const url = new URL(req.url);
      const path = url.pathname.replace(/^\/\.netlify\/functions\/api/, "/api");
      if (req.method !== "GET" && req.headers.get("origin") !== d.origin)
        return response(
          { error: "forbidden", message: "Request origin is not allowed." },
          403,
        );
      const rpc: Rpc = async (op, p) => {
        const r = await d.rpc(op, p);
        if (r.error) {
          const e = new Error(r.error) as Error & { detail: any };
          e.detail = r;
          throw e;
        }
        return r;
      };
      if (path === "/api/setup" && req.method === "GET")
        return response({ ready: true, mode: d.local ? "local" : "connected" });
      if (path === "/api/auth/request-code" && req.method === "POST") {
        const { email } = emailSchema.parse(await parseBody(req));
        const id = randomUUID();
        const code = String(randomInt(1000000)).padStart(6, "0");
        const r = await d.rpc("request_code", {
          email,
          challenge_id: id,
          digest: digest(d.secret, id, code),
        });
        if (r.error && r.error !== "not_eligible") throw new Error(r.error);
        if (!r.error) await d.sendCode(email, code);
        return response({
          challenge_id: id,
          message:
            "If this email is approved, a sign-in code has been sent. Codes expire after 10 minutes.",
        });
      }
      if (path === "/api/auth/verify-code" && req.method === "POST") {
        const { challenge_id, code } = verifySchema.parse(await parseBody(req));
        const r = await rpc("verify_code", {
          challenge_id,
          digest: digest(d.secret, challenge_id, code),
        });
        const identity = await d.identity.issue(r.email);
        await rpc("admit", {
          challenge_id,
          email: identity.email,
          user_id: identity.user_id,
          session_id: identity.session_id,
        });
        return response(
          { user: { id: identity.user_id, email: identity.email } },
          200,
          sessionHeaders(identity, !d.local),
        );
      }
      const cookie = cookies(req);
      let identity: Identity;
      try {
        identity = await d.identity.verify(
          cookie.aid_access ?? "",
          cookie.aid_refresh ?? "",
        );
      } catch {
        return response(
          { error: "unauthorized", message: errorMessages.unauthorized },
          401,
          sessionHeaders(null, !d.local),
        );
      }
      const actor = {
        user_id: identity.user_id,
        session_id: identity.session_id,
      };
      await rpc("session", actor);
      const headers = sessionHeaders(identity, !d.local);
      if (path === "/api/auth/session" && req.method === "GET")
        return response(
          { user: { id: identity.user_id, email: identity.email } },
          200,
          headers,
        );
      if (path === "/api/auth/signout" && req.method === "POST") {
        await rpc("signout", actor);
        return response({ ok: true }, 200, sessionHeaders(null, !d.local));
      }
      if (path === "/api/projects" && req.method === "GET")
        return response(await rpc("projects", actor), 200, headers);
      if (path === "/api/projects" && req.method === "POST") {
        const body = z
          .object({
            operation_id: z.uuid(),
            project_id: z.uuid(),
            title: z.string().max(300),
          })
          .strict()
          .parse(await parseBody(req));
        return response(
          await rpc("create", { ...body, ...actor }),
          201,
          headers,
        );
      }
      const m = path.match(
        /^\/api\/projects\/([^/]+)(?:\/([^/]+)(?:\/(history|restore))?)?$/,
      );
      if (!m)
        return response(
          { error: "not_found", message: "This page is unavailable." },
          404,
        );
      const project_id = z.uuid().parse(m[1]);
      if (!m[2] && req.method === "GET")
        return response(
          await rpc("open", { project_id, ...actor }),
          200,
          headers,
        );
      if (m[2] === "resume" && req.method === "POST") {
        const body = z
          .object({ section: z.enum(sections) })
          .strict()
          .parse(await parseBody(req));
        return response(
          await rpc("resume", { ...body, project_id, ...actor }),
          200,
          headers,
        );
      }
      const section = z.enum(sections).parse(m[2]);
      if (m[3] === "history" && req.method === "GET")
        return response(
          await rpc("history", { section, project_id, ...actor }),
          200,
          headers,
        );
      if (m[3] === "restore" && req.method === "POST") {
        const body = restoreSchema.parse(await parseBody(req));
        return response(
          await rpc("restore", { ...body, section, project_id, ...actor }),
          200,
          headers,
        );
      }
      if (!m[3] && req.method === "PUT") {
        const body = saveSchema.parse(await parseBody(req));
        if (
          section === "context" &&
          (body.data.answers.title?.text.length ?? 0) > 300
        )
          throw Error("invalid_request");
        return response(
          await rpc("save", { ...body, section, project_id, ...actor }),
          200,
          headers,
        );
      }
      return response({ error: "not_found" }, 404);
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError)
        return response(
          { error: "invalid_request", message: errorMessages.invalid_request },
          400,
        );
      const code = error instanceof Error ? error.message : "unavailable";
      const detail = (error as any)?.detail;
      const status =
        code === "unauthorized"
          ? 401
          : code === "not_found"
            ? 404
            : code === "conflict" || code === "operation_reused"
              ? 409
              : code === "rate_limited"
                ? 429
                : code === "too_large"
                  ? 413
                  : code.startsWith("code_")
                    ? 400
                    : 503;
      return response(
        {
          error: code in errorMessages ? code : "unavailable",
          message:
            errorMessages[code] ??
            "The service is unavailable. Your edits have not been confirmed saved. Please try again.",
          ...(code === "conflict" ? { record: detail.record } : {}),
        },
        status,
      );
    }
  };
}
