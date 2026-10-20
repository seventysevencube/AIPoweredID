import React, { useEffect, useState } from "react";
import { api } from "./http";
import { labels } from "./questions";
import type { Project, Section } from "./model";
import { pageLabels, type Page, type Snapshot } from "./ProjectShell";
import { nextStep } from "./preferences-model";
import { sectionStatus, staleReasons } from "./dependencies";
import { workflowSections } from "./workflow-model";

const when = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
// The last page opened for a project, remembered on this device only.
export const lastPageKey = (user: string, project: string) =>
  `last-page:${user}:${project}`;
function lastPage(user: string, project: string) {
  try {
    return localStorage.getItem(lastPageKey(user, project));
  } catch {
    return null;
  }
}
const pageName = (page: string) =>
  pageLabels[page as Page] ?? labels[page as Section] ?? "Analysis";

// A project's stage, open updates and next step, read from its saved records. Never generates.
export function ProjectCard({
  project: p,
  user,
}: {
  project: Project;
  user: string;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  useEffect(() => {
    api(`/projects/${p.id}/workflow`)
      .then(setSnapshot)
      .catch(() => {});
  }, [p.id]);
  const coreMissing = typeof p.outstanding === "number" && p.outstanding > 0;
  const step = snapshot
    ? coreMissing && !snapshot.records["analysis-brief"]?.data.answers.gap
      ? {
          text: `Complete ${p.outstanding} core ${p.outstanding === 1 ? "answer" : "answers"} needed for Design.`,
          page: p.current_section,
        }
      : nextStep(snapshot)
    : null;
  const updates = snapshot
    ? workflowSections.filter(
        (s) =>
          snapshot.records[s] &&
          sectionStatus(s, snapshot.records[s].data, snapshot) ===
            "needs-update",
      ).length +
      (snapshot.records.development &&
      staleReasons("development", snapshot.records.development.data, snapshot)
        .length
        ? 1
        : 0)
    : 0;
  const stage = !snapshot
    ? p.stage
    : snapshot.records.development?.data.items.length
      ? "Development"
      : snapshot.accepted_revision
        ? "Design"
        : "Analysis";
  const resume = lastPage(user, p.id) ?? step?.page ?? p.current_section;
  return (
    <article className="projectcard">
      <span className="stage">{stage}</span>
      <h2>{p.title}</h2>
      <p className="hint">Last saved {when(p.saved_at)}</p>
      <div className="cardrecap">
        {step ? (
          <>
            <p>
              Next step
              <br />
              <strong>{step.text}</strong>
            </p>
            <p className={updates ? "cardissue" : ""}>
              {updates ? (
                <>
                  <span aria-hidden="true">! </span>
                  {updates} {updates === 1 ? "page needs" : "pages need"} an
                  update
                </>
              ) : (
                "No pages need an update"
              )}
            </p>
          </>
        ) : (
          <p role="status">Checking progress…</p>
        )}
      </div>
      <a className="button primary" href={`#/projects/${p.id}/${resume}`}>
        Continue: {pageName(resume)} <span aria-hidden="true">→</span>
      </a>
    </article>
  );
}
