import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { describeStatus, microusd, monthPeriod } from "../server/ai/operator";
// Pilot operator: AI budget and queue. Never prints keys or project content.
const [action, ...args] = process.argv.slice(2);
const usage = `Usage:
  npm run ai -- status
  npm run ai -- open-month YYYY-MM
  npm run ai -- reconcile <job-id> <confirmed-dollars> "<reference>" --worker-stopped`;
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
  throw Error("Load server-side Supabase settings in this terminal first.");
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
async function call(fn: string, operation: string, payload: object) {
  const { data, error } = await client.rpc(fn, { operation, payload });
  if (error) throw Error("Could not reach the database. Check service setup.");
  return data;
}
if (action === "status") {
  const s = await call("operator_rpc", "ai_status", {});
  if (s.error) throw Error("The status request was refused.");
  console.log(describeStatus(s));
} else if (action === "open-month" && args.length === 1) {
  const r = await call("ai_rpc", "open_period", monthPeriod(args[0]));
  if (r.error === "invalid_period")
    throw Error("That month overlaps a budget month that is already open.");
  if (r.error) throw Error("The request was refused.");
  console.log(`Opened the $20 AI budget month ${args[0]}.`);
} else if (
  action === "reconcile" &&
  args.length === 4 &&
  args[3] === "--worker-stopped" &&
  z.uuid().safeParse(args[0]).success &&
  args[2].trim()
) {
  // Only after checking the provider's usage page and that no worker is still running.
  const r = await call("ai_rpc", "reconcile", {
    job_id: args[0],
    actual_microusd: microusd(args[1]),
    reference: args[2].trim(),
    worker_stopped: true,
  });
  if (r.error)
    throw Error(
      "Not reconciled: that job is not the paused job, or its charge is already confirmed.",
    );
  console.log(
    "Charge recorded. The job is marked failed so the designer can try again; AI requests resume unless the charge exceeded its limit.",
  );
} else throw Error(usage);
