import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const [action, value] = process.argv.slice(2);
if (!(
  action === "list" ||
  (["add", "remove"].includes(action) && z.email().safeParse(value).success)
))
  throw Error("Usage: npm run pilot -- list | add <email> | remove <email>");
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
  throw Error("Load server-side Supabase settings in this terminal first.");
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
if (action === "list") {
  // Includes emails added by open demo sign-up; remove any that should not keep access.
  const { data, error } = await client.rpc("operator_rpc", {
    operation: "pilot_list",
    payload: {},
  });
  if (error || data?.error)
    throw Error(
      "Could not list pilot access. Check service setup and migration 6.",
    );
  for (const a of data.accounts)
    console.log(
      `${a.active ? "approved" : "removed "}  ${a.signed_in ? "signed in" : "never signed in"}  ${String(a.projects).padStart(2)} project(s)  ${a.email}`,
    );
} else {
  const { data, error } = await client.rpc("app_rpc", {
    operation: "pilot_set",
    payload: { email: value.toLowerCase(), active: action === "add" },
  });
  if (error || data?.error)
    throw Error("Could not update pilot access. Check service setup.");
  console.log(
    action === "add"
      ? "Pilot access approved."
      : "Pilot access removed; existing application sessions and review links ended.",
  );
}
