import React, { useEffect, useState } from "react";
import { api } from "./http";
import type { RecordData } from "./model";
import {
  ProjectShell,
  RecordNotices,
  saveText,
  useRecord,
  type Snapshot,
} from "./ProjectShell";
import {
  developmentFields,
  developmentItemFields,
  outlineFields,
  proposalData,
  workflowLabels,
  type AIOutput,
} from "./workflow-model";
import { basisFor, staleReasons, withBasis } from "./dependencies";
import {
  designReadiness,
  hasContent,
  itemStatus,
  reviewItem,
  sampleOf,
  treatmentAccepted,
  treatmentPrint,
  type ItemStatus,
} from "./development-model";
import { requestJob } from "./ai-requests";

type Item = RecordData["items"][number];
type Job = Snapshot["jobs"][number];
const active = (j?: Job) =>
  !!j && ["queued", "running", "cost_pending"].includes(j.state);
const itemLabels: Record<ItemStatus | "drafting", string> = {
  outline: "Outline only",
  draft: "Draft",
  reviewed: "Reviewed",
  drafting: "Drafting…",
};
const itemIcons: Record<ItemStatus | "drafting", string> = {
  outline: "○",
  draft: "✎",
  reviewed: "✓",
  drafting: "…",
};
const failureNote =
  "AI could not finish this. Nothing was changed, and your saved work is safe.";
const dismissedKey = (id: string) => `ai-dismissed:${id}`;
function wasDismissed(id: string) {
  try {
    return !!localStorage.getItem(dismissedKey(id));
  } catch {
    return false;
  }
}
const firstItem = (output: AIOutput) => output.sections[0].items;

export function DevelopmentPage({
  id,
  userId,
  snapshot,
  onSnapshot,
  onNavigate,
}: {
  id: string;
  userId: string;
  snapshot: Snapshot;
  onSnapshot: (s: Snapshot) => void;
  onNavigate: (target: string) => void;
}) {
  const { controller, state, data, ready, blocked, refresh, saved } = useRecord(
    id,
    userId,
    "development",
    snapshot,
    onSnapshot,
  );
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(""),
    [note, setNote] = useState(""),
    [accept, setAccept] = useState(false),
    [results, setResults] = useState<Record<string, any>>({}),
    [, setDismissed] = useState(0),
    [history, setHistory] = useState<any[] | null>(null);
  const base = `/projects/${id}`;
  const devJobs = snapshot.jobs.filter((j) => j.task.startsWith("development"));
  const sampleJob = devJobs.find((j) => j.task === "development-sample");
  const jobFor = (item: string) =>
    devJobs.find((j) => j.task === "development-section" && j.target === item);
  const running = devJobs.some(active);
  // While AI works, check more often; nudge the queue if work waits with nothing running.
  useEffect(() => {
    if (!running) return;
    let lastWake = 0;
    const t = setInterval(() => {
      void refresh()
        .then((r) => {
          const jobs = r.jobs.filter((j) => j.task.startsWith("development"));
          if (
            jobs.some((j) => j.state === "queued") &&
            !jobs.some((j) => j.state === "running") &&
            Date.now() - lastWake > 20000
          ) {
            lastWake = Date.now();
            void api(base + "/workflow/wake", "POST", {}).catch(() => {});
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(t);
  }, [running]);
  // Completed results are read on demand and kept for this visit.
  async function result(jobId: string) {
    if (results[jobId]) return results[jobId];
    const r = await api(`${base}/ai-jobs/${jobId}`);
    setResults((m) => ({ ...m, [jobId]: r.job }));
    return r.job;
  }
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
  async function generate(
    task: "development-sample" | "development-section",
    target?: string,
    request = "",
  ) {
    await saved();
    const current = await refresh();
    await requestJob({
      userId,
      projectId: id,
      task,
      current,
      previous:
        task === "development-sample"
          ? current.jobs.find((j) => j.task === task)
          : current.jobs.find((j) => j.task === task && j.target === target),
      note: request,
      target,
    });
    await refresh();
  }
  function edit(next: RecordData, immediate = false) {
    controller.edit(next, immediate);
  }
  function editItem(itemId: string, change: (i: Item) => Item) {
    edit(
      {
        ...data,
        items: data.items.map((i) => (i.id === itemId ? change(i) : i)),
      },
      true,
    );
  }
  async function openSample() {
    if (!sampleJob) return;
    await saved();
    const current = await refresh();
    const job = await result(sampleJob.id);
    const draft = proposalData(job.result.sections[0]);
    const sample = draft.items.find(hasContent) ?? draft.items[0];
    const [next] = withBasis(
      [{ key: "development" as const, data: draft }],
      current,
      job.input_manifest ?? {},
    );
    next.data.answers._sample = { text: sample.id, status: "provided" };
    next.data.answers._job = { text: sampleJob.id, status: "provided" };
    edit(next.data, true);
    await controller.flush();
    setSelected(sample.id);
  }
  // Finished sections fill outline-only entries; the designer's outline fields are kept.
  async function addFinished(jobs: Job[]) {
    await saved();
    let next = controller.state.data;
    for (const j of jobs) {
      const job = await result(j.id);
      const [row] = firstItem(job.result);
      next = {
        ...next,
        items: next.items.map((i) =>
          i.id !== j.target || hasContent(i)
            ? i
            : {
                ...i,
                answers: {
                  ...Object.fromEntries(
                    row.fields
                      .filter((f) => !outlineFields.includes(f.key))
                      .map((f) => [
                        f.key,
                        { text: f.text, status: "proposed" as const },
                      ]),
                  ),
                  ...Object.fromEntries(
                    Object.entries(i.answers).filter(([k]) =>
                      outlineFields.includes(k),
                    ),
                  ),
                  _job: { text: j.id, status: "provided" as const },
                },
              },
        ),
      };
    }
    edit(next, true);
    await controller.flush();
  }
  async function useProposal(item: Item, job: Job) {
    await saved();
    const full = await result(job.id);
    const [row] = firstItem(full.result);
    editItem(item.id, (i) => ({
      ...i,
      answers: {
        ...Object.fromEntries(
          row.fields.map((f) => [
            f.key,
            { text: f.text, status: "proposed" as const },
          ]),
        ),
        _job: { text: job.id, status: "provided" },
      },
    }));
    await controller.flush();
  }

  const live = {
    ...snapshot,
    records: {
      ...snapshot.records,
      development: { ...snapshot.records.development, data },
    },
  };
  const readiness = designReadiness(snapshot);
  const reasons = staleReasons("development", data, live);
  const empty =
    !data.items.length &&
    !Object.keys(data.answers).some((k) => !k.startsWith("_"));
  const sample = sampleOf(data);
  const accepted = treatmentAccepted(data);
  const item =
    data.items.find((i) => i.id === selected) ?? sample ?? data.items[0];
  const finished = data.items
    .map((i) => ({ i, j: jobFor(i.id) }))
    .filter(
      ({ i, j }) =>
        j?.state === "completed" &&
        !hasContent(i) &&
        i.answers._job?.text !== j.id,
    )
    .map(({ j }) => j!);
  const waiting = data.items.filter((i) => !hasContent(i) && !jobFor(i.id));
  const itemJob = item ? jobFor(item.id) : undefined;
  const proposal =
    item &&
    itemJob?.state === "completed" &&
    hasContent(item) &&
    item.answers._job?.text !== itemJob.id &&
    !wasDismissed(itemJob.id)
      ? itemJob
      : undefined;
  const proposed = proposal && results[proposal.id];
  useEffect(() => {
    if (proposal && !results[proposal.id])
      void result(proposal.id).catch(() => {});
  }, [proposal?.id]);
  const linked = (text = "") =>
    text
      .split(/[,;\s]+/)
      .map((c) => c.trim())
      .filter(Boolean);
  const designItems = (section: "design-objectives" | "design-assessments") =>
    snapshot.records[section].data.items;
  const status = (i: Item): ItemStatus | "drafting" =>
    active(jobFor(i.id)) ? "drafting" : itemStatus(i);

  return (
    <ProjectShell
      id={id}
      snapshot={snapshot}
      page="development"
      status={saveText(ready, state)}
      onNavigate={onNavigate}
    >
      <p className="eyebrow">Partial Development</p>
      <h1>Development</h1>
      <p className="sectionintro">
        Written storyboard specifications and performance-aid content, built
        from your reviewed Design. Start with a sample: the full outline with
        one section written out. Review its treatment, then draft the rest.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <RecordNotices controller={controller} />
      {reasons.length > 0 && (
        <section className="needsupdate" aria-labelledby="dev-needsupdate">
          <h2 id="dev-needsupdate">
            <span aria-hidden="true">!</span> Needs update
          </h2>
          <p>This draft was built from Design work that has since changed:</p>
          <ul>
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="hint">
            Review the affected sections and edit them, or request changes.
            Nothing is rewritten automatically.
          </p>
          <button
            disabled={busy || blocked}
            onClick={() =>
              void act(async () => {
                await saved();
                const current = await refresh();
                edit(
                  {
                    ...controller.state.data,
                    answers: {
                      ...controller.state.data.answers,
                      _basis: {
                        text: JSON.stringify(basisFor("development", current)),
                        status: "provided",
                      },
                    },
                  },
                  true,
                );
                await controller.flush();
              })
            }
          >
            Mark as reviewed and up to date
          </button>
        </section>
      )}
      {empty ? (
        <section className="emptyworkflow">
          <h2>Generate a Development sample</h2>
          {!readiness.ready ? (
            <>
              <p>
                Development starts from a reviewed Design. Review these pages
                and mark them reviewed first:
              </p>
              <ul>
                {readiness.pending.map((s) => (
                  <li key={s}>
                    <a
                      href={`#/projects/${id}/${s}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(s);
                      }}
                    >
                      {workflowLabels[s]}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>
              AI drafts the full outline for your chosen deliverables and writes
              out one representative section. It uses the shared AI budget.
            </p>
          )}
          {sampleJob && (
            <p role="status">
              {sampleJob.state === "queued"
                ? "Waiting for the shared AI queue…"
                : sampleJob.state === "running"
                  ? "AI is drafting the sample…"
                  : sampleJob.state === "completed"
                    ? "The sample is ready."
                    : sampleJob.state === "cost_pending"
                      ? "AI is paused while a charge is checked. Your saved work is safe."
                      : failureNote}
            </p>
          )}
          {sampleJob?.state === "completed" ? (
            <button
              className="primary"
              disabled={busy || blocked}
              onClick={() => void act(openSample)}
            >
              Open the sample
            </button>
          ) : (
            <button
              className="primary"
              disabled={
                busy || blocked || !readiness.ready || active(sampleJob)
              }
              onClick={() => void act(() => generate("development-sample"))}
            >
              {sampleJob && ["failed", "cancelled"].includes(sampleJob.state)
                ? "Try again"
                : "Generate Development sample"}
            </button>
          )}
        </section>
      ) : (
        <>
          <details className="revise" open={!accepted}>
            <summary>Treatment and notes for the whole deliverable</summary>
            <fieldset className="workflowfields" disabled={blocked || busy}>
              {developmentFields.map(([key, label]) => (
                <div className="question" key={key}>
                  <label htmlFor={"dev-" + key}>{label}</label>
                  <textarea
                    id={"dev-" + key}
                    rows={4}
                    value={data.answers[key]?.text ?? ""}
                    onChange={(e) =>
                      edit({
                        ...data,
                        answers: {
                          ...data.answers,
                          [key]: { text: e.target.value, status: "provided" },
                        },
                      })
                    }
                  />
                </div>
              ))}
            </fieldset>
          </details>
          <section className="workflowaccept" aria-labelledby="treatment-title">
            <h2 id="treatment-title">
              {accepted ? (
                <>
                  <span aria-hidden="true">✓</span> Treatment accepted
                </>
              ) : (
                "Accept the sample's treatment"
              )}
            </h2>
            {accepted ? (
              <p className="hint">
                The other sections follow this treatment. Editing the treatment
                or the sample section asks you to accept it again. Accepting a
                treatment does not confirm facts or sources.
              </p>
            ) : (
              <>
                <p>
                  Review the sample section
                  {sample
                    ? ` (${sample.answers.code?.text ?? "sample"})`
                    : ""}{" "}
                  and the treatment notes. Edit them until they show the style
                  and depth you want for every section.
                </p>
                <label className="checklabel">
                  <input
                    type="checkbox"
                    checked={accept}
                    onChange={(e) => setAccept(e.target.checked)}
                  />
                  I accept this presentation and treatment as the model for the
                  other sections. This does not confirm facts or sources.
                </label>
                <button
                  className="primary"
                  disabled={busy || blocked || !accept || !sample}
                  onClick={() =>
                    void act(async () => {
                      edit(
                        {
                          ...data,
                          answers: {
                            ...data.answers,
                            _treatment_accepted: {
                              text: treatmentPrint(data),
                              status: "provided",
                            },
                          },
                        },
                        true,
                      );
                      await controller.flush();
                      setAccept(false);
                    })
                  }
                >
                  Accept treatment
                </button>
              </>
            )}
            {accepted && (
              <div className="fulldraft">
                <p role="status">
                  {devJobs.filter(
                    (j) => j.task === "development-section" && active(j),
                  ).length
                    ? `AI is drafting ${devJobs.filter((j) => j.task === "development-section" && active(j)).length} section(s)…`
                    : finished.length
                      ? `${finished.length} finished section(s) ready to add.`
                      : waiting.length
                        ? `${waiting.length} section(s) are outline only.`
                        : "Every section has written content."}
                </p>
                <div className="buttonrow">
                  <button
                    className="primary"
                    disabled={busy || blocked || !waiting.length}
                    onClick={() =>
                      void act(async () => {
                        for (const i of waiting)
                          await generate("development-section", i.id);
                      })
                    }
                  >
                    Generate full draft
                  </button>
                  {finished.length > 0 && (
                    <button
                      disabled={busy || blocked}
                      onClick={() => void act(() => addFinished(finished))}
                    >
                      Add finished sections to the draft
                    </button>
                  )}
                </div>
                <p className="hint">
                  Each section is a separate request to the shared AI budget.
                  Finished sections are added only when you choose; sections you
                  have written are never replaced.
                </p>
              </div>
            )}
          </section>
          <div className="devworkspace">
            <nav className="outline" aria-label="Deliverable outline">
              <h2>Outline</h2>
              <ol>
                {data.items.map((i) => {
                  const st = status(i);
                  return (
                    <li key={i.id}>
                      <button
                        className="outlineitem"
                        aria-current={i.id === item?.id ? "true" : undefined}
                        onClick={() => {
                          setSelected(i.id);
                          setNote("");
                        }}
                      >
                        <span className="outlinecode">
                          {i.answers.code?.text || "New"}
                        </span>{" "}
                        {i.answers.title?.text || "Untitled section"}
                        {i.id === sample?.id && (
                          <span className="hint"> · Sample</span>
                        )}
                        <span className={"itemstatus " + st}>
                          <span aria-hidden="true">{itemIcons[st]}</span>{" "}
                          {itemLabels[st]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <button
                disabled={busy || blocked}
                onClick={() => {
                  const added = { id: crypto.randomUUID(), answers: {} };
                  edit({ ...data, items: [...data.items, added] }, true);
                  setSelected(added.id);
                }}
              >
                Add section
              </button>
            </nav>
            {item && (
              <section className="devsection" aria-labelledby="section-title">
                <h2 id="section-title">
                  {item.answers.code?.text || "New section"}:{" "}
                  {item.answers.title?.text || "Untitled"}
                </h2>
                <p className={"itemstatus " + status(item)}>
                  <span aria-hidden="true">{itemIcons[status(item)]}</span>{" "}
                  {itemLabels[status(item)]}
                </p>
                {itemJob && ["failed", "cancelled"].includes(itemJob.state) && (
                  <div className="ai-result">
                    <p role="status">{failureNote}</p>
                    <button
                      disabled={busy || blocked}
                      onClick={() =>
                        void act(() =>
                          generate("development-section", item.id, note),
                        )
                      }
                    >
                      Try again
                    </button>
                  </div>
                )}
                {proposal && (
                  <div className="ai-result">
                    <p role="status">
                      An AI proposal for this section is ready. Your section has
                      not changed.
                    </p>
                    {proposed && (
                      <details className="proposal" open>
                        <summary>Review the proposal</summary>
                        {firstItem(proposed.result)[0]
                          .fields.filter((f: { text: string }) => f.text.trim())
                          .map((f: { key: string; text: string }) => (
                            <div key={f.key}>
                              <h3>
                                {developmentItemFields.find(
                                  ([k]) => k === f.key,
                                )?.[1] ?? f.key}
                              </h3>
                              <p className="readable">{f.text}</p>
                            </div>
                          ))}
                      </details>
                    )}
                    <div className="buttonrow">
                      <button
                        className="primary"
                        disabled={busy || blocked || !proposed}
                        onClick={() =>
                          void act(() => useProposal(item, proposal))
                        }
                      >
                        Use this proposal
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => {
                          try {
                            localStorage.setItem(
                              dismissedKey(proposal.id),
                              "1",
                            );
                          } catch {}
                          setDismissed((n) => n + 1);
                        }}
                      >
                        Keep my current section
                      </button>
                    </div>
                    <p className="hint">
                      Using it replaces this section. The earlier version stays
                      in version history.
                    </p>
                  </div>
                )}
                <fieldset className="workflowfields" disabled={blocked || busy}>
                  {developmentItemFields.map(([key, label]) => (
                    <div className="question" key={key}>
                      <label htmlFor={item.id + key}>{label}</label>
                      <textarea
                        id={item.id + key}
                        rows={
                          [
                            "code",
                            "title",
                            "kind",
                            "objectives",
                            "assessments",
                          ].includes(key)
                            ? 1
                            : ["content", "interaction", "media"].includes(key)
                              ? 6
                              : 3
                        }
                        value={item.answers[key]?.text ?? ""}
                        onChange={(e) =>
                          edit({
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
                </fieldset>
                <details className="revise">
                  <summary>Linked objectives and assessments</summary>
                  {[
                    ["design-objectives", "objectives", "statement"],
                    ["design-assessments", "assessments", "prompt"],
                  ].map(([section, key, field]) => {
                    const codes = linked(item.answers[key]?.text);
                    const found = designItems(
                      section as "design-objectives" | "design-assessments",
                    ).filter((d) => codes.includes(d.answers.code?.text ?? ""));
                    return (
                      <div key={key}>
                        <h3>
                          {workflowLabels[section as "design-objectives"]}
                        </h3>
                        {found.length ? (
                          found.map((d) => (
                            <p key={d.id}>
                              <strong>{d.answers.code?.text}</strong>{" "}
                              {d.answers[field]?.text}
                            </p>
                          ))
                        ) : (
                          <p className="hint">None linked.</p>
                        )}
                      </div>
                    );
                  })}
                </details>
                {hasContent(item) ? (
                  <details className="revise">
                    <summary>Request changes</summary>
                    <div className="question">
                      <label htmlFor="dev-request">
                        What should change? (style, detail, structure or
                        build-note depth)
                      </label>
                      <textarea
                        id="dev-request"
                        rows={3}
                        maxLength={2000}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                    <button
                      disabled={
                        busy ||
                        blocked ||
                        active(itemJob) ||
                        !note.trim() ||
                        (item.id !== sample?.id && !accepted)
                      }
                      onClick={() =>
                        void act(() =>
                          generate("development-section", item.id, note),
                        )
                      }
                    >
                      Request AI changes
                    </button>
                    <p className="hint">
                      The result is a proposal; this section stays as it is
                      until you choose to use it. Uses the shared AI budget.
                    </p>
                  </details>
                ) : (
                  accepted &&
                  !active(itemJob) && (
                    <button
                      disabled={busy || blocked}
                      onClick={() =>
                        void act(() => generate("development-section", item.id))
                      }
                    >
                      Generate this section
                    </button>
                  )
                )}
                <div className="formfooter">
                  {status(item) === "draft" && (
                    <button
                      disabled={busy || blocked}
                      onClick={() => editItem(item.id, reviewItem)}
                    >
                      Mark section reviewed
                    </button>
                  )}
                  {item.id !== sample?.id && (
                    <button
                      disabled={busy || blocked}
                      onClick={() =>
                        edit(
                          {
                            ...data,
                            items: data.items.filter((i) => i.id !== item.id),
                          },
                          true,
                        )
                      }
                    >
                      Remove section
                    </button>
                  )}
                </div>
              </section>
            )}
          </div>
        </>
      )}
      <div className="formfooter">
        <button
          onClick={() =>
            void act(async () => {
              setHistory(
                history
                  ? null
                  : (await api(`${base}/development/history`)).versions,
              );
            })
          }
        >
          Version history
        </button>
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
        AI text is a draft. Removed sections and earlier versions stay in
        version history. This is a written specification, not a built course.
      </p>
    </ProjectShell>
  );
}
