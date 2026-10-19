import { sections, type RecordData } from "./model";
import { workflowLabels, type WorkflowSection } from "./workflow-model";

// What each stage draft was built from. "brief" is the accepted Analysis brief version.
type Dependency =
  "brief" | "sources" | WorkflowSection | (typeof sections)[number];
export type Tracked = WorkflowSection | "development";
export const dependencies: Record<Tracked, readonly Dependency[]> = {
  "analysis-brief": sections,
  "design-solution": ["brief"],
  "design-objectives": ["brief", "design-solution", "learning"],
  "design-assessments": ["design-objectives", "learning"],
  "design-content": ["design-objectives", "design-assessments"],
  "design-sequence": [
    "design-objectives",
    "design-assessments",
    "design-content",
  ],
  "design-plan": [
    "design-solution",
    "design-objectives",
    "design-assessments",
    "design-content",
    "design-sequence",
  ],
  development: [
    "brief",
    "design-solution",
    "design-objectives",
    "design-assessments",
    "design-content",
    "design-sequence",
    "design-plan",
    "sources",
  ],
};
const analysisLabels: Record<string, string> = {
  context: "Project context and performance gap",
  evidence: "Evidence and possible causes",
  audience: "Audience and work environment",
  stakeholders: "Stakeholders and constraints",
  "org-results": "Organizational results",
  workplace: "Workplace performance",
  learning: "Evidence of learning",
};
type Snapshot = {
  records: Record<string, { revision: number; data: RecordData }>;
  accepted_revision?: number | null;
};
type Manifest = Record<string, { revision: number }>;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable((value as any)[k])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
// Change detection only (not security): a short, stable digest of designer-visible content.
const shown = (answers: RecordData["answers"]) =>
  Object.fromEntries(
    Object.entries(answers).filter(([k]) => !k.startsWith("_")),
  );
export function fingerprint(data: RecordData) {
  const visible = {
    answers: shown(data.answers),
    items: data.items.map((i) => ({ ...i, answers: shown(i.answers) })),
  };
  return digest(stable(visible));
}
export function digest(text: string) {
  let h1 = 0xdeadbeef,
    h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0")
  );
}

// The current state of a section's inputs. With a job manifest, an input that changed
// after the job read it is recorded as outdated so the new draft is flagged at once.
export function basisFor(
  section: Tracked,
  snapshot: Snapshot,
  manifest?: Manifest,
) {
  return Object.fromEntries(
    dependencies[section].map((dep) => {
      if (dep === "brief") {
        const pinned = manifest?.["analysis-brief"]?.revision;
        return [
          dep,
          pinned !== undefined && pinned !== snapshot.accepted_revision
            ? "outdated"
            : `version:${snapshot.accepted_revision ?? 0}`,
        ];
      }
      const record = snapshot.records[dep];
      if (!record) return [dep, "missing"];
      const pinned = manifest?.[dep]?.revision;
      return [
        dep,
        pinned !== undefined && pinned !== record.revision
          ? "outdated"
          : fingerprint(record.data),
      ];
    }),
  );
}
function readJSON(text: string | undefined) {
  try {
    const value = JSON.parse(text ?? "");
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}
export function staleReasons(
  section: Tracked,
  data: RecordData,
  snapshot: Snapshot,
) {
  const basis = readJSON(data.answers._basis?.text);
  if (!basis) return [];
  const current = basisFor(section, snapshot);
  return dependencies[section]
    .filter((dep) => basis[dep] !== current[dep])
    .map((dep) =>
      dep === "brief"
        ? "A different version of the Analysis brief was accepted for Design."
        : dep === "sources"
          ? "The project's source rules changed."
          : dep in workflowLabels
            ? `${workflowLabels[dep as WorkflowSection]} changed.`
            : `Analysis answers changed: ${analysisLabels[dep]}.`,
    );
}
export type SectionStatus = "empty" | "draft" | "reviewed" | "needs-update";
export function sectionStatus(
  section: Tracked,
  data: RecordData,
  snapshot: Snapshot,
): SectionStatus {
  if (
    !Object.keys(data.answers).some((k) => !k.startsWith("_")) &&
    !data.items.length
  )
    return "empty";
  if (staleReasons(section, data, snapshot).length) return "needs-update";
  return data.answers._reviewed?.text === fingerprint(data)
    ? "reviewed"
    : "draft";
}
export const statusLabels: Record<SectionStatus, string> = {
  empty: "Not started",
  draft: "Draft",
  reviewed: "Reviewed",
  "needs-update": "Needs update",
};
// Mark the current content reviewed against its current inputs.
export function markReviewed(
  section: Tracked,
  data: RecordData,
  snapshot: Snapshot,
): RecordData {
  return {
    ...data,
    answers: {
      ...data.answers,
      _reviewed: { text: fingerprint(data), status: "provided" },
      _basis: {
        text: JSON.stringify(basisFor(section, snapshot)),
        status: "provided",
      },
    },
  };
}
// Applied AI drafts record what they were built from; sections applied together see each other.
export function withBasis<T extends { key: Tracked; data: RecordData }>(
  applied: T[],
  snapshot: Snapshot,
  manifest: Manifest,
): T[] {
  const records = { ...snapshot.records };
  for (const s of applied)
    records[s.key] = { revision: records[s.key]?.revision ?? 0, data: s.data };
  const keys = new Set<string>(applied.map((s) => s.key));
  const external = Object.fromEntries(
    Object.entries(manifest).filter(([k]) => !keys.has(k)),
  );
  return applied.map((s) => ({
    ...s,
    data: {
      ...s.data,
      answers: {
        ...s.data.answers,
        _basis: {
          text: JSON.stringify(
            basisFor(s.key, { ...snapshot, records }, external),
          ),
          status: "provided",
        },
      },
    },
  }));
}
