// Explicit loopback-only development service. Never imported by a deployed function.
import { existsSync } from "node:fs";
if (process.env.LOCAL_BROWSER_TEST !== "1" && existsSync(".env.local"))
  process.loadEnvFile(".env.local");
import { createServer } from "node:http";
import { randomUUID, createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { localDatabase } from "./local-db";
import { openAIProvider, livePolicy } from "../server/ai/openai";
import {
  drainQueue,
  runNextSimulation,
  simulationPolicy,
} from "../server/ai/queue";
import { fixtureProvider } from "./local-fixture-ai";
import { createHandler, type Identity } from "../server/api";
await mkdir(".local-data", { recursive: true });
const { rpc, aiRpc, workflowRpc, sourceRpc, reviewRpc } = await localDatabase(
  process.env.LOCAL_BROWSER_TEST === "1" ? undefined : ".local-data/workspace",
);
for (const email of [
  "designer@example.test",
  "peer@example.test",
  "tabs@example.test",
  "design@example.test",
  "flow@example.test",
  "sources@example.test",
  "develop@example.test",
  "share@example.test",
  "pause@example.test",
])
  await rpc("pilot_set", { email, active: true });
const sessions = new Map<string, Identity>();
const inbox = new Map<string, { code: string; time: string }>();
// Browser tests use a fictional AI stand-in: same queue and ledger, no network or charge.
const fixtureAI = process.env.LOCAL_BROWSER_TEST === "1";
const fixture = fixtureProvider();
// Local AI uses the same durable ledger; a calendar period is explicitly opened once.
if (process.env.OPENAI_API_KEY || fixtureAI) {
  const check = await aiRpc("budget", {});
  if (
    check.error === "unauthorized" ||
    check.error === "ai_budget_unconfigured"
  ) {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    await aiRpc("open_period", {
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
    });
  }
}
const handler = createHandler({
  rpc,
  workflowRpc,
  sourceRpc,
  reviewRpc,
  ...(fixtureAI
    ? {
        ai: { rpc: aiRpc, policy: simulationPolicy },
        dispatchAI: async () => {
          void drainQueue(aiRpc, fixture);
        },
      }
    : process.env.OPENAI_API_KEY
      ? {
          ai: { rpc: aiRpc, policy: livePolicy("analysis") },
          dispatchAI: async () => {
            void runNextSimulation(
              aiRpc,
              openAIProvider(process.env.OPENAI_API_KEY!),
            );
          },
        }
      : {}),
  origin: "http://127.0.0.1:5173",
  local: true,
  openSignup: process.env.OPEN_SIGNUP === "on",
  secret: "local-development-only-do-not-use-in-production",
  identity: {
    async issue(email) {
      const hash = createHash("sha256").update(email).digest("hex");
      const user_id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
      const value = {
        email,
        user_id,
        session_id: randomUUID(),
        access: randomUUID(),
        refresh: randomUUID(),
      };
      sessions.set(value.access, value);
      return value;
    },
    async verify(access) {
      const s = sessions.get(access);
      if (!s) throw Error("unauthorized");
      return s;
    },
  },
  async sendCode(email, code) {
    inbox.set(email, { code, time: new Date().toISOString() });
  },
});
createServer(async (req, res) => {
  try {
    if (req.url === "/api/local-inbox" && req.method === "GET") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      res.end(JSON.stringify(Object.fromEntries(inbox)));
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 2_000_000) {
        res.writeHead(413);
        res.end();
        return;
      }
      chunks.push(chunk);
    }
    const request = new Request(`http://127.0.0.1:3001${req.url}`, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
    });
    const result = await handler(request);
    res.statusCode = result.status;
    result.headers.forEach((v, k) => {
      if (k !== "set-cookie") res.setHeader(k, v);
    });
    const cookies = result.headers.getSetCookie();
    if (cookies.length) res.setHeader("Set-Cookie", cookies);
    res.end(await result.text());
  } catch {
    res.writeHead(500);
    res.end("Local development service failed");
  }
}).listen(3001, "127.0.0.1", () =>
  console.log(
    "Local development API: fictional accounts only; no email delivery or live Supabase.",
  ),
);
