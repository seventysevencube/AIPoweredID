import { expect, test } from "vitest";
import {
  basisFor,
  fingerprint,
  markReviewed,
  sectionStatus,
  staleReasons,
  withBasis,
} from "../src/dependencies";
import { workflowSections } from "../src/workflow-model";
import { sections } from "../src/model";

const text = (t: string) => ({ text: t, status: "provided" as const });
function snapshot() {
  const records: Record<string, any> = {};
  for (const s of [...sections, ...workflowSections])
    records[s] = { revision: 1, data: { answers: {}, items: [] } };
  records["design-solution"].data.answers.route = text("learning");
  records.learning.data.answers.note = text("Route five complaints");
  return { records, accepted_revision: 2 };
}

test("fingerprints ignore app bookkeeping and key order but see content", () => {
  const a = { answers: { x: text("1"), y: text("2") }, items: [] };
  const b = {
    answers: { y: text("2"), _job: text("j"), x: text("1") },
    items: [],
  };
  expect(fingerprint(a)).toBe(fingerprint(b));
  expect(fingerprint(a)).not.toBe(
    fingerprint({ answers: { x: text("1"), y: text("3") }, items: [] }),
  );
});

test("a reviewed section is flagged with reasons when an input changes, and only then", () => {
  const snap = snapshot();
  const objectives = markReviewed(
    "design-objectives",
    { answers: { overview: text("LO-1") }, items: [] },
    snap,
  );
  expect(sectionStatus("design-objectives", objectives, snap)).toBe("reviewed");
  // Editing an unrelated section keeps the review status.
  snap.records["design-plan"].data.answers.summary = text("Plan");
  expect(staleReasons("design-objectives", objectives, snap)).toEqual([]);
  snap.records["design-solution"].data.answers.route = text("combined");
  expect(sectionStatus("design-objectives", objectives, snap)).toBe(
    "needs-update",
  );
  expect(staleReasons("design-objectives", objectives, snap)).toEqual([
    "Performance solution changed.",
  ]);
  snap.accepted_revision = 5;
  snap.records.learning.data.answers.note = text("Route ten complaints");
  expect(staleReasons("design-objectives", objectives, snap)).toEqual([
    "A different version of the Analysis brief was accepted for Design.",
    "Performance solution changed.",
    "Analysis answers changed: Evidence of learning.",
  ]);
  const again = markReviewed("design-objectives", objectives, snap);
  expect(sectionStatus("design-objectives", again, snap)).toBe("reviewed");
  // The designer's own edit returns it to an unreviewed draft.
  again.answers.overview = text("LO-1 and LO-2");
  expect(sectionStatus("design-objectives", again, snap)).toBe("draft");
  expect(sectionStatus("design-plan", { answers: {}, items: [] }, snap)).toBe(
    "empty",
  );
  // Drafts without a recorded basis are never flagged.
  expect(
    staleReasons(
      "design-plan",
      { answers: { summary: text("x") }, items: [] },
      snap,
    ),
  ).toEqual([]);
});

test("applied AI drafts see each other and flag inputs that changed after the job read them", () => {
  const snap = snapshot();
  const applied = withBasis(
    [
      {
        key: "design-objectives" as const,
        data: { answers: { overview: text("LO-1") }, items: [] },
      },
      {
        key: "design-assessments" as const,
        data: { answers: { overview: text("AS-1") }, items: [] },
      },
    ],
    snap,
    {
      "analysis-brief": { revision: 2 },
      "design-solution": { revision: 1 },
      learning: { revision: 1 },
    },
  );
  const [objectives, assessments] = applied;
  snap.records["design-objectives"].data = objectives.data;
  snap.records["design-assessments"].data = assessments.data;
  expect(staleReasons("design-assessments", assessments.data, snap)).toEqual(
    [],
  );
  expect(staleReasons("design-objectives", objectives.data, snap)).toEqual([]);
  // The solution was edited after the job read it: flagged on arrival.
  const late = withBasis(
    [
      {
        key: "design-objectives" as const,
        data: { answers: { overview: text("LO-1") }, items: [] },
      },
    ],
    {
      ...snap,
      records: {
        ...snap.records,
        "design-solution": { ...snap.records["design-solution"], revision: 3 },
      },
    },
    { "analysis-brief": { revision: 2 }, "design-solution": { revision: 1 } },
  );
  expect(staleReasons("design-objectives", late[0].data, snap)).toEqual([
    "Performance solution changed.",
  ]);
  // Editing objectives later flags the assessments built on them.
  snap.records["design-objectives"].data = {
    answers: { overview: text("LO-1 revised") },
    items: [],
  };
  expect(staleReasons("design-assessments", assessments.data, snap)).toEqual([
    "Learning objectives changed.",
  ]);
  expect(basisFor("analysis-brief", snap)).toHaveProperty("audience");
});
