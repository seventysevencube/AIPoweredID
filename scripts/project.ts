import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
// Pilot operator: list an owner's projects, or delete one after verifying the owner's request.
const [action, ...args] = process.argv.slice(2);
const usage =
  "Usage: npm run project -- list <owner-email> | delete <project-id> <owner-email>";
if (!(
  (action === "list" && z.email().safeParse(args[0]).success) ||
  (action === "delete" &&
    z.uuid().safeParse(args[0]).success &&
    z.email().safeParse(args[1]).success)
))
  throw Error(usage);
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
  throw Error("Load server-side Supabase settings in this terminal first.");
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
const { data, error } = await client.rpc("operator_rpc", {
  operation: action === "list" ? "list_projects" : "delete_project",
  payload:
    action === "list"
      ? { owner_email: args[0] }
      : { project_id: args[0], owner_email: args[1] },
});
if (error) throw Error("Could not reach the database. Check service setup.");
if (data?.error === "not_found")
  throw Error("No project with that ID belongs to that owner email.");
if (data?.error) throw Error("The request was refused.");
if (action === "list")
  for (const p of data.projects)
    console.log(`${p.id}  ${p.saved_at.slice(0, 10)}  ${p.title}`);
else
  console.log(
    "Project deleted: review links stopped and its records, versions, sources and comments were removed from the active app.",
  );
