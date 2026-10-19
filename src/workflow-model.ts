import { z } from "zod";
export const workflowSections = [
  "analysis-brief",
  "design-solution",
  "design-objectives",
  "design-assessments",
  "design-content",
  "design-sequence",
  "design-plan",
] as const;
export type WorkflowSection = (typeof workflowSections)[number];
export const briefFields = [
  ["gap", "Project and performance gap"],
  ["evidence", "Evidence and possible causes"],
  ["audience", "Audience and work environment"],
  ["constraints", "Stakeholders and constraints"],
  ["evaluation", "Evaluation plan"],
  ["questions", "Open questions and assumptions"],
] as const;
export const workflowLabels: Record<WorkflowSection, string> = {
  "analysis-brief": "Analysis brief",
  "design-solution": "Performance solution",
  "design-objectives": "Learning objectives",
  "design-assessments": "Assessments and alignment",
  "design-content": "Content and instructional support",
  "design-sequence": "Learning sequence",
  "design-plan": "Design plan",
};
export const workflowFields: Record<
  WorkflowSection,
  readonly (readonly [string, string])[]
> = {
  "analysis-brief": briefFields,
  "design-solution": [
    ["recommendation", "AI recommendation and rationale"],
    ["nonlearning", "What changes beyond learning are needed?"],
    ["route", "Which response will you pursue?"],
    ["deliverable", "Which deliverables are needed?"],
    ["format", "Microlearning, course, or a mix?"],
    ["tools", "Storyline 360, Rise 360, or both?"],
    ["allocation", "If both tools, how will components connect?"],
    ["learning_measures", "What evidence will demonstrate learning?"],
    ["rationale", "Rationale, dependencies, and decisions still to review"],
  ],
  "design-objectives": [["overview", "Objective overview and coverage gaps"]],
  "design-assessments": [
    ["overview", "Assessment approach, completion rules, and alignment gaps"],
  ],
  "design-content": [
    ["sources", "Project-wide source approach and available references"],
    ["gaps", "Content or source gaps to resolve"],
  ],
  "design-sequence": [["overview", "Unit structure and sequence rationale"]],
  "design-plan": [
    ["summary", "Detailed design plan"],
    ["accessibility", "Accessibility and build considerations"],
    ["review", "Dependencies and decisions requiring review"],
  ],
};
export const itemFields: Partial<
  Record<WorkflowSection, readonly (readonly [string, string])[]>
> = {
  "design-objectives": [
    ["code", "Objective ID (LO-1 or EO-1.1)"],
    ["parent", "Parent objective ID (for enabling objectives)"],
    ["statement", "Measurable objective"],
    ["bloom", "Bloom level"],
    ["conditions", "Conditions and success criteria"],
    ["measure", "Linked learning measure"],
  ],
  "design-assessments": [
    ["code", "Assessment ID"],
    ["objectives", "Linked objective IDs"],
    ["type", "Assessment or practice type"],
    ["prompt", "Question, task, scenario, or performance prompt"],
    ["answer", "Expected response or performance"],
    ["criteria", "Scoring and success criteria"],
    ["feedback", "Feedback, retries, and remediation"],
  ],
  "design-content": [
    ["objective", "Enabling objective ID"],
    ["content", "Essential content"],
    ["support", "Explanation, example, demonstration, or job support"],
    ["source", "Supporting source or missing source"],
  ],
  "design-sequence": [
    ["unit", "Unit or module"],
    ["objectives", "Objective IDs"],
    ["activity", "Preparation and practice"],
    ["assessment", "Existing assessment IDs"],
    ["tool", "Authoring tool and interaction"],
    ["duration", "Proposed duration"],
  ],
};
export const aiTasks = ["analysis", "solution", "design"] as const;
export type AITask = (typeof aiTasks)[number];
const answer = z.object({ key: z.string(), text: z.string() }).strict();
export const outputSchema = z
  .object({
    sections: z.array(
      z
        .object({
          key: z.enum(workflowSections),
          fields: z.array(answer),
          items: z.array(z.object({ fields: z.array(answer) }).strict()),
        })
        .strict(),
    ),
  })
  .strict();
export type AIOutput = z.infer<typeof outputSchema>;
export function validateOutput(value: unknown, task: AITask): AIOutput {
  const output = outputSchema.parse(value);
  const keys =
    task === "analysis"
      ? ["analysis-brief"]
      : task === "solution"
        ? ["design-solution"]
        : workflowSections.slice(2);
  if (
    output.sections.length !== keys.length ||
    new Set(output.sections.map((s) => s.key)).size !== keys.length ||
    output.sections.some((s) => !keys.includes(s.key))
  )
    throw Error("invalid_ai_output");
  for (const section of output.sections) {
    const allowed = workflowFields[section.key].map((f) => f[0]);
    if (
      new Set(section.fields.map((f) => f.key)).size !== allowed.length ||
      section.fields.length !== allowed.length ||
      section.fields.some(
        (f) => !allowed.includes(f.key) || f.text.length > 40000,
      )
    )
      throw Error("invalid_ai_output");
    const fields = itemFields[section.key]?.map((f) => f[0]) ?? [];
    if (section.items.length > 40 || (!fields.length && section.items.length))
      throw Error("invalid_ai_output");
    for (const row of section.items)
      if (
        row.fields.length !== fields.length ||
        new Set(row.fields.map((f) => f.key)).size !== fields.length ||
        row.fields.some((f) => !fields.includes(f.key) || f.text.length > 10000)
      )
        throw Error("invalid_ai_output");
  }
  return output;
}
