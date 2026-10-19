import { afterAll, beforeAll, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { localDatabase } from "../scripts/local-db";
import { createHandler, type Identity } from "../server/api";

let d: Awaited<ReturnType<typeof localDatabase>>,
  handler: (r: Request) => Promise<Response>;
const email = "owner@example.test";
let owner: Identity;
const call = (path: string, method = "GET", body?: unknown, cookie = "") =>
  handler(
    new Request("https://workspace.test/api" + path, {
      method,
      headers: {
        origin: "https://workspace.test",
        cookie,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
beforeAll(async () => {
  d = await localDatabase();
  await d.rpc("pilot_set", { email, active: true });
  let code = "";
  handler = createHandler({
    rpc: d.rpc,
    workflowRpc: d.workflowRpc,
    sourceRpc: d.sourceRpc,
    reviewRpc: d.reviewRpc,
    origin: "https://workspace.test",
    secret: "test-secret-at-least-thirty-two-characters",
    sendCode: async (_m, value) => {
      code = value;
    },
    identity: {
      issue: async () => owner,
      verify: async (access) => {
        if (access !== owner.access) throw Error("unauthorized");
        return owner;
      },
    },
  });
  owner = {
    email,
    user_id: randomUUID(),
    session_id: randomUUID(),
    access: "owner-access",
    refresh: "r",
  };
  const { challenge_id } = await (
    await call("/auth/request-code", "POST", { email })
  ).json();
  expect(
    (await call("/auth/verify-code", "POST", { challenge_id, code })).status,
  ).toBe(200);
});
afterAll(async () => {
  await d.db.close();
});

test("review links share only chosen content, store no token, and check comment targets", async () => {
  const cookie = "aid_access=owner-access";
  const project_id = randomUUID();
  await call(
    "/projects",
    "POST",
    { project_id, operation_id: randomUUID(), title: "Shared" },
    cookie,
  );
  await call(`/projects/${project_id}/workflow`, "GET", undefined, cookie);
  const objective = randomUUID();
  await call(
    `/projects/${project_id}/design-objectives`,
    "PUT",
    {
      operation_id: randomUUID(),
      base_revision: 1,
      data: {
        answers: {
          overview: { text: "Objectives", status: "provided" },
          _basis: { text: "{}", status: "provided" },
        },
        items: [
          {
            id: objective,
            answers: { code: { text: "LO-1", status: "provided" } },
          },
        ],
      },
    },
    cookie,
  );
  const source_id = randomUUID();
  await call(
    `/projects/${project_id}/source-files`,
    "POST",
    { source_id, name: "Guide", kind: "text", content: "Route refunds." },
    cookie,
  );
  await call(
    `/projects/${project_id}/source-files`,
    "POST",
    {
      source_id: randomUUID(),
      name: "Private notes",
      kind: "text",
      content: "Do not share.",
    },
    cookie,
  );
  const created = await call(
    `/projects/${project_id}/reviews`,
    "POST",
    { sections: ["design-objectives"], sources: [source_id] },
    cookie,
  );
  expect(created.status).toBe(200);
  const { token, links } = await created.json();
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(links[0].active).toBe(true);
  const stored = await d.db.query<{ token_hash: string; snapshot: any }>(
    "select token_hash, snapshot from app.review_links",
  );
  expect(stored.rows[0].token_hash).not.toContain(token);
  expect(JSON.stringify(stored.rows[0].snapshot)).not.toContain(token);
  const opened = await (await call("/review/open", "POST", { token })).json();
  expect(opened.snapshot.sections).toEqual(["design-objectives"]);
  expect(
    opened.snapshot.records["design-objectives"].answers._basis,
  ).toBeUndefined();
  expect(opened.snapshot.records["analysis-brief"]).toBeUndefined();
  expect(opened.snapshot.sources).toEqual([
    { name: "Guide", kind: "text", text: "Route refunds." },
  ]);
  const comment = {
    token,
    comment_id: randomUUID(),
    target: { section: "design-objectives", item: objective, label: "LO-1" },
    display_name: "Sam",
    body: "Clarify the condition.",
  };
  expect((await call("/review/comment", "POST", comment)).status).toBe(200);
  for (const target of [
    { section: "design-objectives", item: randomUUID() },
    { section: "design-plan" },
  ])
    expect(
      (
        await call("/review/comment", "POST", {
          ...comment,
          comment_id: randomUUID(),
          target,
        })
      ).status,
    ).toBe(400);
  expect((await call("/review/open", "POST", { token: "short" })).status).toBe(
    400,
  );
  expect(
    (await call("/review/open", "POST", { token: "x".repeat(43) })).status,
  ).toBe(422);
  // A different designer's session cannot list or revoke these links.
  expect(
    (await call(`/projects/${project_id}/reviews`, "GET", undefined, ""))
      .status,
  ).toBe(401);
  const revoked = await call(
    `/projects/${project_id}/reviews/${links[0].id}/revoke`,
    "POST",
    {},
    cookie,
  );
  expect((await revoked.json()).links[0].active).toBe(false);
  expect((await call("/review/open", "POST", { token })).status).toBe(422);
});
