import type { RecordData } from "./model";
import { sectionStatus } from "./dependencies";
import { hasContent, itemStatus, treatmentAccepted } from "./development-model";
import {
  workflowLabels,
  workflowSections,
  type WorkflowSection,
} from "./workflow-model";

// Four project-level preferences. They shape future AI drafts only; they never relax
// required fields, source rules, reviewed decisions or human approval.
export const preferenceQuestions = [
  {
    key: "guidance",
    label: "Guidance depth",
    hint: "How much explanation AI drafts include alongside the content.",
    options: [
      ["brief", "Brief: key reminders only"],
      ["standard", "Standard"],
      ["detailed", "Detailed: rationale, examples and teaching notes"],
    ],
  },
  {
    key: "contribution",
    label: "AI contribution",
    hint: "How complete AI drafts are before you edit them.",
    options: [
      ["suggest", "Suggest: outlines, options and questions for you to write"],
      ["balanced", "Balanced"],
      ["draft", "Draft: fuller proposed text for you to edit"],
    ],
  },
  {
    key: "detail",
    label: "Output detail",
    hint: "How long and detailed drafts are.",
    options: [
      ["concise", "Concise"],
      ["standard", "Standard"],
      ["comprehensive", "Comprehensive"],
    ],
  },
  {
    key: "resources",
    label: "Additional resources",
    hint: "Whether AI may suggest further reading or job aids, always marked as unverified suggestions.",
    options: [
      ["none", "No suggestions"],
      ["suggest", "Suggest resources"],
    ],
  },
] as const;
export const preferenceDefaults: Record<string, string> = {
  guidance: "standard",
  contribution: "balanced",
  detail: "standard",
  resources: "none",
};
export function preferencesFor(data?: RecordData) {
  return Object.fromEntries(
    preferenceQuestions.map((q) => [
      q.key,
      data?.answers[q.key]?.text || preferenceDefaults[q.key],
    ]),
  );
}
export const breakIntervals = [30, 45, 60, 90];
export function breakSettings(data?: RecordData) {
  const minutes = Number(data?.answers.break_minutes?.text);
  return {
    on: data?.answers.breaks?.text === "on",
    minutes: breakIntervals.includes(minutes) ? minutes : 45,
  };
}

type Snapshot = {
  records: Record<string, { revision: number; data: RecordData }>;
  accepted_revision?: number | null;
};
const drafted = (data?: RecordData) =>
  !!data &&
  (data.items.length > 0 ||
    Object.keys(data.answers).some((k) => !k.startsWith("_")));
// A concise recap of where the project stands and the next useful step. Never generates.
export function nextStep(snapshot: Snapshot): { text: string; page: string } {
  const r = snapshot.records;
  if (!drafted(r["analysis-brief"]?.data))
    return {
      text: "Generate the Analysis brief from your saved Analysis.",
      page: "analysis-brief",
    };
  if (snapshot.accepted_revision !== r["analysis-brief"].revision)
    return {
      text: "Review the Analysis brief and accept a version for Design.",
      page: "analysis-brief",
    };
  const route = r["design-solution"]?.data.answers.route?.text;
  if (!route || route === "investigate")
    return {
      text: "Choose the response you will pursue on Performance solution.",
      page: "design-solution",
    };
  const design = workflowSections.slice(1) as WorkflowSection[];
  const stale = design.find(
    (s) => r[s] && sectionStatus(s, r[s].data, snapshot) === "needs-update",
  );
  if (stale)
    return {
      text: `Review ${workflowLabels[stale]}: it needs an update.`,
      page: stale,
    };
  if (!drafted(r["design-objectives"]?.data) && route !== "nonlearning")
    return {
      text: "Generate the Design skeleton from Performance solution.",
      page: "design-solution",
    };
  const draft = design.find(
    (s) => r[s] && sectionStatus(s, r[s].data, snapshot) === "draft",
  );
  if (draft)
    return {
      text: `Review ${workflowLabels[draft]} and mark it reviewed.`,
      page: draft,
    };
  const dev = r.development?.data;
  if (!dev || !dev.items.length)
    return { text: "Generate the Development sample.", page: "development" };
  if (!treatmentAccepted(dev))
    return {
      text: "Review the Development sample and accept its treatment.",
      page: "development",
    };
  if (dev.items.some((i) => !hasContent(i)))
    return {
      text: "Generate the full Development draft.",
      page: "development",
    };
  if (dev.items.some((i) => itemStatus(i) !== "reviewed"))
    return {
      text: "Review each Development section and mark it reviewed.",
      page: "development",
    };
  return {
    text: "Confirm Ready for handoff and export your work.",
    page: "sharing",
  };
}
