import { randomUUID } from "node:crypto";
import { type Rpc } from "../api";
import { validateOutput, type AITask } from "../../src/workflow-model";
export async function workflowInput(
  rpc: Rpc,
  actor: Record<string, string>,
  projectId: string,
  task: AITask,
) {
  const data = await rpc("open", { ...actor, project_id: projectId });
  if (data.error) throw Error(data.error);
  if (task === "analysis") return undefined;
  if (!data.accepted_revision) throw Error("review_required");
  if (data.records["analysis-brief"].revision !== data.accepted_revision)
    throw Error("review_required");
  const solution = data.records["design-solution"];
  if (task === "design") {
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
  return {
    revision: solution.revision,
    data: { answers: {}, items: [] },
    brief: data.accepted_data,
    brief_revision: data.accepted_revision,
    solution: solution.data,
  };
}
export function outputRecords(value: unknown, task: AITask) {
  return validateOutput(value, task).sections.map((s) => ({
    key: s.key,
    data: {
      answers: Object.fromEntries(
        s.fields.map((f) => [f.key, { text: f.text, status: "proposed" }]),
      ),
      items: s.items.map((row) => ({
        id: randomUUID(),
        answers: Object.fromEntries(
          row.fields.map((f) => [f.key, { text: f.text, status: "proposed" }]),
        ),
      })),
    },
  }));
}
