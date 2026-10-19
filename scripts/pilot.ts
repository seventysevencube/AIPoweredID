import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const [action, value] = process.argv.slice(2);
if (!["add", "remove"].includes(action) || !z.email().safeParse(value).success)
  throw Error("Usage: npm run pilot -- add|remove email");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
  throw Error("Load server-side Supabase settings in this terminal first.");
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
const { data, error } = await client.rpc("app_rpc", {
  operation: "pilot_set",
  payload: { email: value.toLowerCase(), active: action === "add" },
});
if (error || data?.error)
  throw Error("Could not update pilot access. Check service setup.");
console.log(
  action === "add"
    ? "Pilot access approved."
    : "Pilot access removed; existing application sessions revoked.",
);
