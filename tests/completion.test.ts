import { afterEach, beforeEach, expect, test } from "vitest";
import { randomUUID, createHash } from "node:crypto";
import { localDatabase } from "../scripts/local-db";

let d: Awaited<ReturnType<typeof localDatabase>>;
async function designer(email: string) {
  const actor = { user_id: randomUUID(), session_id: randomUUID() };
  const challenge_id = randomUUID();
  await d.rpc("pilot_set", { email, active: true });
  await d.rpc("request_code", { email, challenge_id, digest: "test" });
  await d.rpc("verify_code", { challenge_id, digest: "test" });
  await d.rpc("admit", { email, ...actor, challenge_id });
  const project_id = randomUUID();
  await d.rpc("create", {
    ...actor,
    project_id,
    operation_id: randomUUID(),
    title: "Owner project",
  });
  return { actor, project_id };
}
const hash = (t: string) => createHash("sha256").update(t).digest("hex");
beforeEach(async () => {
  d = await localDatabase();
});
afterEach(async () => {
  await d.db.close();
});

test("new stage records exist and sources are private to the owner", async () => {
  const owner = await designer("owner@example.test");
  const other = await designer("other@example.test");
  const opened = await d.workflowRpc("open", {
    ...owner.actor,
    project_id: owner.project_id,
  });
  for (const s of ["sources", "preferences", "development"])
    expect(opened.records[s].revision).toBe(1);
  const source_id = randomUUID();
  const add = {
    ...owner.actor,
    project_id: owner.project_id,
    source_id,
    name: "Routing guide.docx",
    kind: "docx",
    content: "Route billing complaints to Billing.",
    refs: [{ label: "Heading: Billing" }],
    usable: true,
  };
  expect((await d.sourceRpc("add", add)).sources).toHaveLength(1);
  // A repeated add is idempotent.
  expect((await d.sourceRpc("add", add)).sources).toHaveLength(1);
  const listed = await d.sourceRpc("list", {
    ...owner.actor,
    project_id: owner.project_id,
  });
  expect(listed.sources[0]).not.toHaveProperty("content");
  expect(
    (
      await d.sourceRpc("texts", {
        ...owner.actor,
        project_id: owner.project_id,
      })
    ).sources[0].content,
  ).toContain("Billing");
  expect(
    (
      await d.sourceRpc("list", {
        ...other.actor,
        project_id: owner.project_id,
      })
    ).error,
  ).toBe("not_found");
  expect(
    (
      await d.sourceRpc("add", {
        ...other.actor,
        project_id: other.project_id,
        source_id,
        name: "x",
        kind: "text",
        content: "x",
        usable: true,
      })
    ).error,
  ).toBe("operation_reused");
  expect(
    (
      await d.sourceRpc("remove", {
        ...owner.actor,
        project_id: owner.project_id,
        source_id,
      })
    ).sources,
  ).toEqual([]);
  await expect(
    d.db.query("select * from app.sources", []).then((r) => r.rows),
  ).resolves.toHaveLength(0);
});

test("guest links show a fixed snapshot, accept comments, and stop on revoke, expiry or access removal", async () => {
  const owner = await designer("owner@example.test");
  const token = "a".repeat(43);
  const link_id = randomUUID();
  const snapshot = {
    sections: ["design-objectives"],
    versions: {},
    records: {},
  };
  await d.reviewRpc("create", {
    ...owner.actor,
    project_id: owner.project_id,
    link_id,
    token_hash: hash(token),
    snapshot,
  });
  const guest = await d.reviewRpc("guest_open", { token_hash: hash(token) });
  expect(guest.snapshot).toEqual(snapshot);
  expect(
    (await d.reviewRpc("guest_open", { token_hash: hash("wrong") })).error,
  ).toBe("link_unavailable");
  const comment = {
    token_hash: hash(token),
    comment_id: randomUUID(),
    target: { section: "design-objectives", item: "LO-1" },
    display_name: " Sam ",
    body: " Clarify the condition. ",
  };
  expect(
    (await d.reviewRpc("guest_comment", comment)).comments[0],
  ).toMatchObject({ display_name: "Sam", body: "Clarify the condition." });
  await d.reviewRpc("guest_comment", comment);
  const owned = await d.reviewRpc("list", {
    ...owner.actor,
    project_id: owner.project_id,
  });
  expect(owned.links[0].comments).toHaveLength(1);
  expect(
    (
      await d.reviewRpc("guest_comment", {
        ...comment,
        comment_id: randomUUID(),
        target: {},
      })
    ).error,
  ).toBe("invalid_request");
  await d.db.query(
    "update app.review_links set expires_at=now()-interval '1 second'",
  );
  expect(
    (await d.reviewRpc("guest_open", { token_hash: hash(token) })).error,
  ).toBe("link_unavailable");
  await d.db.query(
    "update app.review_links set expires_at=now()+interval '1 day'",
  );
  await d.reviewRpc("revoke", {
    ...owner.actor,
    project_id: owner.project_id,
    link_id,
  });
  expect(
    (await d.reviewRpc("guest_open", { token_hash: hash(token) })).error,
  ).toBe("link_unavailable");
  // Removing the designer's access deactivates their remaining links.
  const second = "b".repeat(43);
  await d.reviewRpc("create", {
    ...owner.actor,
    project_id: owner.project_id,
    link_id: randomUUID(),
    token_hash: hash(second),
    snapshot,
  });
  expect(
    (await d.reviewRpc("guest_open", { token_hash: hash(second) })).title,
  ).toBe("Owner project");
  await d.rpc("pilot_set", { email: "owner@example.test", active: false });
  await d.rpc("pilot_set", { email: "owner@example.test", active: true });
  expect(
    (await d.reviewRpc("guest_open", { token_hash: hash(second) })).error,
  ).toBe("link_unavailable");
});

test("operator deletion requires the owner's email and removes project content", async () => {
  const owner = await designer("owner@example.test");
  const project_id = owner.project_id;
  await d.rpc("save", {
    ...owner.actor,
    project_id,
    section: "context",
    base_revision: 1,
    operation_id: randomUUID(),
    data: {
      answers: { task: { text: "Private task", status: "provided" } },
      items: [],
    },
  });
  await d.workflowRpc("open", { ...owner.actor, project_id });
  await d.rpc("save", {
    ...owner.actor,
    project_id,
    section: "analysis-brief",
    base_revision: 1,
    operation_id: randomUUID(),
    data: { answers: { gap: { text: "Gap", status: "provided" } }, items: [] },
  });
  await d.workflowRpc("accept_analysis", {
    ...owner.actor,
    project_id,
    revision: 2,
    reviewed: true,
  });
  await d.sourceRpc("add", {
    ...owner.actor,
    project_id,
    source_id: randomUUID(),
    name: "Guide",
    kind: "text",
    content: "Text",
    usable: true,
  });
  const token = "c".repeat(43);
  await d.reviewRpc("create", {
    ...owner.actor,
    project_id,
    link_id: randomUUID(),
    token_hash: hash(token),
    snapshot: {},
  });
  expect(
    (
      await d.operatorRpc("delete_project", {
        project_id,
        owner_email: "someone@example.test",
      })
    ).error,
  ).toBe("not_found");
  expect(
    (
      await d.operatorRpc("list_projects", {
        owner_email: "Owner@Example.test",
      })
    ).projects,
  ).toHaveLength(1);
  expect(
    await d.operatorRpc("delete_project", {
      project_id,
      owner_email: "owner@example.test",
    }),
  ).toEqual({ ok: true });
  for (const table of [
    "projects",
    "records",
    "versions",
    "reviews",
    "workflow_acceptances",
    "sources",
    "review_links",
  ])
    expect(
      (await d.db.query(`select * from app.${table}`)).rows,
      table,
    ).toHaveLength(0);
  expect(
    (
      await d.db.query(
        "select * from app.receipts where request::text like $1",
        [`%${project_id}%`],
      )
    ).rows,
  ).toHaveLength(0);
  expect(
    (await d.reviewRpc("guest_open", { token_hash: hash(token) })).error,
  ).toBe("link_unavailable");
});

test("browser roles cannot reach the new tables or functions", async () => {
  for (const role of ["anon", "authenticated"]) {
    await d.db.exec(`set role ${role}`);
    for (const table of ["sources", "review_links", "review_comments"])
      await expect(d.db.query(`select * from app.${table}`)).rejects.toThrow(
        /permission denied/,
      );
    for (const fn of [
      "source_rpc",
      "review_rpc",
      "operator_rpc",
      "workflow_rpc",
    ])
      await expect(
        d.db.query(`select public.${fn}('list','{}')`),
      ).rejects.toThrow(/permission denied/);
    await d.db.exec("reset role");
  }
  const rls = await d.db.query<{ relname: string; relrowsecurity: boolean }>(
    "select relname, relrowsecurity from pg_class where relnamespace='app'::regnamespace and relkind='r'",
  );
  expect(rls.rows.filter((r) => !r.relrowsecurity)).toEqual([]);
});
