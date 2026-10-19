import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import type { Rpc } from "../server/api";
export async function localDatabase(path?: string) {
  const db = new PGlite(path);
  const initialized = await db.query<{ exists: boolean }>(
    "select exists(select 1 from pg_namespace where nspname='app')",
  );
  if (!initialized.rows[0].exists) {
    await db.exec(
      "create role anon; create role authenticated; create role service_role;",
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610180001_workspace.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  }
  // Upgrade existing local workspaces without resetting their projects.
  const retention = await db.query<{ exists: boolean }>(
    "select exists(select 1 from pg_trigger where tgname='retain_section_versions' and tgrelid='app.versions'::regclass)",
  );
  if (!retention.rows[0].exists)
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610180002_version_retention.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  const rpc: Rpc = async (operation, payload) => {
    const result = await db.query<{ result: any }>(
      "select public.app_rpc($1,$2::jsonb) as result",
      [operation, JSON.stringify(payload)],
    );
    return result.rows[0].result;
  };
  return { db, rpc };
}
