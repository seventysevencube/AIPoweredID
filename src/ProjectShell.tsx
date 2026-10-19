import React, { useEffect, useState } from "react";
import { api } from "./http";
import { SaveController, type SaveState } from "./save";
import { recovery } from "./recovery";
import type { SavedRecord } from "./model";
import {
  workflowSections,
  workflowLabels,
  type AITask,
  type WorkflowSection,
  type ProjectSection,
} from "./workflow-model";
import {
  sectionStatus,
  statusLabels,
  type SectionStatus,
} from "./dependencies";
import type { RecordData } from "./model";
import { nextStep } from "./preferences-model";

export type Snapshot = {
  records: Record<string, SavedRecord>;
  accepted_revision?: number;
  accepted_data?: RecordData;
  jobs: {
    id: string;
    state: string;
    task: AITask;
    failure?: string;
    target?: string | null;
  }[];
};
// Every project page beyond the Analysis forms.
export type Page = WorkflowSection | ProjectSection | "sharing";
export const pageLabels: Record<Page, string> = {
  ...workflowLabels,
  development: "Development",
  sources: "Sources",
  preferences: "AI preferences",
  sharing: "Share and export",
};
export const statusIcons: Record<SectionStatus, string> = {
  empty: "○",
  draft: "✎",
  reviewed: "✓",
  "needs-update": "!",
};

// Autosave, recovery and conflict handling for one project record.
export function useRecord(
  id: string,
  userId: string,
  section: string,
  snapshot: Snapshot,
  onSnapshot: (s: Snapshot) => void,
) {
  const [, redraw] = useState(0),
    [ready, setReady] = useState(false);
  const [controller] = useState(
    () =>
      new SaveController(
        `${userId}:${id}:${section}`,
        snapshot.records[section],
        recovery,
        ({ seq, ...flight }) =>
          api(`/projects/${id}/${section}`, "PUT", flight),
        () => redraw((n) => n + 1),
      ),
  );
  async function refresh() {
    const r = await api(`/projects/${id}/workflow`);
    onSnapshot(r);
    controller.observe(r.records[section]);
    return r as Snapshot;
  }
  useEffect(() => {
    let active = true;
    void controller.start().then(() => {
      if (active) setReady(true);
    });
    const t = setInterval(() => {
      void refresh().catch(() => {});
    }, 10000);
    const online = () => controller.resume();
    const leave = (e: BeforeUnloadEvent) => {
      if (controller.dirty) {
        void controller.flush();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", leave);
    return () => {
      active = false;
      clearInterval(t);
      void controller.flush();
      controller.stop();
      window.removeEventListener("online", online);
      window.removeEventListener("beforeunload", leave);
    };
  }, []);
  async function saved() {
    await controller.flush();
    if (controller.dirty || controller.state.status !== "saved")
      throw Error(
        "Wait for all edits to save and resolve any draft conflicts before continuing.",
      );
  }
  const blocked =
    !ready ||
    ["conflict", "recovery", "signin"].includes(controller.state.status);
  return {
    controller,
    state: controller.state,
    data: controller.state.data,
    ready,
    blocked,
    refresh,
    saved,
  };
}
export function saveText(ready: boolean, state: SaveState) {
  return !ready
    ? "Opening…"
    : state.status === "saved"
      ? "All changes saved"
      : state.status === "waiting"
        ? "Saved on this device — waiting to sync"
        : state.status === "conflict"
          ? "Changes need review"
          : state.status === "recovery"
            ? "Recoverable draft found"
            : "Saving…";
}
export function RecordNotices({ controller }: { controller: SaveController }) {
  const state = controller.state;
  return (
    <>
      {state.localFailure && (
        <p className="note">
          Browser recovery is unavailable. Keep this page open until changes are
          saved.
        </p>
      )}
      {state.status === "recovery" && (
        <div className="notice">
          <p>A recoverable draft is available.</p>
          <button onClick={() => void controller.recover()}>
            Continue with my draft
          </button>
        </div>
      )}
      {state.status === "conflict" && state.server && (
        <div className="notice">
          <h2>Newer work was saved</h2>
          <p>Your draft is preserved. Review both copies before continuing.</p>
          <details>
            <summary>Compare copies</summary>
            <pre>
              {JSON.stringify(
                { yourDraft: state.data, server: state.server.data },
                null,
                2,
              )}
            </pre>
          </details>
          <button
            onClick={() => void controller.resolve(state.server!, state.data)}
          >
            Use my draft as starting point
          </button>
          <button
            onClick={() =>
              void controller.resolve(state.server!, state.server!.data)
            }
          >
            Use saved version
          </button>
        </div>
      )}
    </>
  );
}

export function ProjectShell({
  id,
  snapshot,
  page,
  live,
  status,
  onNavigate,
  children,
}: {
  id: string;
  snapshot: Snapshot;
  page: Page;
  live?: RecordData;
  status?: string;
  onNavigate: (target: string) => void;
  children: React.ReactNode;
}) {
  const [budget, setBudget] = useState<any>(null);
  useEffect(() => {
    void api("/ai/budget")
      .then(setBudget)
      .catch(() => {});
  }, []);
  // Statuses read this page's live draft, not the last periodic refresh.
  const current = live
    ? {
        ...snapshot,
        records: {
          ...snapshot.records,
          [page]: { ...snapshot.records[page], data: live },
        },
      }
    : snapshot;
  const title =
    snapshot.records.context.data.answers.title?.text || "Untitled project";
  const next = nextStep(current);
  const link = (target: Page | "context", label: React.ReactNode) => (
    <a
      href={`#/projects/${id}/${target}`}
      aria-current={target === page ? "page" : undefined}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(target);
      }}
    >
      {label}
    </a>
  );
  const stage =
    page === "analysis-brief"
      ? "Analysis"
      : page === "development"
        ? "Development"
        : page.startsWith("design-")
          ? "Design"
          : "Project";
  return (
    <>
      <div className="projectbar">
        <a href="#/projects">← Projects</a>
        <strong>{title}</strong>
        <span className="stage">{stage}</span>
        {status && (
          <p className="savestatus" role="status">
            {status}
          </p>
        )}
      </div>
      <div className="workspace">
        <aside className="sidebar">
          <p className="eyebrow">Your learning project</p>
          <nav aria-label="Project stages">
            {link("context", "← Analysis inputs")}
            {[...workflowSections, "development" as const].map((s, i) => {
              const st =
                s === "development" || !current.records[s]
                  ? null
                  : sectionStatus(s, current.records[s].data, current);
              return (
                <div className="navitem" key={s}>
                  {link(
                    s,
                    <>
                      <span className="navnumber">{i + 1}</span>
                      {pageLabels[s]}
                    </>,
                  )}
                  {(st === "needs-update" || st === "reviewed") && (
                    <span className={"navstatus " + st}>
                      <span aria-hidden="true">{statusIcons[st]}</span>{" "}
                      {statusLabels[st]}
                    </span>
                  )}
                </div>
              );
            })}
            <p className="navgroup">Project</p>
            {(["sources", "preferences", "sharing"] as const).map((s) => (
              <div className="navitem" key={s}>
                {link(s, pageLabels[s])}
              </div>
            ))}
          </nav>
          <div className="nextstage">
            <p className="eyebrow">Next step</p>
            <p>
              <a
                href={`#/projects/${id}/${next.page}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(next.page);
                }}
              >
                {next.text}
              </a>
            </p>
            <p className="eyebrow">You direct the design</p>
            <p>
              AI proposes. You review, refine, and choose what moves forward.
            </p>
            {budget && (
              <p className="hint">
                Shared AI allowance: $
                {(Number(budget.spent_microusd) / 1e6).toFixed(2)} booked of $20
                this month.
              </p>
            )}
          </div>
        </aside>
        <main id="main" tabIndex={-1} className="editor">
          {children}
        </main>
      </div>
    </>
  );
}
