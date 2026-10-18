import { z } from "zod";
export const sections = [
  "context",
  "evidence",
  "audience",
  "stakeholders",
  "org-results",
  "workplace",
  "learning",
] as const;
export type Section = (typeof sections)[number];
export const answerSchema = z
  .object({
    text: z.string().max(150000),
    status: z.enum(["provided", "proposed", "unknown", "not_applicable"]),
  })
  .strict();
export const recordDataSchema = z
  .object({
    answers: z.record(z.string(), answerSchema),
    items: z
      .array(
        z
          .object({
            id: z.uuid(),
            answers: z.record(z.string(), answerSchema),
            links: z.array(z.uuid()).optional(),
          })
          .strict(),
      )
      .max(1000),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (new Set(v.items.map((i) => i.id)).size !== v.items.length)
      ctx.addIssue({ code: "custom", message: "Repeated item identifiers" });
  });
export type Answer = z.infer<typeof answerSchema>;
export type RecordData = z.infer<typeof recordDataSchema>;
export type SavedRecord = {
  project_id: string;
  section: Section;
  revision: number;
  data: RecordData;
};
export type Project = {
  id: string;
  title: string;
  stage: string;
  current_section: Section;
  saved_at: string;
  outstanding?: number;
};
export type Version = {
  id: string;
  revision: number;
  created_at: string;
  data: RecordData;
};
export type SaveResult = {
  record: SavedRecord;
  saved_at: string;
  operation_id: string;
};
export const emptyData = (): RecordData => ({ answers: {}, items: [] });
export function needed(records: Partial<Record<Section, SavedRecord>>) {
  return [
    ["context", "task"],
    ["context", "desired"],
    ["context", "current"],
    ["audience", "roles"],
  ].filter(([s, k]) => {
    const a = records[s as Section]?.data.answers[k];
    return !a?.text.trim() || a.status !== "provided";
  }).length;
}
