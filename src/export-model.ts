import type { RecordData } from "./model";
import {
  developmentFields,
  developmentItemFields,
  fieldsFor,
  itemFieldsFor,
  workflowLabels,
  workflowSections,
  type WorkflowSection,
} from "./workflow-model";
import {
  digest,
  fingerprint,
  sectionStatus,
  staleReasons,
  statusLabels,
} from "./dependencies";
import { hasContent, itemStatus } from "./development-model";

export const exportable = [...workflowSections, "development"] as const;
export type Exportable = (typeof exportable)[number];
type Snapshot = {
  records: Record<string, { revision: number; data: RecordData }>;
  accepted_revision?: number | null;
};
type Field = { label: string; text: string };
export type ExportPart = {
  key: Exportable;
  label: string;
  version: number;
  status: string;
  fields: Field[];
  items: { heading: string; status?: string; fields: Field[] }[];
};
export type ExportDoc = {
  title: string;
  exportedAt: string;
  status: "Draft" | "Ready for handoff";
  deliverable: string;
  parts: ExportPart[];
  sources: { name: string; kind: string; usable: boolean }[];
  issues: { where: string; text: string }[];
  comments:
    | {
        where: string;
        version: number;
        name: string;
        body: string;
        at: string;
      }[]
    | null;
};
export type ExportComment = {
  target: { section: string; label?: string };
  display_name: string;
  body: string;
  created_at: string;
};

const choiceLabels: Record<string, Record<string, string>> = {
  route: {
    learning: "Learning",
    combined: "Learning and changes beyond learning",
    nonlearning: "Changes beyond learning only",
    investigate: "Further investigation",
  },
  deliverable: {
    "e-learning": "E-learning",
    "performance-aid": "Performance aid",
    both: "E-learning and a performance aid",
  },
  format: { microlearning: "Microlearning", course: "Course", mix: "A mix" },
  tools: {
    storyline: "Storyline 360",
    rise: "Rise 360",
    both: "Storyline 360 and Rise 360",
  },
};
const issueKeys = ["questions", "review", "gaps", "issues"];
export const partLabel = (key: Exportable) =>
  key === "development" ? "Development" : workflowLabels[key];
const hasDraft = (data: RecordData) =>
  data.items.length > 0 ||
  Object.keys(data.answers).some((k) => !k.startsWith("_"));
const itemStatusLabels = {
  outline: "Outline only",
  draft: "Draft",
  reviewed: "Reviewed",
};

function part(key: Exportable, snapshot: Snapshot): ExportPart {
  const record = snapshot.records[key];
  const data = record.data;
  const labels =
    key === "development"
      ? developmentFields
      : fieldsFor(key as WorkflowSection);
  const itemLabels =
    key === "development"
      ? developmentItemFields
      : (itemFieldsFor(key as WorkflowSection) ?? []);
  const text = (k: string, value: string) => choiceLabels[k]?.[value] ?? value;
  const fields = labels
    .filter(([k]) => data.answers[k]?.text.trim() && k !== "learning_measures")
    .map(([k, label]) => ({ label, text: text(k, data.answers[k].text) }));
  if (
    key === "design-solution" &&
    data.answers.measures_confirmed?.text === "yes"
  )
    fields.push({
      label: "Learning measures",
      text: "Confirmed by the designer for instructional Design.",
    });
  const status =
    key === "development"
      ? staleReasons("development", data, snapshot).length
        ? statusLabels["needs-update"]
        : data.items.length &&
            data.items.every((i) => itemStatus(i) === "reviewed")
          ? statusLabels.reviewed
          : statusLabels.draft
      : statusLabels[sectionStatus(key, data, snapshot)];
  return {
    key,
    label: partLabel(key),
    version: record.revision,
    status,
    fields,
    items: data.items.map((item, n) => ({
      heading:
        [item.answers.code?.text, item.answers.title?.text]
          .filter((t) => t?.trim())
          .join(" ") || `Entry ${n + 1}`,
      ...(key === "development"
        ? { status: itemStatusLabels[itemStatus(item)] }
        : {}),
      fields: itemLabels
        .filter(([k]) => item.answers[k]?.text.trim())
        .map(([k, label]) => ({ label, text: item.answers[k].text })),
    })),
  };
}

// Exports present the saved content exactly as written, with no AI rewriting.
export function buildExport(
  snapshot: Snapshot,
  options: { sections: Exportable[]; comments: boolean },
  extras: {
    sources: { name: string; kind: string; usable: boolean }[];
    comments: (ExportComment & { version: number })[];
    exportedAt?: string;
  },
): ExportDoc {
  const included = exportable.filter(
    (s) =>
      options.sections.includes(s) &&
      snapshot.records[s] &&
      hasDraft(snapshot.records[s].data),
  );
  const parts = included.map((s) => part(s, snapshot));
  const issues: ExportDoc["issues"] = [];
  for (const s of included) {
    const data = snapshot.records[s].data;
    for (const reason of staleReasons(s, data, snapshot))
      issues.push({ where: partLabel(s), text: `Needs update: ${reason}` });
    for (const k of issueKeys)
      if (data.answers[k]?.text.trim())
        issues.push({ where: partLabel(s), text: data.answers[k].text });
    for (const item of data.items) {
      const where = `${partLabel(s)} · ${item.answers.code?.text || item.answers.title?.text || "entry"}`;
      if (item.answers.issues?.text.trim())
        issues.push({ where, text: item.answers.issues.text });
      if (s === "development" && !hasContent(item))
        issues.push({
          where,
          text: "Outline only: written content not drafted yet.",
        });
    }
  }
  const solution = snapshot.records["design-solution"]?.data.answers ?? {};
  const deliverable = ["deliverable", "format", "tools"]
    .map((k) => choiceLabels[k][solution[k]?.text ?? ""])
    .filter(Boolean)
    .join(" · ");
  return {
    title:
      snapshot.records.context?.data.answers.title?.text || "Untitled project",
    exportedAt: extras.exportedAt ?? new Date().toISOString(),
    status: handoffReady(snapshot, included) ? "Ready for handoff" : "Draft",
    deliverable: deliverable || "Not chosen yet",
    parts,
    sources: extras.sources,
    issues,
    comments: options.comments
      ? extras.comments
          .filter((c) => included.includes(c.target.section as Exportable))
          .map((c) => ({
            where: `${partLabel(c.target.section as Exportable)}${c.target.label ? ` · ${c.target.label}` : ""}`,
            version: c.version,
            name: c.display_name,
            body: c.body,
            at: c.created_at,
          }))
      : null,
  };
}

// Ready for handoff: the automatic checks pass and the designer confirmed this exact content.
export function handoffChecks(
  snapshot: Snapshot,
  included: readonly Exportable[],
) {
  const design = included.filter((s) => s !== "development");
  const dev = snapshot.records.development?.data;
  const checks = [
    {
      label: "Every included Design page is reviewed and up to date",
      ok: design.every((s) =>
        ["reviewed", "empty"].includes(
          sectionStatus(s, snapshot.records[s].data, snapshot),
        ),
      ),
    },
  ];
  if (included.includes("development") && dev)
    checks.push(
      {
        label: "Every Development section is written and reviewed",
        ok:
          dev.items.length > 0 &&
          dev.items.every((i) => itemStatus(i) === "reviewed"),
      },
      {
        label: "Development is up to date with Design",
        ok: staleReasons("development", dev, snapshot).length === 0,
      },
    );
  return checks;
}
export function handoffPrint(
  snapshot: Snapshot,
  included: readonly Exportable[],
) {
  return digest(
    included
      .map((s) => `${s}:${fingerprint(snapshot.records[s].data)}`)
      .join("|"),
  );
}
export function handoffReady(
  snapshot: Snapshot,
  included: readonly Exportable[],
) {
  const confirmed = snapshot.records.development?.data.answers._handoff?.text;
  return (
    included.length > 0 &&
    handoffChecks(snapshot, included).every((c) => c.ok) &&
    confirmed === handoffPrint(snapshot, included)
  );
}

// Splits labelled text into slide-sized pages, continuing long fields across pages.
export function paginate(fields: Field[], budget = 1100) {
  const pages: Field[][] = [[]];
  let used = 0;
  for (const field of fields) {
    let rest = field.text;
    let first = true;
    while (rest.length) {
      const room = Math.max(budget - used, 0);
      if (room < 200 && pages[pages.length - 1].length) {
        pages.push([]);
        used = 0;
        continue;
      }
      let cut = rest.length <= room ? rest.length : rest.lastIndexOf(" ", room);
      if (cut <= 0) cut = Math.min(room || budget, rest.length);
      pages[pages.length - 1].push({
        label: first ? field.label : `${field.label} (continued)`,
        text: rest.slice(0, cut).trim(),
      });
      used += cut + field.label.length;
      rest = rest.slice(cut).trimStart();
      first = false;
    }
  }
  return pages.filter((p) => p.length);
}
