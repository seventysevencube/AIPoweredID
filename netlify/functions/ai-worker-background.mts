import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { configuration } from "../../server/config";
import { runNextSimulation } from "../../server/ai/queue";
import { openAIProvider } from "../../server/ai/openai";
export default async (req: Request) => {
  const secret = process.env.AUTH_CODE_SECRET ?? "";
  const supplied = req.headers.get("X-Worker-Secret") ?? "";
  if (
    !secret ||
    supplied.length !== secret.length ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))
  )
    return new Response(null, { status: 403 });
  if (!process.env.OPENAI_API_KEY) return new Response(null, { status: 503 });
  const env = configuration(process.env);
  const c = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const rpc = async (operation: string, payload: Record<string, unknown>) => {
    const { data, error } = await c.rpc("ai_rpc", { operation, payload });
    if (error) throw Error("database_unavailable");
    return data;
  };
  for (let n = 0; n < 5; n++) {
    const result = await runNextSimulation(
      rpc,
      openAIProvider(process.env.OPENAI_API_KEY),
    );
    if (result.error || result.idle || result.cancelled) break;
  }
  return new Response(null, { status: 200 });
};
