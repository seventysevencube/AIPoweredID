import { type Rpc } from "../api";
import {
  designReadiness,
  sampleOf,
  treatmentAccepted,
} from "../../src/development-model";
import { preferencesFor } from "../../src/preferences-model";
import {
  isDevelopment,
  isRevision,
  proposalData,
  taskSections,
  validateOutput,
  workflowSections,
  type AITask,
} from "../../src/workflow-model";
export async function workflowInput(
  rpc: Rpc,
  actor: Record<string, string>,
  projectId: string,
  task: AITask,
  note = "",
  sourceRpc?: Rpc,
  targetItem?: string,
) {
  const data = await rpc("open", { ...actor, project_id: projectId });
  if (data.error) throw Error(data.error);
  if (task === "analysis") return undefined;
  if (!data.accepted_revision) throw Error("review_required");
  if (data.records["analysis-brief"].revision !== data.accepted_revision)
    throw Error("review_required");
  const solution = data.records["design-solution"];
  const target = taskSections(task)[0];
  if (
    task === "design" ||
    isDevelopment(task) ||
    (isRevision(task) && target !== "design-solution")
  ) {
    const a = solution.data.answers;
    const route = a.route?.text;
    if (!["learning", "combined", "nonlearning"].includes(route))
      throw Error("solution_required");
    if (route !== "nonlearning") {
      if (
        a.measures_confirmed?.text !== "yes" ||
        a.learning_revision?.text !== String(data.records.learning.revision) ||
        !data.records.learning.data.items.some(
          (m: any) =>
            m.answers.indicator?.status === "provided" &&
            m.answers.indicator.text.trim(),
        )
      )
        throw Error("learning_measures_required");
      if (
        !["e-learning", "performance-aid", "both"].includes(a.deliverable?.text)
      )
        throw Error("solution_required");
      if (
        ["e-learning", "both"].includes(a.deliverable?.text) &&
        (!a.format?.text || !a.tools?.text)
      )
        throw Error("solution_required");
    } else if (!a.rationale?.text.trim()) throw Error("solution_required");
  }
  const development = isDevelopment(task)
    ? {
        ...developmentInput(data, task, targetItem),
        ...(note.trim() ? { designer_request: note.trim() } : {}),
      }
    : {};
  const sources = sourceRpc
    ? await sourceRpc("texts", { ...actor, project_id: projectId })
    : { sources: [] };
  if (sources.error) throw Error(sources.error);
  return {
    revision: solution.revision,
    data: { answers: {}, items: [] },
    preferences: preferencesFor(data.records.preferences?.data),
    sources: {
      settings: visible(data.records.sources?.data)?.answers ?? {},
      materials: budgeted(
        sources.sources,
        isDevelopment(task) ? 20_000 : 30_000,
      ),
    },
    ...development,
    brief: visible(data.accepted_data),
    brief_revision: data.accepted_revision,
    solution: visible(solution.data),
    ...(isRevision(task)
      ? {
          target,
          current: visible(data.records[target].data),
          design: Object.fromEntries(
            workflowSections
              .slice(2)
              .filter((s) => s !== target && target !== "design-solution")
              .map((s) => [s, visible(data.records[s].data)]),
          ),
          ...(note.trim() ? { designer_request: note.trim() } : {}),
        }
      : {}),
  };
}
// Development starts from reviewed Design; sections after the sample need its accepted treatment.
function developmentInput(data: any, task: AITask, targetItem?: string) {
  if (!designReadiness(data).ready) throw Error("design_review_required");
  const dev = data.records.development?.data ?? { answers: {}, items: [] };
  const design = Object.fromEntries(
    workflowSections.slice(2).map((s) => [s, visible(data.records[s].data)]),
  );
  if (task === "development-sample") return { design };
  const item = dev.items.find((i: any) => i.id === targetItem);
  if (!item) throw Error("invalid_request");
  const sample = sampleOf(dev);
  if (item.id !== sample?.id && !treatmentAccepted(dev))
    throw Error("treatment_required");
  const shown = (answers: any) =>
    Object.fromEntries(
      Object.entries(answers).filter(([k]) => !k.startsWith("_")),
    );
  return {
    design,
    target_item: item.id,
    development: {
      treatment: visible(dev).answers,
      outline: dev.items.map((i: any) =>
        Object.fromEntries(
          ["code", "title", "kind"].map((k) => [k, i.answers[k]?.text ?? ""]),
        ),
      ),
      ...(sample && sample.id !== item.id
        ? { sample: shown(sample.answers) }
        : {}),
      current: shown(item.answers),
    },
  };
}
// Source text shares a fixed allowance so every request stays within the transport cap.
// Shorter sources are included whole; longer ones are cut and marked as cut.
export function budgeted(
  list: { name: string; kind: string; content: string; refs: unknown }[],
  allowance = 30_000,
) {
  let left = allowance;
  const byLength = [...list].sort(
    (a, b) => a.content.length - b.content.length,
  );
  const shares = new Map<(typeof list)[number], number>();
  byLength.forEach((s, i) => {
    const share = Math.min(
      s.content.length,
      Math.floor(left / (byLength.length - i)),
    );
    shares.set(s, share);
    left -= share;
  });
  return list.map((s) => ({
    name: s.name,
    kind: s.kind,
    refs: s.refs,
    text: s.content.slice(0, shares.get(s)),
    ...(shares.get(s)! < s.content.length ? { truncated: true } : {}),
  }));
}
// App bookkeeping (keys starting with "_") and record IDs are never sent to AI.
function visible(data: any) {
  return (
    data && {
      answers: Object.fromEntries(
        Object.entries(data.answers ?? {}).filter(([k]) => !k.startsWith("_")),
      ),
      items: (data.items ?? []).map((i: any) => i.answers),
    }
  );
}
export function outputRecords(value: unknown, task: AITask) {
  return validateOutput(value, task).sections.map((s) => ({
    key: s.key,
    data: proposalData(s),
  }));
}
