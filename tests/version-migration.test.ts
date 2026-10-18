import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";

test("upgrading a populated workspace trims old drafts without changing current content or reviewed versions", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610180001_workspace.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const project = randomUUID(),
      actor = randomUUID();
    await db.query(
      "insert into app.projects(id,owner_id,title) values($1,$2,'Existing project')",
      [project, actor],
    );
    await db.query(
      "insert into app.records values($1,'context',15,'{\"answers\":{},\"items\":[]}'::jsonb)",
      [project],
    );
    await db.query(
      "insert into app.versions(project_id,section,revision,data,actor_id,operation_id) select $1,'context',n,jsonb_build_object('revision',n),$2,gen_random_uuid() from generate_series(1,15) as n",
      [project, actor],
    );
    await db.query(
      "insert into app.reviews(version_id,reviewer_id) select id,$2 from app.versions where project_id=$1 and revision=1",
      [project, actor],
    );
    const before = (await db.query("select * from app.records")).rows;
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610180002_version_retention.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect((await db.query("select * from app.records")).rows).toEqual(before);
    expect(
      (
        await db.query<{ revision: number }>(
          "select revision from app.versions order by revision desc",
        )
      ).rows.map((v) => v.revision),
    ).toEqual([15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 1]);
  } finally {
    await db.close();
  }
});
