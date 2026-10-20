import React, { useEffect, useRef, useState } from "react";
import { api } from "./http";
import { breakSettings, nextStep } from "./preferences-model";

const startKey = (project: string) => `break-start:${project}`;
function started(project: string) {
  try {
    const value = Number(sessionStorage.getItem(startKey(project)));
    if (value) return value;
    sessionStorage.setItem(startKey(project), String(Date.now()));
  } catch {}
  return Date.now();
}
function restart(project: string) {
  try {
    sessionStorage.setItem(startKey(project), String(Date.now()));
  } catch {}
}

// Optional, dismissible break reminders for one project. Off unless the designer turns
// them on in AI preferences. A pause never changes or regenerates work.
export function BreakReminder({ project }: { project: string }) {
  const [settings, setSettings] = useState({ on: false, minutes: 45 }),
    [due, setDue] = useState(false),
    [paused, setPaused] = useState<null | { text: string; page: string }>(null);
  const resume = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let active = true;
    const load = () =>
      api(`/projects/${project}/workflow`)
        .then((r) => {
          if (active) setSettings(breakSettings(r.records.preferences?.data));
        })
        .catch(() => {});
    void load();
    const t = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [project]);
  useEffect(() => {
    if (!settings.on) return setDue(false);
    const check = () =>
      setDue(Date.now() - started(project) >= settings.minutes * 60000);
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, [settings, project]);
  useEffect(() => {
    if (paused) resume.current?.focus();
  }, [paused]);
  if (paused)
    return (
      <div
        className="pauseview"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pause-title"
        onKeyDown={(e) => {
          // The pause holds focus until the designer resumes.
          if (e.key === "Tab") {
            e.preventDefault();
            resume.current?.focus();
          }
        }}
      >
        <div className="pausecard">
          <h2 id="pause-title">Paused</h2>
          <p>Your work is saved. Take as long as you need.</p>
          <p className="hint">If you would like something to do:</p>
          <ul>
            <li>Look at something about six metres away for twenty seconds.</li>
            <li>Roll your shoulders slowly, five times.</li>
            <li>Take four slow breaths.</li>
          </ul>
          <p>
            <strong>When you return:</strong> {paused.text}
          </p>
          <button
            ref={resume}
            className="primary"
            onClick={() => {
              restart(project);
              setPaused(null);
              setDue(false);
            }}
          >
            Resume
          </button>
        </div>
      </div>
    );
  if (!due) return null;
  return (
    <section className="breakreminder" aria-labelledby="break-title">
      <div role="status">
        <h2 id="break-title">Time for a break?</h2>
        <p>
          You have been working for about {settings.minutes} minutes. Your work
          is saved.
        </p>
      </div>
      <div className="buttonrow">
        <button
          onClick={() =>
            void api(`/projects/${project}/workflow`)
              .then((r) => setPaused(nextStep(r)))
              .catch(() =>
                setPaused({ text: "Pick up where you left off.", page: "" }),
              )
          }
        >
          Take a quiet pause
        </button>
        <button
          onClick={() => {
            restart(project);
            setDue(false);
          }}
        >
          Remind me later
        </button>
        <a href={`#/projects/${project}/preferences`}>Change reminders</a>
      </div>
    </section>
  );
}
