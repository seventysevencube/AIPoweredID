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
} from "./workflow-model";
import {
  markReviewed,
  sectionStatus,
  staleReasons,
  statusLabels,
  type SectionStatus,
} from "./dependencies";
type Snapshot = {
  records: Record<string, SavedRecord>;
  accepted_revision?: number;
  jobs: { id: string; state: string; task: AITask }[];
};
const statusIcons: Record<SectionStatus, string> = {
  empty: "○",
  draft: "✎",
  reviewed: "✓",
  "needs-update": "!",
};
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
  section: WorkflowSection;
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
  return (
    <WorkflowEditor
      key={id + section}
      {...{ id, userId, section, snapshot }}
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
  const [, redraw] = useState(0),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reviewed, setReviewed] = useState(false),
    [job, setJob] = useState<any>(null),
    [history, setHistory] = useState<any[] | null>(null),
    [budget, setBudget] = useState<any>(null);
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
  const state = controller.state,
    data = state.data;
  const base = `/projects/${id}`;
  async function refresh() {
    const r = await api(base + "/workflow");
    onSnapshot(r);
    controller.observe(r.records[section]);
    return r as Snapshot;
  }
  useEffect(() => {
    let active = true;
    void controller.start().then(() => {
      if (active) setReady(true);
    });
    void api("/ai/budget")
      .then(setBudget)
      .catch(() => {});
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
  const relevant =
    section === "analysis-brief"
      ? "analysis"
      : section === "design-solution"
        ? "solution"
        : "design";
  const coreReady = analysisAIReadiness(
    Object.fromEntries(sections.map((s) => [s, snapshot.records[s]])),
  ).ready;
  const latest = snapshot.jobs.find((j) => j.task === relevant);
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
  async function saved() {
    await controller.flush();
    if (controller.dirty || controller.state.status !== "saved")
      throw Error(
        "Wait for all edits to save and resolve any draft conflicts before continuing.",
      );
  }
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
  async function generate(task: AITask) {
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
    pending ??= await submit(retrying ? `fresh:${previous!.id}` : "initial");
    await refresh();
    if (task === relevant)
      setJob({ id: pending.job_id, state: pending.state, task });
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
  const blocked =
    !ready || ["conflict", "recovery", "signin"].includes(state.status);
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
    <>
      <div className="projectbar">
        <a href="#/projects">← Projects</a>
        <strong>{title}</strong>
        <span className="stage">
          {section === "analysis-brief" ? "Analysis" : "Design"}
        </span>
        <p className="savestatus" role="status">
          {!ready
            ? "Opening…"
            : state.status === "saved"
              ? "All changes saved"
              : state.status === "waiting"
                ? "Saved on this device — waiting to sync"
                : state.status === "conflict"
                  ? "Changes need review"
                  : state.status === "recovery"
                    ? "Recoverable draft found"
                    : "Saving…"}
        </p>
      </div>
      <div className="workspace">
        <aside className="sidebar">
          <p className="eyebrow">Your learning project</p>
          <nav aria-label="Project stages">
            <a
              href={`#/projects/${id}/context`}
              onClick={(e) => {
                e.preventDefault();
                void navigate("context");
              }}
            >
              ← Analysis inputs
            </a>
            {workflowSections.map((s, i) => {
              const st = statusOf(s);
              return (
                <div className="navitem" key={s}>
                  <a
                    href={`#/projects/${id}/${s}`}
                    aria-current={s === section ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      void navigate(s);
                    }}
                  >
                    <span className="navnumber">{i + 1}</span>
                    {workflowLabels[s]}
                  </a>
                  {(st === "needs-update" || st === "reviewed") && (
                    <span className={"navstatus " + st}>
                      <span aria-hidden="true">{statusIcons[st]}</span>{" "}
                      {statusLabels[st]}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="nextstage">
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
          {state.localFailure && (
            <p className="note">
              Browser recovery is unavailable. Keep this page open until changes
              are saved.
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
              <p>
                Your draft is preserved. Review both copies before continuing.
              </p>
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
                onClick={() =>
                  void controller.resolve(state.server!, state.data)
                }
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
          {reasons.length > 0 && (
            <section className="needsupdate" aria-labelledby="needsupdate">
              <h2 id="needsupdate">
                <span aria-hidden="true">{statusIcons["needs-update"]}</span>{" "}
                Needs update
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
              <button
                disabled={busy || blocked}
                onClick={() => void act(review)}
              >
                Mark as reviewed and up to date
              </button>
            </section>
          )}
          {snapshot.accepted_revision && !accepted && (
            <p className="note">
              The Analysis brief changed after acceptance. Existing Design work
              is preserved. Review the updated brief before generating more
              Design.
            </p>
          )}
          {job && (
            <section className="ai-result">
              <p role="status">
                {job.state === "queued"
                  ? "Waiting for the shared AI queue…"
                  : job.state === "running"
                    ? "AI is drafting and checking your result…"
                    : job.state === "completed"
                      ? opened
                        ? "This draft started from an AI proposal. Review and edit it before relying on it."
                        : "AI draft is ready for your review."
                      : job.state === "cost_pending"
                        ? "AI is paused while a charge is checked. Your saved work is safe."
                        : "AI could not finish this draft. Nothing was changed, and your saved work is safe."}
              </p>
              {job.state === "cost_pending" && (
                <p className="hint">
                  The pilot operator confirms the charge before AI continues.
                  You can keep editing in the meantime.
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
                    onClick={() => void act(() => generate(relevant))}
                  >
                    {busy ? "Preparing…" : "Try again"}
                  </button>
                </>
              )}
              {job.inputs_changed && !opened && (
                <p className="note">
                  Earlier inputs changed since this job started. Review them
                  before using the result.
                </p>
              )}
              {job.state === "completed" && hasDraft && !opened && (
                <details>
                  <summary>View retained AI result</summary>
                  {job.result?.sections?.map((s: any) => (
                    <section key={s.key}>
                      <h3>{workflowLabels[s.key as WorkflowSection]}</h3>
                      {s.fields.map((f: any) => (
                        <p key={f.key}>{f.text}</p>
                      ))}
                    </section>
                  ))}
                </details>
              )}
              {job.state === "completed" && !hasDraft && (
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
                          ["queued", "running", "cost_pending"].includes(
                            job.state,
                          ))
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
                            key === "code" ||
                            key === "parent" ||
                            key === "bloom"
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
                I have reviewed this Analysis brief, including its assumptions
                and open questions.
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
                {accepted
                  ? "Continue to Design"
                  : "Accept this version for Design"}
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
              <button
                disabled={busy || blocked}
                onClick={() => void act(review)}
              >
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
            {workflowSections.indexOf(section) <
              workflowSections.length - 1 && (
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
            <section>
              <h2>Latest 10 versions</h2>
              {history.map((v) => (
                <details key={v.id}>
                  <summary>
                    Version {v.revision} ·{" "}
                    {new Date(v.created_at).toLocaleString()}
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
        </main>
      </div>
    </>
  );
}
