// Fictional AI stand-in for local browser tests only. No network, no account, no charge.
// Never imported by a deployed function (the bundle check rejects scripts/local-*).
import {
  workflowFields,
  itemFields,
  type AITask,
  type WorkflowSection,
} from "../src/workflow-model";
import type { SimulatedProvider } from "../server/ai/queue";

const outputs: Record<AITask, WorkflowSection[]> = {
  analysis: ["analysis-brief"],
  solution: ["design-solution"],
  design: [
    "design-objectives",
    "design-assessments",
    "design-content",
    "design-sequence",
    "design-plan",
  ],
};
const itemText = (section: WorkflowSection, key: string, n: number) =>
  section === "design-objectives" && key === "code"
    ? n === 0
      ? "LO-1"
      : `EO-1.${n}`
    : section === "design-objectives" && key === "parent"
      ? n === 0
        ? ""
        : "LO-1"
      : section === "design-objectives" && key === "bloom"
        ? "Apply"
        : section === "design-assessments" && key === "code"
          ? `AS-${n + 1}`
          : `Fictional test draft ${key} ${n + 1}.`;

export function fixtureOutput(task: AITask) {
  return {
    sections: outputs[task].map((key) => ({
      key,
      fields: workflowFields[key].map(([field]) => ({
        key: field,
        text: [
          "route",
          "deliverable",
          "format",
          "tools",
          "learning_measures",
        ].includes(field)
          ? ""
          : `Fictional test draft for ${field}. Not created by AI.`,
      })),
      items: (itemFields[key] ? [0, 1] : []).map((n) => ({
        fields: itemFields[key]!.map(([field]) => ({
          key: field,
          text: itemText(key, field, n),
        })),
      })),
    })),
  };
}

// A project titled with "[fail once]" fails its first generation per task, to exercise retries.
export function fixtureProvider(): SimulatedProvider {
  const failed = new Set<string>();
  return {
    kind: "simulated",
    async run({ step, input, task = "analysis" }) {
      const title = String(
        (input as any).context?.data?.answers?.title?.text ?? "",
      );
      const key = title + ":" + task;
      if (
        step === "generate" &&
        title.includes("[fail once]") &&
        !failed.has(key)
      ) {
        failed.add(key);
        return { state: "failed", actualMicrousd: 0, result: null };
      }
      return {
        state: "completed",
        actualMicrousd: 1_000,
        result:
          step === "review"
            ? { needs_repair: false, issues: [] }
            : fixtureOutput(task),
      };
    },
  };
}
