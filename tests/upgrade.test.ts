import { expect, test } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

// Migration 5 must apply on top of 1-4 without changing existing projects or drafts.
const migration = (name: string) =>
  readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");

test("migration 5 upgrades an existing database and preserves projects, drafts, acceptance and jobs", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role;",
    );
    for (const m of [
      "202610180001_workspace.sql",
      "202610180002_version_retention.sql",
      "202610190003_ai_queue.sql",
      "202610190004_workflow.sql",
    ])
      await db.exec(await migration(m));
    const call = async (fn: string, op: string, payload: unknown) =>
      (
        await db.query<{ r: any }>(`select public.${fn}($1,$2::jsonb) as r`, [
          op,
          JSON.stringify(payload),
        ])
      ).rows[0].r;
    const email = "existing@example.test",
      challenge_id = randomUUID(),
      actor = { user_id: randomUUID(), session_id: randomUUID() },
      project_id = randomUUID();
    await call("app_rpc", "pilot_set", { email, active: true });
    await call("app_rpc", "request_code", { email, challenge_id, digest: "d" });
    await call("app_rpc", "verify_code", { challenge_id, digest: "d" });
    await call("app_rpc", "admit", { email, ...actor, challenge_id });
    await call("app_rpc", "create", {
      ...actor,
      project_id,
      operation_id: randomUUID(),
      title: "Existing",
    });
    await call("workflow_rpc", "open", { ...actor, project_id });
    const brief = {
      answers: { gap: { text: "Existing brief", status: "provided" } },
      items: [],
    };
    await call("app_rpc", "save", {
      ...actor,
      project_id,
      section: "analysis-brief",
      base_revision: 1,
      operation_id: randomUUID(),
      data: brief,
    });
    await call("workflow_rpc", "accept_analysis", {
      ...actor,
      project_id,
      revision: 2,
      reviewed: true,
    });
    const objectives = {
      answers: { overview: { text: "Edited by designer", status: "provided" } },
      items: [
        {
          id: randomUUID(),
          answers: { code: { text: "LO-1", status: "provided" } },
        },
      ],
    };
    await call("app_rpc", "save", {
      ...actor,
      project_id,
      section: "design-objectives",
      base_revision: 1,
      operation_id: randomUUID(),
      data: objectives,
    });
    const before = await db.query(
      "select section, revision, data from app.records order by section",
    );
    const versions = await db.query(
      "select count(*)::int as n from app.versions",
    );

    await db.exec(await migration("202610190005_mvp_completion.sql"));

    const after = await call("workflow_rpc", "open", { ...actor, project_id });
    for (const row of before.rows as any[])
      expect(after.records[row.section], row.section).toMatchObject({
        revision: row.revision,
        data: row.data,
      });
    expect(after.accepted_revision).toBe(2);
    expect(after.accepted_data).toEqual(brief);
    for (const s of ["sources", "preferences", "development"])
      expect(after.records[s].revision).toBe(1);
    expect(
      (
        await db.query<{ n: number }>(
          "select count(*)::int as n from app.versions",
        )
      ).rows[0].n,
    ).toBe((versions.rows[0] as any).n + 3);
    expect(await call("source_rpc", "list", { ...actor, project_id })).toEqual({
      sources: [],
    });
    expect(
      (await call("review_rpc", "list", { ...actor, project_id })).links,
    ).toEqual([]);
    // Applying it twice fails loudly rather than silently changing data.
    await expect(
      db.exec(await migration("202610190005_mvp_completion.sql")),
    ).rejects.toThrow();
  } finally {
    await db.close();
  }
});
