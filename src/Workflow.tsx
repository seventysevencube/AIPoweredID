import React, { useEffect, useState } from "react";
import { api } from "./http";
import { SaveController } from "./save";
import { recovery } from "./recovery";
import {
  analysisAIReadiness,
  sections,
  type SavedRecord,
  type RecordData,
} from "./model";
import {
  workflowSections,
  workflowLabels,
  workflowFields,
  itemFields,
  type WorkflowSection,
  type AITask,
  isRevision,
  proposalData,
  solutionDecisions,
} from "./workflow-model";
import { SourcesPage } from "./Sources";
import {
  ProjectShell,
  RecordNotices,
  type Page,
  saveText,
  statusIcons,
  useRecord,
  type Snapshot,
} from "./ProjectShell";
import {
  digest,
  markReviewed,
  withBasis,
  sectionStatus,
  staleReasons,
  statusLabels,
  type SectionStatus,
} from "./dependencies";

const failureText: Record<string, string> = {
  pipeline_failed:
    "The AI service did not return a draft that passed the app's checks.",
  reconciled_explicit_retry_required:
    "The charge for the earlier attempt was confirmed.",
  access_or_period_unavailable:
    "The monthly AI budget period or account access was not available.",
  access_unavailable: "Account access changed before the draft finished.",
  access_or_input_unavailable:
    "The saved inputs or account access changed before AI started.",
};
const message = (e: unknown) =>
  e instanceof Error ? e.message : "Please try again.";
export function Workflow({
  id,
  userId,
  section,
}: {
  id: string;
  userId: string;
  section: Page;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api(`/projects/${id}/workflow`)
      .then((r) => {
        if (active) setSnapshot(r);
      })
      .catch((e) => setError(message(e)));
    return () => {
      active = false;
    };
  }, [id]);
  if (error)
    return (
      <main id="main" className="center">
        <h1>Workspace unavailable</h1>
        <p role="alert">{error}</p>
        <a href={`#/projects/${id}/context`}>Return to Analysis</a>
      </main>
    );
  if (!snapshot)
    return (
      <main id="main" className="center">
        <p role="status">Opening your design workspace…</p>
      </main>
    );
  const go = async (target: string) => {
    location.hash = `/projects/${id}/${target}`;
  };
  if (section === "sources")
    return (
      <SourcesPage
        key={id + section}
        {...{ id, userId, snapshot }}
        onSnapshot={setSnapshot}
        onNavigate={go}
      />
    );
  if (!workflowSections.includes(section as WorkflowSection))
    return (
      <main id="main" className="center">
        <h1>Page unavailable</h1>
        <a href={`#/projects/${id}/context`}>Return to Analysis</a>
      </main>
    );
  return (
    <WorkflowEditor
      key={id + section}
      {...{ id, userId, snapshot }}
      section={section as WorkflowSection}
      onSnapshot={setSnapshot}
    />
  );
}
function WorkflowEditor({
  id,
  userId,
  section,
  snapshot,
  onSnapshot,
}: {
  id: string;
  userId: string;
  section: WorkflowSection;
  snapshot: Snapshot;
  onSnapshot: (s: Snapshot) => void;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reviewed, setReviewed] = useState(false),
    [job, setJob] = useState<any>(null),
    [history, setHistory] = useState<any[] | null>(null),
    [note, setNote] = useState(""),
    [dismissed, setDismissed] = useState("");
  const { controller, state, data, ready, blocked, refresh, saved } = useRecord(
    id,
    userId,
    section,
    snapshot,
    onSnapshot,
  );
  const base = `/projects/${id}`;
  const relevant =
    section === "analysis-brief"
      ? "analysis"
      : section === "design-solution"
        ? "solution"
        : "design";
  const coreReady = analysisAIReadiness(
    Object.fromEntries(sections.map((s) => [s, snapshot.records[s]])),
  ).ready;
  const revision =
    section === "analysis-brief" ? null : (`revise-${section}` as AITask);
  // The page follows its newest first-draft or revision job.
  const latest = snapshot.jobs.find(
    (j) => j.task === relevant || j.task === revision,
  );
  useEffect(() => {
    if (!latest) return;
    let active = true;
    const poll = async () => {
      try {
        const r = await api(base + `/ai-jobs/${latest.id}`);
        if (active) setJob(r.job);
      } catch (e) {
        if (active) setError(message(e));
      }
    };
    void poll();
    const t = setInterval(() => void poll(), 2500);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [latest?.id]);
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function navigate(target: string) {
    await controller.flush();
    location.hash = `/projects/${id}/${target}`;
  }
  // fresh: always a new attempt (revisions, or a new brief from unchanged Analysis).
  async function generate(task: AITask, fresh = false, note = "") {
    await saved();
    const current = await refresh();
    const expected_revisions = Object.fromEntries(
      sections.map((s) => [s, current.records[s].revision]),
    );
    // A repeated click replays the same request; a new attempt after a failure gets its own.
    const previous = current.jobs.find((j) => j.task === task);
    const retrying =
      !!previous && ["failed", "cancelled"].includes(previous.state);
    const submit = (attempt: string, retry_of?: string) => {
      const intentKey = `ai-intent:${userId}:${id}:${task}:${JSON.stringify(expected_revisions)}:${current.records["design-solution"].revision}:${current.accepted_revision ?? 0}:${attempt}`;
      let requestId = crypto.randomUUID();
      try {
        const prior = localStorage.getItem(intentKey);
        if (prior) requestId = prior as typeof requestId;
        else localStorage.setItem(intentKey, requestId);
      } catch {}
      return api(base + "/ai-jobs", "POST", {
        request_id: requestId,
        expected_revisions,
        task,
        ...(retry_of ? { retry_of } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
    };
    let pending;
    // An unchanged retry reuses completed steps; changed inputs need a fresh job.
    if (retrying && previous?.state === "failed")
      try {
        pending = await submit(`retry:${previous.id}`, previous.id);
      } catch (e) {
        if ((e as { error?: string }).error !== "invalid_retry") throw e;
      }
    pending ??= await submit(
      retrying
        ? `fresh:${previous!.id}`
        : fresh
          ? `after:${previous?.id ?? "none"}:${digest(note.trim())}`
          : "initial",
    );
    await refresh();
    if (task === relevant || task === revision)
      setJob({ id: pending.job_id, state: pending.state, task });
  }
  // Using a proposal replaces the draft through an ordinary save; history keeps the earlier version.
  async function useProposal() {
    if (!job?.result) return;
    await saved();
    const current = await refresh();
    const output = job.result.sections.find(
      (s: { key: string }) => s.key === section,
    );
    const proposed = proposalData(output);
    if (section === "design-solution")
      for (const key of solutionDecisions) {
        const kept = controller.state.data.answers[key];
        if (kept) proposed.answers[key] = kept;
        else delete proposed.answers[key];
      }
    const [next] = withBasis(
      [{ key: section, data: proposed }],
      current,
      job.input_manifest ?? {},
    );
    next.data.answers._job = { text: job.id, status: "provided" };
    controller.edit(next.data, true);
    await controller.flush();
  }
  function dismiss() {
    try {
      localStorage.setItem(`ai-dismissed:${job.id}`, "1");
    } catch {}
    setDismissed(job.id);
  }
  // Reviewing records the exact content and the inputs it was checked against.
  async function review() {
    await saved();
    const current = await refresh();
    controller.edit(
      markReviewed(section, controller.state.data, current),
      true,
    );
    await controller.flush();
  }
  async function apply() {
    if (!job) return;
    await saved();
    await api(base + "/workflow/apply", "POST", { job_id: job.id });
    await refresh();
  }
  function field(key: string, text: string) {
    controller.edit({
      ...data,
      answers: { ...data.answers, [key]: { text, status: "provided" } },
    });
  }
  const hasDraft =
    Object.keys(data.answers).some((k) => !k.startsWith("_")) ||
    data.items.length > 0;
  const accepted =
    snapshot.accepted_revision === snapshot.records["analysis-brief"].revision;
  const learning = snapshot.records.learning;
  const measures = learning.data.items.filter(
    (m) =>
      m.answers.indicator?.status === "provided" &&
      m.answers.indicator.text.trim(),
  );
  const instructional = data.answers.route?.text !== "nonlearning";
  const learningConfirmed =
    data.answers.measures_confirmed?.text === "yes" &&
    data.answers.learning_revision?.text === String(learning.revision) &&
    measures.length > 0;
  const designGated =
    section !== "analysis-brief" &&
    section !== "design-solution" &&
    (!accepted ||
      !["learning", "combined", "nonlearning"].includes(
        snapshot.records["design-solution"].data.answers.route?.text ?? "",
      ) ||
      (snapshot.records["design-solution"].data.answers.route?.text !==
        "nonlearning" &&
        (snapshot.records["design-solution"].data.answers.measures_confirmed
          ?.text !== "yes" ||
          snapshot.records["design-solution"].data.answers.learning_revision
            ?.text !== String(learning.revision) ||
          !measures.length)));
  // Statuses read this page's live draft, not the last periodic refresh.
  const live = {
    ...snapshot,
    records: {
      ...snapshot.records,
      [section]: { ...snapshot.records[section], data },
    },
  };
  const statusOf = (s: WorkflowSection) =>
    sectionStatus(s, live.records[s].data, live);
  const status = statusOf(section);
  const reasons = staleReasons(section, data, live);
  const failed = !!job && ["failed", "cancelled"].includes(job.state);
  const opened = !!job && data.answers._job?.text === job.id;
  let wasDismissed = dismissed === job?.id;
  try {
    wasDismissed ||= !!job && !!localStorage.getItem(`ai-dismissed:${job.id}`);
  } catch {}
  // A completed result for this page that is not yet in the draft is offered as a proposal.
  const proposal =
    job?.state === "completed" &&
    !opened &&
    !wasDismissed &&
    (hasDraft || isRevision(job.task)) &&
    job.result?.sections?.find((s: { key: string }) => s.key === section);
  const active =
    !!job && ["queued", "running", "cost_pending"].includes(job.state);
  const designFailed = ["failed", "cancelled"].includes(
    snapshot.jobs.find((j) => j.task === "design")?.state ?? "",
  );
  const canGenerate =
    section === "analysis-brief"
      ? coreReady
      : section === "design-solution"
        ? accepted
        : !designGated;
  const title =
    snapshot.records.context.data.answers.title?.text || "Untitled project";
  return (
    <ProjectShell
      id={id}
      snapshot={snapshot}
      page={section}
      live={data}
      status={saveText(ready, state)}
      onNavigate={(t) => void navigate(t)}
    >
      <p className="eyebrow">
        {section === "analysis-brief"
          ? "Synthesize and review"
          : "Design your response"}
      </p>
      <h1>{workflowLabels[section]}</h1>
      {section !== "analysis-brief" && (
        <p className={"sectionstatus " + status}>
          <span aria-hidden="true">{statusIcons[status]}</span>{" "}
          {statusLabels[status]}
        </p>
      )}
      <p className="sectionintro">
        {section === "analysis-brief"
          ? "Turn your saved Analysis into a starting point. Review it before you accept a version for Design."
          : "Build on the accepted Analysis. Every AI suggestion remains editable and requires your judgment."}
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <RecordNotices controller={controller} />
      {section === "design-content" && (
        <p className="note">
          Source files and the project-wide source rules are set once on the{" "}
          <a
            href={`#/projects/${id}/sources`}
            onClick={(e) => {
              e.preventDefault();
              void navigate("sources");
            }}
          >
            Sources page
          </a>
          . AI applies them to every enabling objective.
        </p>
      )}
      {reasons.length > 0 && (
        <section className="needsupdate" aria-labelledby="needsupdate">
          <h2 id="needsupdate">
            <span aria-hidden="true">{statusIcons["needs-update"]}</span> Needs
            update
          </h2>
          <p>This draft was built from inputs that have since changed:</p>
          <ul>
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="hint">
            Review it and edit anything that no longer fits. Nothing is
            rewritten automatically, and earlier versions stay in version
            history.
          </p>
          <button disabled={busy || blocked} onClick={() => void act(review)}>
            Mark as reviewed and up to date
          </button>
        </section>
      )}
      {snapshot.accepted_revision && !accepted && (
        <p className="note">
          The Analysis brief changed after acceptance. Existing Design work is
          preserved. Review the updated brief before generating more Design.
        </p>
      )}
      {job && !(job.state === "completed" && wasDismissed) && (
        <section className="ai-result">
          <p role="status">
            {job.state === "queued"
              ? "Waiting for the shared AI queue…"
              : job.state === "running"
                ? "AI is drafting and checking your result…"
                : job.state === "completed"
                  ? opened
                    ? "This draft started from an AI proposal. Review and edit it before relying on it."
                    : proposal
                      ? "An AI proposal is ready. Your draft has not changed."
                      : "AI draft is ready for your review."
                  : job.state === "cost_pending"
                    ? "AI is paused while a charge is checked. Your saved work is safe."
                    : "AI could not finish this draft. Nothing was changed, and your saved work is safe."}
          </p>
          {job.state === "cost_pending" && (
            <p className="hint">
              The pilot operator confirms the charge before AI continues. You
              can keep editing in the meantime.
            </p>
          )}
          {failed && (
            <>
              <p className="hint">
                {failureText[job.failure ?? ""] ??
                  "The AI service did not return a usable draft."}{" "}
                Trying again uses the shared AI budget.
              </p>
              <button
                className="primary"
                disabled={busy || blocked || !canGenerate}
                onClick={() =>
                  void act(() => generate(job.task, isRevision(job.task), note))
                }
              >
                {busy ? "Preparing…" : "Try again"}
              </button>
            </>
          )}
          {job.inputs_changed && !opened && job.state === "completed" && (
            <p className="note">
              Earlier inputs changed since this job started. Review them before
              using the result.
            </p>
          )}
          {proposal && (
            <>
              <details className="proposal" open>
                <summary>Review the proposal</summary>
                {proposal.fields
                  .filter(
                    (f: { key: string; text: string }) =>
                      f.text.trim() && !solutionDecisions.includes(f.key),
                  )
                  .map((f: { key: string; text: string }) => (
                    <div key={f.key}>
                      <h3>
                        {workflowFields[section].find(
                          ([k]) => k === f.key,
                        )?.[1] ?? f.key}
                      </h3>
                      <p>{f.text}</p>
                    </div>
                  ))}
                {proposal.items.map(
                  (
                    row: { fields: { key: string; text: string }[] },
                    n: number,
                  ) => (
                    <div className="proposalitem" key={n}>
                      {row.fields
                        .filter((f) => f.text.trim())
                        .map((f) => (
                          <p key={f.key}>
                            <strong>
                              {itemFields[section]?.find(
                                ([k]) => k === f.key,
                              )?.[1] ?? f.key}
                              :
                            </strong>{" "}
                            {f.text}
                          </p>
                        ))}
                    </div>
                  ),
                )}
              </details>
              <div className="buttonrow">
                <button
                  className="primary"
                  disabled={busy || blocked}
                  onClick={() => void act(useProposal)}
                >
                  Use this proposal
                </button>
                <button disabled={busy} onClick={dismiss}>
                  Keep my current draft
                </button>
              </div>
              <p className="hint">
                Using it replaces this section's draft. Your current version
                stays in version history
                {section === "design-solution"
                  ? ", and your solution choices are kept"
                  : ""}
                .
              </p>
            </>
          )}
          {job.state === "completed" && !hasDraft && !isRevision(job.task) && (
            <button
              className="primary"
              disabled={busy || blocked}
              onClick={() => void act(apply)}
            >
              Open the AI draft
            </button>
          )}
          {["queued", "running"].includes(job.state) && (
            <button
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  await api(base + "/workflow/wake", "POST", {});
                })
              }
            >
              Check queue
            </button>
          )}
        </section>
      )}
      {hasDraft && (
        <details className="revise">
          <summary>
            {section === "analysis-brief"
              ? "Ask AI for a new brief from your current Analysis"
              : "Ask AI to revise this section"}
          </summary>
          {section === "analysis-brief" ? (
            <p className="hint">
              AI drafts a new brief from your saved Analysis answers. It is
              shown as a proposal; your brief stays as it is until you choose to
              use it.
            </p>
          ) : (
            <div className="question">
              <label htmlFor="revision-request">
                What should change? (optional)
              </label>
              <textarea
                id="revision-request"
                rows={3}
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <p className="hint">
                AI reworks only this section, keeping it consistent with the
                accepted brief, your solution choices and the other Design
                sections. The result is a proposal; your draft stays as it is
                until you choose to use it.
              </p>
            </div>
          )}
          <button
            disabled={busy || blocked || !canGenerate || active}
            onClick={() =>
              void act(() =>
                revision
                  ? generate(revision, true, note)
                  : generate("analysis", true),
              )
            }
          >
            {section === "analysis-brief"
              ? "Request a new brief"
              : "Request AI revision"}
          </button>
          <p className="hint">Each request uses the shared AI budget.</p>
        </details>
      )}
      {!hasDraft && (
        <section className="emptyworkflow">
          <h2>
            {section === "analysis-brief"
              ? "Ready to connect your Analysis?"
              : "Start with a reviewed foundation"}
          </h2>
          <p>
            {section === "analysis-brief"
              ? "Four core answers must be complete. Optional unknowns are preserved as open questions."
              : section === "design-solution"
                ? "Accept the Analysis brief, then ask AI to help assess learning and other performance responses."
                : "Confirm the performance solution and learning measures, then generate the Design skeleton from the Performance solution page."}
          </p>
          {section !== "analysis-brief" && section !== "design-solution"
            ? !job && (
                <a
                  href={`#/projects/${id}/design-solution`}
                  onClick={(e) => {
                    e.preventDefault();
                    void navigate("design-solution");
                  }}
                >
                  Go to Performance solution →
                </a>
              )
            : !failed && (
                <button
                  className="primary"
                  disabled={
                    busy ||
                    blocked ||
                    !canGenerate ||
                    (!!job &&
                      ["queued", "running", "cost_pending"].includes(job.state))
                  }
                  onClick={() => void act(() => generate(relevant))}
                >
                  {busy
                    ? "Preparing…"
                    : section === "analysis-brief"
                      ? "Generate Analysis brief"
                      : "Suggest performance solution"}
                </button>
              )}
        </section>
      )}
      {designGated && (
        <p className="note">
          Review the Performance solution before continuing.
        </p>
      )}
      <fieldset
        className="workflowfields"
        aria-label={workflowLabels[section] + " draft"}
        disabled={blocked || designGated || busy}
      >
        {workflowFields[section].map(([key, label]) => {
          if (section === "design-solution") {
            const deliverable = data.answers.deliverable?.text;
            if (
              ["format", "tools"].includes(key) &&
              !["e-learning", "both"].includes(deliverable ?? "")
            )
              return null;
            if (key === "allocation" && data.answers.tools?.text !== "both")
              return null;
            if (
              key === "learning_measures" &&
              data.answers.route?.text === "nonlearning"
            )
              return null;
          }

          if (section === "design-solution" && key === "learning_measures")
            return (
              <div className="question" key={key}>
                <h2>Evidence of learning</h2>
                {measures.length ? (
                  measures.map((m) => (
                    <p key={m.id}>
                      {m.answers.indicator.text} {m.answers.criteria?.text}
                    </p>
                  ))
                ) : (
                  <p>
                    Add a learning measure in Analysis before instructional
                    Design.
                  </p>
                )}
                <a
                  href={`#/projects/${id}/learning`}
                  onClick={(e) => {
                    e.preventDefault();
                    void navigate("learning");
                  }}
                >
                  Review linked Analysis learning measures →
                </a>
                <label className="checklabel">
                  <input
                    type="checkbox"
                    disabled={!measures.length}
                    checked={learningConfirmed}
                    onChange={(e) =>
                      controller.edit(
                        {
                          ...data,
                          answers: {
                            ...data.answers,
                            measures_confirmed: {
                              text: e.target.checked ? "yes" : "no",
                              status: "provided",
                            },
                            learning_revision: {
                              text: String(learning.revision),
                              status: "provided",
                            },
                          },
                        },
                        true,
                      )
                    }
                  />
                  I confirm these measures for instructional Design.
                </label>
              </div>
            );
          const choices =
            section === "design-solution"
              ? key === "route"
                ? [
                    ["learning", "Learning"],
                    ["combined", "Learning and changes beyond learning"],
                    ["nonlearning", "Changes beyond learning only"],
                    ["investigate", "Further investigation"],
                  ]
                : key === "deliverable"
                  ? [
                      ["e-learning", "E-learning"],
                      ["performance-aid", "Performance aid"],
                      ["both", "Both"],
                    ]
                  : key === "format"
                    ? [
                        ["microlearning", "Microlearning"],
                        ["course", "Course"],
                        ["mix", "A mix"],
                      ]
                    : key === "tools"
                      ? [
                          ["storyline", "Storyline 360"],
                          ["rise", "Rise 360"],
                          ["both", "Both"],
                        ]
                      : null
              : null;
          return (
            <div className="question" key={key}>
              <label htmlFor={section + key}>{label}</label>
              {choices ? (
                <select
                  id={section + key}
                  value={data.answers[key]?.text ?? ""}
                  onChange={(e) => field(key, e.target.value)}
                >
                  <option value="">Choose…</option>
                  {choices.map(([v, l]) => (
                    <option value={v} key={v}>
                      {l}
                    </option>
                  ))}
                </select>
              ) : (
                <textarea
                  id={section + key}
                  rows={section === "analysis-brief" ? 6 : 4}
                  value={data.answers[key]?.text ?? ""}
                  onChange={(e) => field(key, e.target.value)}
                />
              )}
            </div>
          );
        })}
        {itemFields[section] && (
          <>
            <h2>
              {section === "design-objectives"
                ? "Main and enabling objectives"
                : section === "design-assessments"
                  ? "Assessment and practice items"
                  : section === "design-content"
                    ? "Content mapping"
                    : "Sequence map"}
            </h2>
            {data.items.map((item, index) => (
              <section className="workflowcard" key={item.id}>
                <h3>{item.answers.code?.text || `Entry ${index + 1}`}</h3>
                {itemFields[section]!.map(([key, label]) => (
                  <div className="question" key={key}>
                    <label htmlFor={item.id + key}>{label}</label>
                    <textarea
                      id={item.id + key}
                      rows={
                        key === "code" || key === "parent" || key === "bloom"
                          ? 1
                          : 3
                      }
                      value={item.answers[key]?.text ?? ""}
                      onChange={(e) =>
                        controller.edit({
                          ...data,
                          items: data.items.map((i) =>
                            i.id === item.id
                              ? {
                                  ...i,
                                  answers: {
                                    ...i.answers,
                                    [key]: {
                                      text: e.target.value,
                                      status: "provided",
                                    },
                                  },
                                }
                              : i,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
                <button
                  onClick={() =>
                    controller.edit(
                      {
                        ...data,
                        items: data.items.filter((i) => i.id !== item.id),
                      },
                      true,
                    )
                  }
                >
                  Remove entry
                </button>
              </section>
            ))}
            <button
              onClick={() =>
                controller.edit(
                  {
                    ...data,
                    items: [
                      ...data.items,
                      { id: crypto.randomUUID(), answers: {} },
                    ],
                  },
                  true,
                )
              }
            >
              Add {section === "design-objectives" ? "objective" : "entry"}
            </button>
          </>
        )}
      </fieldset>
      {section === "analysis-brief" && hasDraft && (
        <section className="workflowaccept">
          <h2>Choose the foundation for Design</h2>
          <label className="checklabel">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I have reviewed this Analysis brief, including its assumptions and
            open questions.
          </label>
          <button
            className="primary"
            disabled={busy || blocked || !reviewed}
            onClick={() =>
              void act(async () => {
                await saved();
                await api(base + "/workflow/accept", "POST", {
                  revision: state.revision,
                  reviewed: true,
                });
                await refresh();
                await navigate("design-solution");
              })
            }
          >
            {accepted ? "Continue to Design" : "Accept this version for Design"}
          </button>
        </section>
      )}
      {section === "design-solution" && hasDraft && (
        <section className="workflowaccept">
          <h2>Build the Design skeleton</h2>
          <p>
            Objectives → assessments → content mapping → sequence → detailed
            design plan.
          </p>
          {instructional && !learningConfirmed && (
            <p className="note">
              Identify and confirm learning measures before generating
              instructional Design.
            </p>
          )}
          <button
            className="primary"
            disabled={
              busy ||
              blocked ||
              !accepted ||
              (instructional && !learningConfirmed) ||
              ["", "investigate"].includes(data.answers.route?.text ?? "")
            }
            onClick={() =>
              void act(async () => {
                await generate("design");
                await navigate("design-objectives");
              })
            }
          >
            {designFailed
              ? "Try the Design skeleton again"
              : "Generate Design skeleton"}
          </button>
          {designFailed && (
            <p className="hint">
              The last Design skeleton attempt did not finish. Nothing was
              changed. Trying again uses the shared AI budget.
            </p>
          )}
        </section>
      )}
      <div className="formfooter">
        <button
          onClick={() =>
            void act(async () => {
              await saved();
            })
          }
        >
          Save now
        </button>
        {section !== "analysis-brief" && status === "draft" && (
          <button disabled={busy || blocked} onClick={() => void act(review)}>
            Mark as reviewed
          </button>
        )}
        <button
          onClick={() =>
            void act(async () => {
              setHistory(
                history
                  ? null
                  : (await api(base + `/${section}/history`)).versions,
              );
            })
          }
        >
          Version history
        </button>
        {workflowSections.indexOf(section) < workflowSections.length - 1 && (
          <button
            onClick={() =>
              void navigate(
                workflowSections[workflowSections.indexOf(section) + 1],
              )
            }
          >
            Continue →
          </button>
        )}
      </div>
      {history && (
        <section className="history">
          <h2>Latest 10 versions</h2>
          {history.map((v) => (
            <details key={v.id}>
              <summary>
                Version {v.revision} · {new Date(v.created_at).toLocaleString()}
              </summary>
              <pre>{JSON.stringify(v.data, null, 2)}</pre>
            </details>
          ))}
        </section>
      )}
      <p className="hint">
        AI text is a draft. Save, review, and acceptance are separate steps.
        Existing work is preserved when earlier decisions change.
      </p>
    </ProjectShell>
  );
}
