import type { RecordData } from "./model";
import { fingerprint, sectionStatus } from "./dependencies";
import { outlineFields, workflowSections } from "./workflow-model";

type Item = RecordData["items"][number];
type Snapshot = {
  records: Record<string, { revision: number; data: RecordData }>;
  accepted_revision?: number | null;
};
export type ItemStatus = "outline" | "draft" | "reviewed";

const itemPrint = (item: Item) =>
  fingerprint({ answers: item.answers, items: [] });
// A section has written content once any non-outline field is filled.
export const hasContent = (item: Item) =>
  Object.entries(item.answers).some(
    ([k, v]) =>
      !k.startsWith("_") && !outlineFields.includes(k) && !!v.text.trim(),
  );
export function itemStatus(item: Item): ItemStatus {
  if (!hasContent(item)) return "outline";
  return item.answers._reviewed?.text === itemPrint(item)
    ? "reviewed"
    : "draft";
}
export function reviewItem(item: Item): Item {
  return {
    ...item,
    answers: {
      ...item.answers,
      _reviewed: { text: itemPrint(item), status: "provided" },
    },
  };
}
export const sampleOf = (data: RecordData) =>
  data.items.find((i) => i.id === data.answers._sample?.text);
// Accepting the sample's treatment covers the treatment text and the sample section as they
// stand; editing either afterwards needs a fresh acceptance. It never verifies facts.
export function treatmentPrint(data: RecordData) {
  const sample = sampleOf(data);
  return fingerprint({
    answers: {
      treatment: data.answers.treatment ?? { text: "", status: "provided" },
    },
    items: sample ? [sample] : [],
  });
}
export const treatmentAccepted = (data: RecordData) =>
  !!sampleOf(data) &&
  data.answers._treatment_accepted?.text === treatmentPrint(data);

// Development starts from a reviewed Design: every Design page with content is reviewed and
// up to date, and the Design plan exists.
export function designReadiness(snapshot: Snapshot) {
  const pending = workflowSections.slice(1).filter((s) => {
    const status = sectionStatus(s, snapshot.records[s].data, snapshot);
    return s === "design-plan"
      ? status !== "reviewed"
      : status === "draft" || status === "needs-update";
  });
  return { ready: pending.length === 0, pending };
}
