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
  const queue = await db.query<{ exists: boolean }>(
    "select to_regprocedure('public.ai_rpc(text,jsonb)') is not null as exists",
  );
  if (!queue.rows[0].exists)
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610190003_ai_queue.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  // Upgrade the local worker lease without resetting projects or accounting.
  const lease = await db.query<{ definition: string }>(
    "select pg_get_functiondef('public.ai_rpc(text,jsonb)'::regprocedure) as definition",
  );
  if (
    !lease.rows[0].definition.includes("180 seconds") ||
    !lease.rows[0].definition.includes("workflow_hash")
  ) {
    const source = await readFile(
      new URL(
        "../supabase/migrations/202610190003_ai_queue.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const start = source.indexOf("create function public.ai_rpc");
    const end = source.indexOf("revoke all on function public.ai_rpc");
    await db.exec(
      source
        .slice(start, end)
        .replace("create function", "create or replace function"),
    );
  }
  const workflow = await db.query<{ exists: boolean }>(
    "select to_regprocedure('public.workflow_rpc(text,jsonb)') is not null as exists",
  );
  if (!workflow.rows[0].exists)
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610190004_workflow.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  const completion = await db.query<{ exists: boolean }>(
    "select to_regprocedure('public.source_rpc(text,jsonb)') is not null as exists",
  );
  if (!completion.rows[0].exists)
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610190005_mvp_completion.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  const operator = await db.query<{ definition: string }>(
    "select pg_get_functiondef('public.operator_rpc(text,jsonb)'::regprocedure) as definition",
  );
  if (!operator.rows[0].definition.includes("pilot_list"))
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610200006_operator_tools.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  const call =
    (name: string): Rpc =>
    async (operation, payload) =>
      (
        await db.query<{ result: any }>(
          `select public.${name}($1,$2::jsonb) as result`,
          [operation, JSON.stringify(payload)],
        )
      ).rows[0].result;
  const workflowRpc: Rpc = async (operation, payload) =>
    (
      await db.query<{ result: any }>(
        "select public.workflow_rpc($1,$2::jsonb) as result",
        [operation, JSON.stringify(payload)],
      )
    ).rows[0].result;
  const rpc: Rpc = async (operation, payload) => {
    const result = await db.query<{ result: any }>(
      "select public.app_rpc($1,$2::jsonb) as result",
      [operation, JSON.stringify(payload)],
    );
    return result.rows[0].result;
  };
  const aiRpc: Rpc = async (operation, payload) => {
    const result = await db.query<{ result: any }>(
      "select public.ai_rpc($1,$2::jsonb) as result",
      [operation, JSON.stringify(payload)],
    );
    return result.rows[0].result;
  };
  return {
    db,
    rpc,
    aiRpc,
    workflowRpc,
    sourceRpc: call("source_rpc"),
    reviewRpc: call("review_rpc"),
    operatorRpc: call("operator_rpc"),
  };
}
