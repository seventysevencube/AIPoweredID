import { expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { unzipSync, strFromU8 } from "fflate";
import Pptx from "pptxgenjs";
import {
  buildExport,
  handoffChecks,
  handoffPrint,
  paginate,
} from "../src/export-model";
import { buildPptx } from "../src/pptx";
import { markReviewed } from "../src/dependencies";
import { reviewItem } from "../src/development-model";
import { sections } from "../src/model";
import { workflowSections } from "../src/workflow-model";

const text = (t: string) => ({ text: t, status: "provided" as const });
function project() {
  const records: Record<string, any> = {};
  for (const s of [
    ...sections,
    ...workflowSections,
    "sources",
    "preferences",
    "development",
  ])
    records[s] = { revision: 1, data: { answers: {}, items: [] } };
  records.context.data.answers.title = text("Complaint routing");
  records["design-solution"].data.answers = {
    route: text("learning"),
    deliverable: text("e-learning"),
    format: text("microlearning"),
    tools: text("rise"),
    measures_confirmed: text("yes"),
  };
  records["design-objectives"] = {
    revision: 4,
    data: {
      answers: { overview: text("One objective") },
      items: [
        {
          id: randomUUID(),
          answers: { code: text("LO-1"), statement: text("Route a complaint") },
        },
      ],
    },
  };
  records["design-plan"].data.answers = {
    summary: text("Plan"),
    review: text("Confirm the routing table owner."),
  };
  const long = "Word ".repeat(600);
  records.development.data = {
    answers: { treatment: text("Friendly, scenario-led"), _job: text("x") },
    items: [
      {
        id: randomUUID(),
        answers: {
          code: text("LSN-1"),
          title: text("Why it matters"),
          content: text(long),
          issues: text("Need real examples"),
        },
      },
      {
        id: randomUUID(),
        answers: { code: text("LSN-2"), title: text("Practice") },
      },
    ],
  };
  return { records, accepted_revision: 1 };
}

test("exports present saved content with statuses, issues and optional comments", () => {
  const snap = project();
  const options = {
    sections: [
      "design-solution",
      "design-objectives",
      "design-plan",
      "development",
    ] as const,
    comments: false,
  };
  const comments = [
    {
      target: { section: "design-objectives", label: "LO-1" },
      display_name: "Sam",
      body: "Clarify",
      created_at: "2026-10-19T00:00:00Z",
      version: 3,
    },
  ];
  const doc = buildExport(
    snap,
    { ...options, sections: [...options.sections] },
    {
      sources: [{ name: "Guide.docx", kind: "docx", usable: true }],
      comments,
      exportedAt: "2026-10-19T12:00:00Z",
    },
  );
  expect(doc.status).toBe("Draft");
  expect(doc.deliverable).toBe("E-learning · Microlearning · Rise 360");
  expect(doc.parts.map((p) => p.label)).toEqual([
    "Performance solution",
    "Learning objectives",
    "Design plan",
    "Development",
  ]);
  const solution = doc.parts[0].fields;
  expect(solution).toContainEqual({
    label: "Which response will you pursue?",
    text: "Learning",
  });
  expect(JSON.stringify(doc)).not.toContain('"_job"');
  expect(doc.parts[1].version).toBe(4);
  expect(doc.parts[3].items[1]).toMatchObject({
    heading: "LSN-2 Practice",
    status: "Outline only",
  });
  expect(doc.issues).toEqual(
    expect.arrayContaining([
      { where: "Design plan", text: "Confirm the routing table owner." },
      { where: "Development · LSN-1", text: "Need real examples" },
      {
        where: "Development · LSN-2",
        text: "Outline only: written content not drafted yet.",
      },
    ]),
  );
  expect(doc.comments).toBeNull();
  const withComments = buildExport(
    snap,
    { sections: [...options.sections], comments: true },
    {
      sources: [],
      comments,
    },
  );
  expect(withComments.comments).toEqual([
    {
      where: "Learning objectives · LO-1",
      version: 3,
      name: "Sam",
      body: "Clarify",
      at: "2026-10-19T00:00:00Z",
    },
  ]);
});

test("Ready for handoff needs passing checks and a confirmation of this exact content", () => {
  const snap = project();
  const included = ["design-objectives", "development"] as const;
  expect(handoffChecks(snap, included).every((c) => c.ok)).toBe(false);
  snap.records["design-objectives"].data = markReviewed(
    "design-objectives",
    snap.records["design-objectives"].data,
    snap,
  );
  snap.records.development.data.items = snap.records.development.data.items.map(
    (i: any) =>
      reviewItem({
        ...i,
        answers: {
          ...i.answers,
          content: i.answers.content ?? text("Written"),
        },
      }),
  );
  expect(handoffChecks(snap, included).every((c) => c.ok)).toBe(true);
  snap.records.development.data.answers._handoff = text(
    handoffPrint(snap, included),
  );
  const ready = buildExport(
    snap,
    { sections: [...included], comments: false },
    { sources: [], comments: [] },
  );
  expect(ready.status).toBe("Ready for handoff");
  // Any later edit returns the export to Draft until confirmed again.
  snap.records["design-objectives"].data.answers.overview = text("Changed");
  expect(
    buildExport(
      snap,
      { sections: [...included], comments: false },
      { sources: [], comments: [] },
    ).status,
  ).toBe("Draft");
});

test("long content continues across slides and the PowerPoint opens as editable text", async () => {
  const pages = paginate([
    { label: "Short", text: "A" },
    { label: "Long", text: "word ".repeat(700).trim() },
  ]);
  expect(pages.length).toBeGreaterThan(2);
  expect(pages[1][0].label).toBe("Long (continued)");
  expect(
    pages
      .flat()
      .map((f) => f.text)
      .join(" ")
      .split(" ")
      .filter((w) => w === "word"),
  ).toHaveLength(700);
  const doc = buildExport(
    project(),
    {
      sections: ["design-objectives", "development"],
      comments: true,
    },
    { sources: [], comments: [] },
  );
  const bytes = (await buildPptx(Pptx, doc).write({
    outputType: "uint8array",
  })) as Uint8Array;
  const files = unzipSync(bytes);
  const slides = Object.keys(files).filter((f) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(f),
  );
  // Cover, objectives page and LO-1, LSN-1 with continuations, LSN-2, development page, sources, issues, comments.
  expect(slides.length).toBeGreaterThanOrEqual(9);
  const all = slides.map((f) => strFromU8(files[f])).join("");
  expect(all).toContain("LSN-1 Why it matters (continued)");
  expect(all).toContain("Appendix: reviewer comments");
  expect(all).toContain("Complaint routing · Draft · Exported");
});
