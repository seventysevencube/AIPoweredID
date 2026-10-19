import React, { useState } from "react";
import { api } from "./http";
import {
  useRecord,
  saveText,
  RecordNotices,
  type Snapshot,
} from "./ProjectShell";
import type { ReviewLink } from "./Sharing";
import {
  buildExport,
  exportable,
  handoffChecks,
  handoffPrint,
  handoffReady,
  partLabel,
  type Exportable,
} from "./export-model";
import { downloadPptx } from "./pptx";
import { reviewComments } from "./PrintView";

const drafted = (snapshot: Snapshot, s: Exportable) => {
  const data = snapshot.records[s]?.data;
  return (
    !!data &&
    (data.items.length > 0 ||
      Object.keys(data.answers).some((k) => !k.startsWith("_")))
  );
};

// Exports of saved content, and the designer-confirmed Ready for handoff state.
export function Exports({
  id,
  userId,
  snapshot,
  onSnapshot,
  links,
}: {
  id: string;
  userId: string;
  snapshot: Snapshot;
  onSnapshot: (s: Snapshot) => void;
  links: ReviewLink[];
}) {
  const { controller, state, data, ready, blocked, refresh, saved } = useRecord(
    id,
    userId,
    "development",
    snapshot,
    onSnapshot,
  );
  const available = exportable.filter((s) => drafted(snapshot, s));
  const [chosen, setChosen] = useState<Exportable[]>(available),
    [comments, setComments] = useState(false),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const included = available.filter((s) => chosen.includes(s));
  const live = {
    ...snapshot,
    records: {
      ...snapshot.records,
      development: { ...snapshot.records.development, data },
    },
  };
  const checks = handoffChecks(live, included);
  const isReady = handoffReady(live, included);
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const query = new URLSearchParams({
    sections: included.join(","),
    comments: comments ? "1" : "0",
  }).toString();
  return (
    <section aria-labelledby="export-title" className="exports">
      <h2 id="export-title">Export</h2>
      <p>
        Exports use the latest saved version of each page, exactly as written:
        nothing is rewritten by AI. Each export states its versions, its status
        and the date, and earlier exports stay as they were.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <RecordNotices controller={controller} />
      <fieldset className="choices">
        <legend>What to include</legend>
        {available.length === 0 && (
          <p className="hint">Nothing has been drafted yet.</p>
        )}
        {available.map((s) => (
          <label className="checklabel" key={s}>
            <input
              type="checkbox"
              checked={chosen.includes(s)}
              onChange={(e) =>
                setChosen(
                  e.target.checked
                    ? [...chosen, s]
                    : chosen.filter((c) => c !== s),
                )
              }
            />
            {partLabel(s)}
          </label>
        ))}
        <label className="checklabel">
          <input
            type="checkbox"
            checked={comments}
            onChange={(e) => setComments(e.target.checked)}
          />
          Add reviewer comments as a separate appendix
        </label>
      </fieldset>
      <div className="workflowaccept">
        <h3>
          {isReady ? (
            <>
              <span aria-hidden="true">✓</span> Ready for handoff
            </>
          ) : (
            "Status: Draft"
          )}
        </h3>
        <ul className="checks">
          {checks.map((c) => (
            <li key={c.label}>
              <span aria-hidden="true">{c.ok ? "✓" : "!"}</span>{" "}
              {c.ok ? "" : "Not yet: "}
              {c.label}
            </li>
          ))}
        </ul>
        {!isReady && (
          <>
            <label className="checklabel">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
              />
              I confirm reviewed assessments are preserved, tool instructions
              are feasible, and essential accuracy, source and implementation
              issues are resolved. Remaining placeholders and unknowns are
              listed as open issues.
            </label>
            <button
              disabled={
                busy ||
                blocked ||
                !confirm ||
                !included.length ||
                !checks.every((c) => c.ok)
              }
              onClick={() =>
                void act(async () => {
                  await saved();
                  const current = await refresh();
                  controller.edit(
                    {
                      ...controller.state.data,
                      answers: {
                        ...controller.state.data.answers,
                        _handoff: {
                          text: handoffPrint(current, included),
                          status: "provided",
                        },
                      },
                    },
                    true,
                  );
                  await controller.flush();
                  setConfirm(false);
                })
              }
            >
              Confirm ready for handoff
            </button>
          </>
        )}
        <p className="hint">
          {isReady
            ? "Any later change to the included pages returns exports to Draft until you confirm again."
            : "Until confirmed, exports are labelled Draft and list unresolved issues."}{" "}
          {state.status !== "saved" && saveText(ready, state)}
        </p>
      </div>
      <div className="buttonrow">
        <button
          className="primary"
          disabled={busy || !included.length}
          onClick={() =>
            void act(async () => {
              const current = await refresh();
              const [sources, reviews] = await Promise.all([
                api(`/projects/${id}/source-files`),
                comments
                  ? api(`/projects/${id}/reviews`)
                  : Promise.resolve({ links }),
              ]);
              await downloadPptx(
                buildExport(
                  current,
                  { sections: included, comments },
                  {
                    sources: sources.sources,
                    comments: reviewComments(reviews.links),
                  },
                ),
              );
            })
          }
        >
          Download editable PowerPoint (.pptx)
        </button>
        <a
          className="button"
          href={`#/projects/${id}/print?${query}`}
          target="_blank"
          rel="noopener"
          aria-disabled={!included.length}
          onClick={(e) => {
            if (!included.length) e.preventDefault();
          }}
        >
          Open print-ready PDF (new tab)
        </a>
      </div>
      <p className="hint">
        For PDF, choose Print, then Save as PDF. Exact page and slide templates
        and accessible-output checks remain to be reviewed.
      </p>
    </section>
  );
}
