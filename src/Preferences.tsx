import React from "react";
import {
  ProjectShell,
  RecordNotices,
  saveText,
  useRecord,
  type Snapshot,
} from "./ProjectShell";
import {
  breakIntervals,
  breakSettings,
  preferenceDefaults,
  preferenceQuestions,
} from "./preferences-model";

const reflection = [
  ["reflect_right", "What have AI drafts done well on this project?"],
  ["reflect_fix", "What took you the most time to correct?"],
  ["reflect_change", "What would you like AI to do differently?"],
] as const;

export function PreferencesPage({
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
  const { controller, state, data, ready, blocked } = useRecord(
    id,
    userId,
    "preferences",
    snapshot,
    onSnapshot,
  );
  const set = (key: string, text: string, immediate = true) =>
    controller.edit(
      {
        ...data,
        answers: { ...data.answers, [key]: { text, status: "provided" } },
      },
      immediate,
    );
  const breaks = breakSettings(data);
  return (
    <ProjectShell
      id={id}
      snapshot={snapshot}
      page="preferences"
      status={saveText(ready, state)}
      onNavigate={onNavigate}
    >
      <p className="eyebrow">Project-wide</p>
      <h1>AI preferences</h1>
      <p className="sectionintro">
        Adjust how AI helps on this project. Changes apply to Design and
        Development drafts you request from now on; existing drafts stay as they
        are until you ask for a revision.
      </p>
      <RecordNotices controller={controller} />
      <fieldset className="workflowfields" disabled={blocked}>
        {preferenceQuestions.map((q) => (
          <div className="question" key={q.key}>
            <label htmlFor={"pref-" + q.key}>{q.label}</label>
            <p className="hint" id={"pref-hint-" + q.key}>
              {q.hint}
            </p>
            <select
              id={"pref-" + q.key}
              aria-describedby={"pref-hint-" + q.key}
              value={data.answers[q.key]?.text || preferenceDefaults[q.key]}
              onChange={(e) => set(q.key, e.target.value)}
            >
              {q.options.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        ))}
        <p className="note">
          At every setting, required answers, your source rules, reviewed
          decisions and your approval stay in place. AI never accepts or
          publishes work for you.
        </p>
        <details className="revise">
          <summary>Adjust AI assistance: an optional reflection</summary>
          <p className="hint">
            Skip this whenever you like. Your answers stay here for you and are
            not sent to AI. If something keeps needing correction, try changing
            a preference above.
          </p>
          {reflection.map(([key, label]) => (
            <div className="question" key={key}>
              <label htmlFor={"pref-" + key}>{label}</label>
              <textarea
                id={"pref-" + key}
                rows={3}
                value={data.answers[key]?.text ?? ""}
                onChange={(e) => set(key, e.target.value, false)}
              />
            </div>
          ))}
        </details>
        <h2>Breaks</h2>
        <label className="checklabel">
          <input
            type="checkbox"
            checked={breaks.on}
            onChange={(e) => set("breaks", e.target.checked ? "on" : "off")}
          />
          Remind me to take a break while I work on this project
        </label>
        <div className="question">
          <label htmlFor="pref-break-minutes">Remind me after</label>
          <select
            id="pref-break-minutes"
            disabled={!breaks.on}
            value={String(breaks.minutes)}
            onChange={(e) => set("break_minutes", e.target.value)}
          >
            {breakIntervals.map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </div>
        <p className="hint">
          Reminders are off unless you turn them on. You can dismiss any
          reminder. Your work saves as you go, so you can pause at any time.
        </p>
      </fieldset>
    </ProjectShell>
  );
}
