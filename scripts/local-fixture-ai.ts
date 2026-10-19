// Fictional AI stand-in for local browser tests only. No network, no account, no charge.
// Never imported by a deployed function (the bundle check rejects scripts/local-*).
import {
  developmentFields,
  developmentItemFields,
  fieldsFor,
  isDevelopment,
  itemFieldsFor,
  outlineFields,
  isRevision,
  taskSections,
  type AITask,
  type WorkflowSection,
} from "../src/workflow-model";
import type { SimulatedProvider } from "../server/ai/queue";

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

export function fixtureOutput(task: AITask, request = "", workflow?: any) {
  const prefix = isRevision(task)
    ? `Fictional revision (${request || "no request"})`
    : "Fictional test draft";
  if (isDevelopment(task)) return developmentOutput(task, request, workflow);
  return {
    sections: taskSections(task).map((key) => ({
      key,
      fields: fieldsFor(key, task).map(([field]) => ({
        key: field,
        text: [
          "route",
          "deliverable",
          "format",
          "tools",
          "learning_measures",
        ].includes(field)
          ? ""
          : `${prefix} for ${field}. Not created by AI.`,
      })),
      items: (itemFieldsFor(key) ? [0, 1] : []).map((n) => ({
        fields: itemFieldsFor(key)!.map(([field]) => ({
          key: field,
          text: itemText(key as WorkflowSection, field, n),
        })),
      })),
    })),
  };
}
// A three-section outline with the first section written out; then one section at a time.
function developmentOutput(task: AITask, request: string, workflow: any) {
  const written = (code: string, title: string, label: string) =>
    developmentItemFields.map(([field]) => ({
      key: field,
      text:
        field === "code"
          ? code
          : field === "title"
            ? title
            : field === "kind"
              ? "Rise lesson"
              : field === "objectives"
                ? "LO-1"
                : `${label} ${field}. Not created by AI.`,
    }));
  if (task === "development-section") {
    const current = workflow?.development?.current ?? {};
    return {
      sections: [
        {
          key: "development",
          fields: [],
          items: [
            {
              fields: written(
                current.code?.text ?? "LSN-?",
                current.title?.text ?? "Untitled",
                `Fictional section (${request || "no request"})`,
              ),
            },
          ],
        },
      ],
    };
  }
  const outline = (code: string, title: string) =>
    developmentItemFields.map(([field]) => ({
      key: field,
      text: outlineFields.includes(field)
        ? field === "code"
          ? code
          : field === "title"
            ? title
            : field === "kind"
              ? "Rise lesson"
              : "LO-1"
        : "",
    }));
  return {
    sections: [
      {
        key: "development",
        fields: developmentFields.map(([field]) => ({
          key: field,
          text: `Fictional sample ${field}. Not created by AI.`,
        })),
        items: [
          {
            fields: written("LSN-1", "Why routing matters", "Fictional sample"),
          },
          { fields: outline("LSN-2", "Route a complaint") },
          { fields: outline("LSN-3", "Check your routing") },
        ],
      },
    ],
  };
}

// A project titled with "[fail once]" fails its first generation per task, to exercise retries.
export function fixtureProvider(): SimulatedProvider {
  const failed = new Set<string>();
  return {
    kind: "simulated",
    async run({ step, input, task = "analysis", workflow }) {
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
            : fixtureOutput(
                task,
                String((workflow as any)?.designer_request ?? ""),
                workflow,
              ),
      };
    },
  };
}
