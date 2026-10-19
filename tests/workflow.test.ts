import { test, expect } from "vitest";
import { enqueueAnalysis } from "../server/ai/queue";
import { sections } from "../src/model";
import { livePolicy } from "../server/ai/openai";
import { openAIProvider } from "../server/ai/openai";
import { workflowFields, validateOutput } from "../src/workflow-model";
import { workflowInput, outputRecords, budgeted } from "../server/ai/workflow";
import { localDatabase } from "../scripts/local-db";
import { randomUUID } from "node:crypto";
const draft = {
  sections: [
    {
      key: "analysis-brief",
      fields: workflowFields["analysis-brief"].map(([key]) => ({
        key,
        text: "Reported information [context.task]",
      })),
      items: [],
    },
  ],
};
test("real provider sends structured server-only requests; rejects refusal, incomplete and malformed output without retry", async () => {
  let count = 0;
  let body: any;
  const transport = async (_url: any, init: any) => {
    count++;
    body = JSON.parse(init.body);
    return Response.json({
      status: "completed",
      model: "gpt-6-luna",
      usage: { input_tokens: 100, output_tokens: 200 },
      output: [
        { content: [{ type: "output_text", text: JSON.stringify(draft) }] },
      ],
    });
  };
  const p = openAIProvider("test-private", transport);
  const args = {
    step: "generate" as const,
    callId: randomUUID(),
    input: {},
    artifacts: {},
    maxMicrousd: 50_000,
  };
  expect((await p.run(args)).state).toBe("completed");
  expect(count).toBe(1);
  expect(body.store).toBe(false);
  expect(body.tools).toBeUndefined();
  expect(body.text.format.strict).toBe(true);
  expect(body.model).toBe("gpt-6-luna");
  const refusal = openAIProvider("test", async () =>
    Response.json({
      status: "completed",
      usage: { input_tokens: 1, output_tokens: 1 },
      output: [{ content: [{ type: "refusal" }] }],
    }),
  );
  expect((await refusal.run(args)).state).toBe("failed");
  const interrupted = openAIProvider("test", async () => {
    throw Error("network");
  });
  expect((await interrupted.run(args)).state).toBe("uncertain");
  const rejected = openAIProvider(
    "test",
    async () => new Response(null, { status: 401 }),
  );
  expect(await rejected.run(args)).toMatchObject({
    state: "failed",
    actualMicrousd: 0,
  });
  expect(() =>
    validateOutput(
      { ...draft, sections: [...draft.sections, ...draft.sections] },
      "analysis",
    ),
  ).toThrow();
});
test("learning confirmation is tied to canonical Analysis revision and nonlearning rationale is required", async () => {
  const data: any = {
    accepted_revision: 2,
    accepted_data: {},
    records: {
      "analysis-brief": { revision: 2 },
      "design-solution": {
        revision: 3,
        data: { answers: { route: { text: "learning" } }, items: [] },
      },
      learning: {
        revision: 4,
        data: {
          items: [
            {
              answers: {
                indicator: {
                  status: "provided",
                  text: "Demonstrate correct routing",
                },
              },
            },
          ],
        },
      },
    },
  };
  const rpc = async () => data;
  await expect(workflowInput(rpc, {}, randomUUID(), "design")).rejects.toThrow(
    "learning_measures_required",
  );
  data.records["design-solution"].data.answers = {
    route: { text: "learning" },
    measures_confirmed: { text: "yes" },
    learning_revision: { text: "4" },
    deliverable: { text: "e-learning" },
    format: { text: "microlearning" },
    tools: { text: "rise" },
  };
  expect(await workflowInput(rpc, {}, randomUUID(), "design")).toBeDefined();
  data.records.learning.revision = 5;
  await expect(workflowInput(rpc, {}, randomUUID(), "design")).rejects.toThrow(
    "learning_measures_required",
  );
  data.records["design-solution"].data.answers = {
    route: { text: "nonlearning" },
  };
  await expect(workflowInput(rpc, {}, randomUUID(), "design")).rejects.toThrow(
    "solution_required",
  );
  data.records["design-solution"].data.answers.rationale = {
    text: "Fix the broken tool",
  };
  expect(await workflowInput(rpc, {}, randomUUID(), "design")).toBeDefined();
});
test("workflow initializes privately; acceptance pins exact version; AI apply never replaces edited work", async () => {
  const d = await localDatabase();
  try {
    const email = "owner@example.test",
      actor = { user_id: randomUUID(), session_id: randomUUID() },
      project_id = randomUUID(),
      challenge_id = randomUUID();
    await d.rpc("pilot_set", { email, active: true });
    await d.rpc("request_code", { email, challenge_id, digest: "test" });
    await d.rpc("verify_code", { challenge_id, digest: "test" });
    await d.rpc("admit", { email, ...actor, challenge_id });
    await d.rpc("create", {
      ...actor,
      project_id,
      operation_id: randomUUID(),
      title: "Test",
    });
    expect(
      (
        await d.workflowRpc("open", {
          project_id,
          user_id: randomUUID(),
          session_id: randomUUID(),
        })
      ).error,
    ).toBe("unauthorized");
    const opened = await d.workflowRpc("open", { ...actor, project_id });
    expect(opened.records["design-objectives"].revision).toBe(1);
    const data = outputRecords(draft, "analysis")[0].data;
    await d.rpc("save", {
      ...actor,
      project_id,
      section: "analysis-brief",
      base_revision: 1,
      operation_id: randomUUID(),
      data,
    });
    expect(
      (
        await d.workflowRpc("accept_analysis", {
          ...actor,
          project_id,
          revision: 1,
          reviewed: true,
        })
      ).error,
    ).toBe("ai_inputs_changed");
    const accepted = await d.workflowRpc("accept_analysis", {
      ...actor,
      project_id,
      revision: 2,
      reviewed: true,
    });
    expect(accepted.accepted_revision).toBe(2);
    for (const [section, keys] of [
      ["context", ["task", "desired", "current"]],
      ["audience", ["roles"]],
    ] as const)
      await d.rpc("save", {
        ...actor,
        project_id,
        section,
        base_revision: 1,
        operation_id: randomUUID(),
        data: {
          answers: Object.fromEntries(
            keys.map((k) => [k, { text: "Known input", status: "provided" }]),
          ),
          items: [],
        },
      });
    await d.aiRpc("open_period", {
      starts_at: new Date(Date.now() - 60000).toISOString(),
      ends_at: new Date(Date.now() + 3600000).toISOString(),
    });
    const wi = await workflowInput(
      d.workflowRpc,
      actor,
      project_id,
      "solution",
    );
    const payload = {
      request_id: randomUUID(),
      task: "solution",
      expected_revisions: Object.fromEntries(
        sections.map((s) => [s, s === "context" || s === "audience" ? 2 : 1]),
      ),
    };
    const queued = await enqueueAnalysis(
      { rpc: d.aiRpc, policy: livePolicy("solution") },
      actor,
      project_id,
      payload,
      wi,
    );
    expect(queued.job_id).toBeDefined();
    expect(
      (
        await d.db.query(
          "select version_id from app.ai_job_inputs where job_id=$1",
          [queued.job_id],
        )
      ).rows,
    ).toHaveLength(9);
    await d.rpc("save", {
      ...actor,
      project_id,
      section: "design-solution",
      base_revision: 1,
      operation_id: randomUUID(),
      data: {
        answers: { note: { text: "New decision", status: "provided" } },
        items: [],
      },
    });
    expect(
      (
        await enqueueAnalysis(
          { rpc: d.aiRpc, policy: livePolicy("solution") },
          actor,
          project_id,
          { ...payload, request_id: randomUUID() },
          wi,
        )
      ).error,
    ).toBe("ai_inputs_changed");

    for (let rev = 2; rev < 14; rev++)
      await d.rpc("save", {
        ...actor,
        project_id,
        section: "analysis-brief",
        base_revision: rev,
        operation_id: randomUUID(),
        data,
      });
    expect(
      (
        await d.db.query(
          "select id from app.versions where project_id=$1 and section='analysis-brief' and revision=2",
          [project_id],
        )
      ).rows,
    ).toHaveLength(1);
    const job_id = randomUUID();
    await d.db.query(
      "insert into app.ai_jobs(id,owner_id,project_id,request_id,request,input_manifest,policy,allowance_microusd,state,result) values($1,$2,$3,$4,'{}','{}',$5,150000,'completed',$6)",
      [
        job_id,
        actor.user_id,
        project_id,
        randomUUID(),
        JSON.stringify({ provider: "openai", task: "analysis" }),
        JSON.stringify(draft),
      ],
    );
    expect(
      (
        await d.workflowRpc("apply", {
          ...actor,
          project_id,
          job_id,
          task: "analysis",
          sections: outputRecords(draft, "analysis"),
        })
      ).error,
    ).toBe("draft_exists");
  } finally {
    await d.db.close();
  }
});

test("revision tasks rework exactly one section with the same gates and the designer's request", async () => {
  const one = {
    sections: [
      {
        key: "design-objectives",
        fields: workflowFields["design-objectives"].map(([key]) => ({
          key,
          text: "Revised",
        })),
        items: [],
      },
    ],
  };
  expect(validateOutput(one, "revise-design-objectives").sections).toHaveLength(
    1,
  );
  expect(() => validateOutput(one, "revise-design-plan")).toThrow();
  const record = (answers: any, items: any[] = []) => ({
    revision: 1,
    data: { answers, items },
  });
  const data: any = {
    accepted_revision: 2,
    accepted_data: { answers: { gap: { text: "Gap" }, _job: { text: "x" } } },
    records: {
      "analysis-brief": { revision: 2 },
      "design-solution": record({ route: { text: "learning" } }),
      "design-objectives": record(
        { overview: { text: "LO-1" }, _basis: { text: "{}" } },
        [{ id: randomUUID(), answers: { code: { text: "LO-1" } } }],
      ),
      "design-assessments": record({ overview: { text: "AS-1" } }),
      "design-content": record({}),
      "design-sequence": record({}),
      "design-plan": record({}),
      learning: { revision: 4, data: { items: [] } },
    },
  };
  const rpc = async () => data;
  await expect(
    workflowInput(rpc, {}, randomUUID(), "revise-design-objectives"),
  ).rejects.toThrow("learning_measures_required");
  data.records["design-solution"].data.answers.route = { text: "nonlearning" };
  data.records["design-solution"].data.answers.rationale = {
    text: "Fix tools",
  };
  const input: any = await workflowInput(
    rpc,
    {},
    randomUUID(),
    "revise-design-objectives",
    "  Add a safety objective ",
  );
  expect(input.target).toBe("design-objectives");
  expect(input.designer_request).toBe("Add a safety objective");
  expect(input.current.answers).toEqual({ overview: { text: "LO-1" } });
  expect(input.current.items).toEqual([{ code: { text: "LO-1" } }]);
  expect(Object.keys(input.design)).not.toContain("design-objectives");
  expect(input.brief.answers._job).toBeUndefined();
  const solution: any = await workflowInput(
    rpc,
    {},
    randomUUID(),
    "revise-design-solution",
  );
  expect(solution.design).toEqual({});
  expect(solution.designer_request).toBeUndefined();
});

test("source text shares a fixed allowance; short sources stay whole, long ones are marked cut", async () => {
  const list = [
    { name: "Long", kind: "docx", content: "L".repeat(50_000), refs: [] },
    { name: "Short", kind: "text", content: "S".repeat(1_000), refs: [] },
    { name: "Mid", kind: "pptx", content: "M".repeat(20_000), refs: [] },
  ];
  const out = budgeted(list, 30_000);
  expect(out.map((s) => s.name)).toEqual(["Long", "Short", "Mid"]);
  expect(out[1]).toMatchObject({ text: "S".repeat(1_000) });
  expect(out[1]).not.toHaveProperty("truncated");
  expect(out.reduce((n, s) => n + s.text.length, 0)).toBeLessThanOrEqual(
    30_000,
  );
  expect(out[0].truncated).toBe(true);
  expect(out[2].truncated).toBe(true);
  const data: any = {
    accepted_revision: 2,
    records: {
      "analysis-brief": { revision: 2 },
      "design-solution": { revision: 1, data: { answers: {}, items: [] } },
      sources: {
        revision: 3,
        data: {
          answers: { precedence: { text: "Guide wins" }, _x: { text: "" } },
          items: [],
        },
      },
    },
  };
  const input: any = await workflowInput(
    async () => data,
    {},
    randomUUID(),
    "solution",
    "",
    async () => ({ sources: [list[1]] }),
  );
  expect(input.sources.settings).toEqual({
    precedence: { text: "Guide wins" },
  });
  expect(input.sources.materials[0]).toMatchObject({
    name: "Short",
    kind: "text",
  });
});

test("Development needs a reviewed Design, and later sections need the accepted sample treatment", async () => {
  const { markReviewed } = await import("../src/dependencies");
  const { treatmentPrint } = await import("../src/development-model");
  const text = (t: string) => ({ text: t, status: "provided" as const });
  const records: any = {
    "analysis-brief": {
      revision: 2,
      data: { answers: { gap: text("Gap") }, items: [] },
    },
    "design-solution": {
      revision: 1,
      data: {
        answers: { route: text("nonlearning"), rationale: text("Fix tools") },
        items: [],
      },
    },
    learning: { revision: 1, data: { answers: {}, items: [] } },
    sources: { revision: 1, data: { answers: {}, items: [] } },
  };
  for (const s of [
    "design-objectives",
    "design-assessments",
    "design-content",
    "design-sequence",
  ])
    records[s] = { revision: 1, data: { answers: {}, items: [] } };
  records["design-plan"] = {
    revision: 1,
    data: { answers: { summary: text("Plan") }, items: [] },
  };
  const sampleId = randomUUID(),
    otherId = randomUUID();
  records.development = {
    revision: 1,
    data: {
      answers: { treatment: text("Friendly"), _sample: text(sampleId) },
      items: [
        {
          id: sampleId,
          answers: { code: text("AID-1"), content: text("Steps") },
        },
        {
          id: otherId,
          answers: { code: text("AID-2"), title: text("Checklist") },
        },
      ],
    },
  };
  const data: any = { accepted_revision: 2, records };
  const rpc = async () => data;
  await expect(
    workflowInput(rpc, {}, randomUUID(), "development-sample"),
  ).rejects.toThrow("design_review_required");
  for (const s of ["design-solution", "design-plan"])
    records[s].data = markReviewed(s as any, records[s].data, data);
  const sample: any = await workflowInput(
    rpc,
    {},
    randomUUID(),
    "development-sample",
  );
  expect(Object.keys(sample.design)).toContain("design-plan");
  await expect(
    workflowInput(
      rpc,
      {},
      randomUUID(),
      "development-section",
      "",
      undefined,
      otherId,
    ),
  ).rejects.toThrow("treatment_required");
  // The sample itself can be reworked before acceptance.
  expect(
    await workflowInput(
      rpc,
      {},
      randomUUID(),
      "development-section",
      "Shorter",
      undefined,
      sampleId,
    ),
  ).toMatchObject({ designer_request: "Shorter", target_item: sampleId });
  records.development.data.answers._treatment_accepted = text(
    treatmentPrint(records.development.data),
  );
  const section: any = await workflowInput(
    rpc,
    {},
    randomUUID(),
    "development-section",
    "",
    undefined,
    otherId,
  );
  expect(section.development.sample).toEqual({
    code: text("AID-1"),
    content: text("Steps"),
  });
  expect(section.development.current).toEqual({
    code: text("AID-2"),
    title: text("Checklist"),
  });
  expect(section.development.outline).toHaveLength(2);
  // Editing the sample after acceptance requires a fresh acceptance.
  records.development.data.items[0].answers.content = text("Different steps");
  await expect(
    workflowInput(
      rpc,
      {},
      randomUUID(),
      "development-section",
      "",
      undefined,
      otherId,
    ),
  ).rejects.toThrow("treatment_required");
  await expect(
    workflowInput(
      rpc,
      {},
      randomUUID(),
      "development-section",
      "",
      undefined,
      randomUUID(),
    ),
  ).rejects.toThrow("invalid_request");
  // Output checks: a section request returns exactly one item and no record fields.
  const item = {
    fields: [
      "code",
      "title",
      "kind",
      "objectives",
      "assessments",
      "sources",
      "content",
      "interaction",
      "media",
      "build",
      "accessibility",
      "issues",
    ].map((key) => ({ key, text: key })),
  };
  expect(
    validateOutput(
      { sections: [{ key: "development", fields: [], items: [item] }] },
      "development-section",
    ).sections[0].items,
  ).toHaveLength(1);
  expect(() =>
    validateOutput(
      { sections: [{ key: "development", fields: [], items: [item, item] }] },
      "development-section",
    ),
  ).toThrow();
});
