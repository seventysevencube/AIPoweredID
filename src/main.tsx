import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { api } from "./http";
import {
  emptyData,
  analysisAIReadiness,
  sections,
  type Answer,
  type Project,
  type RecordData,
  type SavedRecord,
  type Section,
  type Version,
} from "./model";
import { SaveController } from "./save";
import { recovery } from "./recovery";
import { CausesField } from "./CausesField";
import { sectionGuidance } from "./guidance";
import {
  labels,
  questions,
  stakeholderQuestions,
  measureQuestions,
  collectionQuestions,
  type Question,
} from "./questions";
import { Workflow } from "./Workflow";
import { GuestReview } from "./Review";
import { workflowSections, projectSections } from "./workflow-model";
import type { Page } from "./ProjectShell";
import "./style.css";
type User = { id: string; email: string };
const date = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
const pages: string[] = [...workflowSections, ...projectSections, "sharing"];
function route() {
  return location.hash.slice(1) || "/projects";
}
function go(value: string) {
  location.hash = value;
}
function errorText(e: unknown) {
  return e instanceof Error
    ? e.message
    : "The service is unavailable. Please try again.";
}
function App() {
  const [user, setUser] = useState<User | null>(null),
    [mode, setMode] = useState(""),
    [openSignup, setOpenSignup] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [path, setPath] = useState(route());
  useEffect(() => {
    const fn = () => setPath(route());
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  async function initialize() {
    setError("");
    setLoading(true);
    try {
      const setup = await api("/setup");
      setMode(setup.mode);
      setOpenSignup(!!setup.open_signup);
      try {
        setUser((await api("/auth/session")).user);
      } catch (e) {
        if ((e as any).status !== 401) throw e;
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void initialize();
  }, []);
  async function signout() {
    try {
      await api("/auth/signout", "POST");
      setUser(null);
    } catch (e) {
      setError(errorText(e));
    }
  }
  const projectId = path.match(/^\/projects\/([a-f0-9-]+)(?:\/([^/]+))?$/);
  const review = path.match(/^\/review\/([A-Za-z0-9_-]{43})$/);
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
          document.getElementById("main")?.scrollIntoView();
        }}
      >
        Skip to main content
      </a>
      <header className="topbar">
        <a className="brand" href="#/projects">
          <span className="brandmark" aria-hidden="true">
            a
          </span>
          AIPoweredID
        </a>
        <span className="pilot">Pilot workspace</span>
        {user && (
          <div className="account">
            <span>{user.email}</span>
            <button className="textbutton" onClick={() => void signout()}>
              Sign out
            </button>
          </div>
        )}
      </header>
      {mode === "local" && (
        <div className="devbanner">
          Local development · fictional accounts · no real email or live
          Supabase connection
        </div>
      )}
      {loading ? (
        <main id="main" tabIndex={-1} className="center">
          <p role="status">Opening your workspace…</p>
        </main>
      ) : error ? (
        <main id="main" tabIndex={-1} className="center">
          <h1>Workspace unavailable</h1>
          <p role="alert">{error}</p>
          <p>
            Recoverable drafts remain in this browser. Reconnect before opening
            protected project content.
          </p>
          <button onClick={() => void initialize()}>Try again</button>
        </main>
      ) : review ? (
        <GuestReview token={review[1]} />
      ) : !user ? (
        <Auth mode={mode} openSignup={openSignup} onUser={setUser} />
      ) : projectId && pages.includes(projectId[2] as Page) ? (
        <Workflow
          key={user.id + projectId[1] + projectId[2]}
          id={projectId[1]}
          userId={user.id}
          section={projectId[2] as Page}
        />
      ) : projectId ? (
        <Workspace
          key={user.id + projectId[1]}
          user={user}
          id={projectId[1]}
          section={
            sections.includes(projectId[2] as Section)
              ? (projectId[2] as Section)
              : "context"
          }
          onExpired={() => setUser(null)}
        />
      ) : (
        <Projects user={user} onExpired={() => setUser(null)} />
      )}
    </>
  );
}
function Auth({
  mode,
  openSignup,
  onUser,
}: {
  mode: string;
  openSignup: boolean;
  onUser: (u: User) => void;
}) {
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [id, setId] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [wait, setWait] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!wait) return;
    const t = setTimeout(() => setWait((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  useEffect(() => {
    if (id) input.current?.focus();
  }, [id]);
  async function request() {
    setBusy(true);
    setError("");
    try {
      const r = await api("/auth/request-code", "POST", {
        email: email.trim(),
      });
      setId(r.challenge_id);
      setMessage(r.message);
      setCode("");
      setWait(60);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    setBusy(true);
    setError("");
    try {
      onUser(
        (
          await api("/auth/verify-code", "POST", {
            challenge_id: id,
            code: code.trim(),
          })
        ).user,
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" tabIndex={-1} className="login">
      <div className="loginintro">
        <p className="eyebrow">Data-Driven AI-Powered Instructional Design</p>
        <h1>
          Bringing the Human Back into the Loop of AI-Powered Instructional
          Design
        </h1>
        <p>
          Bring your expertise. Capture what matters. Design effective learning
          experiences.
        </p>
        <div className="introsteps">
          <span>01 · Analysis</span>
          <span>02 · Design</span>
          <span>03 · Development</span>
        </div>
        <p className="subtle">
          Your private workspace for Analysis and AI-assisted Design.
        </p>
      </div>
      <section className="signin">
        <p className="eyebrow">
          {openSignup ? "Pilot workspace" : "Invitation-only pilot"}
        </p>
        <h2>{id ? "Check your email" : "Welcome to your workspace"}</h2>
        <p>
          {id
            ? `Enter the six-digit code sent to ${email}.`
            : openSignup
              ? "Sign in or create your workspace. Enter your email to receive a one-time code. No password needed."
              : "Use your approved email to receive a one-time sign-in code."}
        </p>
        {mode === "local" && (
          <p className="note">
            {openSignup
              ? "For this local build, any email works."
              : "For this local build, use designer@example.test or peer@example.test."}{" "}
            Codes appear in the local inbox below.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void (id ? verify() : request());
          }}
        >
          {!id ? (
            <>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          ) : (
            <>
              <label htmlFor="code">Sign-in code</label>
              <input
                ref={input}
                id="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <p className="hint">
                Expires after 10 minutes. Five incorrect attempts lock the code.
              </p>
            </>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="hint">
              {message}
            </p>
          )}
          <button className="primary wide" disabled={busy}>
            {busy ? "Please wait…" : id ? "Sign in" : "Send code"}
          </button>
        </form>
        {id && (
          <div className="buttonrow">
            <button disabled={busy || wait > 0} onClick={() => void request()}>
              {wait ? `Resend in ${wait}s` : "Resend code"}
            </button>
            <button
              className="textbutton"
              onClick={() => {
                setId("");
                setError("");
                setMessage("");
              }}
            >
              Use another email
            </button>
          </div>
        )}
        {id && mode === "local" && (
          <button
            className="textbutton localcode"
            onClick={async () => {
              try {
                const r = await api("/local-inbox");
                const item = r[email.trim().toLowerCase()];
                setMessage(
                  item
                    ? `Local development code: ${item.code}`
                    : "No local code for this address.",
                );
              } catch (e) {
                setError(errorText(e));
              }
            }}
          >
            Show local development code
          </button>
        )}
        <p className="hint">Your projects are private to your account.</p>
      </section>
    </main>
  );
}
function Projects({ user, onExpired }: { user: User; onExpired: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [creating, setCreating] = useState(false),
    [storageNotice, setStorageNotice] = useState("");
  const [title, setTitle] = useState(""),
    [busy, setBusy] = useState(false);
  const pending = useRef<
    { project_id: string; operation_id: string; title: string } | undefined
  >(undefined);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setProjects((await api("/projects")).projects);
    } catch (e) {
      if ((e as any).status === 401) onExpired();
      else setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(`create:${user.id}`);
    } catch {
      setStorageNotice(
        "Browser recovery is unavailable. Keep this page open until project creation is confirmed.",
      );
    }
    if (stored) {
      try {
        pending.current = JSON.parse(stored);
        setCreating(true);
        setTitle(pending.current!.title);
      } catch {
        /* Ignore an invalid local request. */
      }
    }
  }, []);
  async function create() {
    setBusy(true);
    setError("");
    try {
      pending.current ??= {
        project_id: crypto.randomUUID(),
        operation_id: crypto.randomUUID(),
        title: title.trim(),
      };
      try {
        sessionStorage.setItem(
          `create:${user.id}`,
          JSON.stringify(pending.current),
        );
      } catch {
        setStorageNotice(
          "Project creation can continue. Browser recovery is unavailable, so keep this page open until confirmation.",
        );
      }
      const r = await api("/projects", "POST", pending.current);
      pending.current = undefined;
      try {
        sessionStorage.removeItem(`create:${user.id}`);
      } catch {
        /* Server creation was acknowledged. */
      }
      go(`/projects/${r.project.id}/context`);
    } catch (e) {
      if ((e as any).status === 401) onExpired();
      else setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" tabIndex={-1} className="projects">
      <div className="pageheading">
        <div>
          <p className="eyebrow">Your workspace</p>
          <h1>Projects</h1>
          <p>
            Pick up where you left off, or start with a new performance
            question.
          </p>
        </div>
        <button className="primary" onClick={() => setCreating(true)}>
          + New project
        </button>
      </div>
      {storageNotice && (
        <p className="note" role="status">
          {storageNotice}
        </p>
      )}
      {creating && (
        <section className="createpanel">
          <h2>Start a project</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <label htmlFor="title">
              What would you like to call this project? A working title is fine.
            </label>
            <input
              id="title"
              autoFocus
              maxLength={300}
              value={title}
              readOnly={!!pending.current}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="hint">
              A blank title becomes “Untitled project.” You can change it in
              Analysis.
            </p>
            <div className="buttonrow">
              <button className="primary" disabled={busy}>
                {busy
                  ? "Creating…"
                  : pending.current
                    ? "Retry creating project"
                    : "Create project"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setCreating(false)}
              >
                Close
              </button>
            </div>
          </form>
        </section>
      )}
      {error && (
        <div role="alert" className="error">
          {error}{" "}
          <button onClick={() => void load()}>Retry loading projects</button>
        </div>
      )}
      {loading ? (
        <p role="status">Loading projects…</p>
      ) : !error && !projects.length ? (
        <section className="empty">
          <span className="emptyicon" aria-hidden="true">
            ✦
          </span>
          <h2>Your first project starts here</h2>
          <p>
            Capture the task, the performance gap, and what you know about your
            audience.
            <br />
            You can save incomplete work and return later.
          </p>
          <button onClick={() => setCreating(true)}>
            Create your first project
          </button>
        </section>
      ) : (
        <div className="projectgrid">
          {projects.map((p) => (
            <article className="projectcard" key={p.id}>
              <span className="stage">{p.stage}</span>
              <h2>{p.title}</h2>
              <p className="hint">Last saved {date(p.saved_at)}</p>
              <div className="cardrecap">
                <p>
                  Continue with
                  <br />
                  <strong>
                    {p.stage === "Design"
                      ? "Performance solution"
                      : (labels[p.current_section] ?? labels.context)}
                  </strong>
                </p>
                <p>
                  {p.stage === "Design"
                    ? "Review and refine your Design draft"
                    : typeof p.outstanding === "number"
                      ? `${p.outstanding} core ${p.outstanding === 1 ? "item" : "items"} still needed for Design`
                      : "Review your outstanding Analysis information"}
                </p>
              </div>
              <a
                className="button primary"
                href={`#/projects/${p.id}/${p.stage === "Design" ? "design-solution" : p.current_section}`}
              >
                Continue project <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      )}
      <p className="workspacefoot">
        A saved draft is a starting point. Reviewing and accepting stage outputs
        are separate steps.
      </p>
    </main>
  );
}
function Workspace({
  user,
  id,
  section,
  onExpired,
}: {
  user: User;
  id: string;
  section: Section;
  onExpired: () => void;
}) {
  const [snapshot, setSnapshot] = useState<{
      project: Project;
      records: Record<Section, SavedRecord>;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api(`/projects/${id}`)
      .then((r) => {
        if (active) setSnapshot(r);
      })
      .catch((e) => {
        if ((e as any).status === 401) onExpired();
        else if (active) setError(errorText(e));
      });
    return () => {
      active = false;
    };
  }, []);
  if (error)
    return (
      <main id="main" tabIndex={-1} className="center">
        <h1>Project unavailable</h1>
        <p role="alert">{error}</p>
        <a href="#/projects">Return to projects</a>
      </main>
    );
  if (!snapshot)
    return (
      <main id="main" tabIndex={-1} className="center">
        <p role="status">Opening project…</p>
      </main>
    );
  return (
    <Editor
      key={section}
      user={user}
      snapshot={snapshot}
      section={section}
      onExpired={onExpired}
      onSaved={(r) =>
        setSnapshot((old) =>
          old ? { ...old, records: { ...old.records, [section]: r } } : old,
        )
      }
    />
  );
}
function Editor({
  user,
  snapshot,
  section,
  onExpired,
  onSaved,
}: {
  user: User;
  snapshot: { project: Project; records: Record<Section, SavedRecord> };
  section: Section;
  onExpired: () => void;
  onSaved: (r: SavedRecord) => void;
}) {
  const [, redraw] = useState(0),
    [ready, setReady] = useState(false),
    [versions, setVersions] = useState<Version[] | null>(null),
    [historyError, setHistoryError] = useState(""),
    [expanded, setExpanded] = useState(""),
    [guidance, setGuidance] = useState(false),
    [notice, setNotice] = useState(""),
    [restoring, setRestoring] = useState<string | null>(null);
  const record = snapshot.records[section];
  const p = snapshot.project;
  const [controller] = useState(
    () =>
      new SaveController(
        `${user.id}:${p.id}:${section}`,
        record,
        recovery,
        ({ seq, ...flight }) =>
          api(`/projects/${p.id}/${section}`, "PUT", flight),
        () => redraw((n) => n + 1),
      ),
  );
  const state = controller.state;
  useEffect(() => {
    let active = true;
    void controller.start().then(() => {
      if (active) setReady(true);
    });
    void api(`/projects/${p.id}/resume`, "POST", { section }).catch(() =>
      setNotice(
        "Your resume location could not be updated. Your content saves are tracked separately.",
      ),
    );
    const refresh = async () => {
      try {
        const r = await api(`/projects/${p.id}`);
        if (active) {
          controller.observe(r.records[section]);
        }
      } catch (e) {
        if ((e as any).status === 401) {
          setNotice(
            "Sign in again to continue synchronizing. Recoverable drafts remain on this device.",
          );
        }
      }
    };
    const online = () => {
      controller.resume();
      void refresh();
    };
    const focus = () => void refresh();
    const interval = setInterval(() => void refresh(), 10000);
    const leave = (e: BeforeUnloadEvent) => {
      if (controller.dirty) {
        void controller.flush();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("online", online);
    window.addEventListener("focus", focus);
    window.addEventListener("beforeunload", leave);
    return () => {
      active = false;
      void controller.flush();
      controller.stop();
      clearInterval(interval);
      window.removeEventListener("online", online);
      window.removeEventListener("focus", focus);
      window.removeEventListener("beforeunload", leave);
    };
  }, []);
  useEffect(() => {
    if (state.status === "saved" && ready)
      onSaved({
        project_id: p.id,
        section,
        revision: state.revision,
        data: state.data,
      });
  }, [state.revision, ready]);
  async function navigate(target: Section | "projects") {
    await controller.flush();
    go(target === "projects" ? "/projects" : `/projects/${p.id}/${target}`);
  }
  async function history() {
    setHistoryError("");
    try {
      setVersions((await api(`/projects/${p.id}/${section}/history`)).versions);
    } catch (e) {
      setHistoryError(errorText(e));
    }
  }
  const title =
    section === "context"
      ? state.data.answers.title?.text
      : snapshot.records.context.data.answers.title?.text;
  const blocked = ["recovery", "conflict"].includes(state.status);
  const index = sections.indexOf(section);
  const cannotContinue = !ready;
  const readiness = analysisAIReadiness({
    ...snapshot.records,
    [section]: { ...record, data: state.data },
  });
  const outstanding = readiness.missing.length;
  const missingSections = sections
    .map((section) => ({
      section,
      count: readiness.missing.filter((field) => field.section === section)
        .length,
    }))
    .filter((group) => group.count > 0);
  const status = !ready
    ? "Checking for recoverable edits…"
    : state.status === "saved"
      ? `All changes saved${state.time ? " · " + date(state.time) : ""}`
      : state.status === "conflict"
        ? "Changes need review"
        : state.status === "recovery"
          ? "Recoverable draft found"
          : state.status === "signin"
            ? "Sign in required"
            : state.status === "waiting"
              ? state.localProtected
                ? "Saved on this device — waiting to sync"
                : "Not saved — synchronization interrupted"
              : "Saving…";
  const update = (data: RecordData, immediate = false) =>
    controller.edit(data, immediate);
  return (
    <>
      <div className="projectbar">
        <button
          className="textbutton"
          onClick={() => void navigate("projects")}
        >
          ← Projects
        </button>
        <strong>{title?.trim() || "Untitled project"}</strong>
        <span className="stage">Analysis</span>
        <p className="savestatus" role="status" aria-live="polite">
          {status}
        </p>
      </div>
      <div className="workspace">
        <aside className="sidebar">
          <p className="eyebrow">Analysis workspace</p>
          <nav aria-label="Analysis sections">
            {sections.map((s, i) => (
              <React.Fragment key={s}>
                {i === 4 && <p className="navgroup">Evaluation planning</p>}
                <a
                  href={`#/projects/${p.id}/${s}`}
                  aria-current={s === section ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    void navigate(s);
                  }}
                >
                  <span className="navnumber">{i + 1}</span>
                  {labels[s]}
                </a>
              </React.Fragment>
            ))}
          </nav>
          <div className="nextstage">
            <p className="eyebrow">Synthesize and design</p>
            <a
              href={`#/projects/${p.id}/analysis-brief`}
              onClick={(e) => {
                e.preventDefault();
                void controller.flush().then(() => {
                  if (controller.dirty || controller.state.status !== "saved") {
                    setNotice(
                      "Synchronize your changes before opening the AI brief.",
                    );
                    return;
                  }
                  go(`/projects/${p.id}/analysis-brief`);
                });
              }}
            >
              Review Analysis brief →
            </a>
            <p className="hint">
              Generate a starting point, review it, and carry your decisions
              into Design.
            </p>
          </div>
        </aside>
        <main id="main" tabIndex={-1} className="editor">
          <div className="sectionheading">
            <div>
              <p className="eyebrow">Analysis · {index + 1} of 7</p>
              <h1
                tabIndex={-1}
                ref={(el) => {
                  if (el && ready && document.activeElement === document.body)
                    el.focus();
                }}
              >
                {labels[section]}
              </h1>
            </div>
            <button
              aria-controls="section-guidance"
              aria-expanded={guidance}
              onClick={() => setGuidance(!guidance)}
            >
              Guidance
            </button>
          </div>
          <p className="sectionintro">
            {index < 4
              ? "Capture the information that will guide the design."
              : "Plan how evidence would be gathered and used. Evaluation execution is outside this MVP."}
          </p>
          {guidance && (
            <aside
              className="guidance"
              id="section-guidance"
              aria-labelledby="guidance-title"
            >
              <h2 id="guidance-title">{sectionGuidance[section].title}</h2>
              <ul>
                {sectionGuidance[section].tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
              <p>
                <strong>Illustrative example: </strong>
                {sectionGuidance[section].example}
              </p>
            </aside>
          )}
          {notice && (
            <p role="status" className="note">
              {notice}
            </p>
          )}
          {state.localFailure && (
            <p role="alert" className="error">
              Browser recovery is unavailable. Keep this page open until server
              saving is confirmed. You can copy your work before leaving.
            </p>
          )}
          {state.error && (
            <p role="alert" className="error">
              {state.error}
            </p>
          )}
          {state.status === "waiting" && (
            <button onClick={() => controller.resume()}>
              Retry synchronization
            </button>
          )}
          {state.status === "signin" && (
            <button onClick={onExpired}>Sign in again</button>
          )}
          {state.status === "recovery" && (
            <section className="recovery">
              <h2>Resume your recoverable draft?</h2>
              <p>
                Unsynced edits from{" "}
                {controller.pending?.updated
                  ? date(controller.pending.updated)
                  : "an earlier session"}{" "}
                are available in this browser. Compare them with the last
                confirmed server copy.
              </p>
              <Compare local={state.data} server={record.data} />
              <div className="buttonrow">
                <button
                  className="primary"
                  onClick={() => void controller.recover()}
                >
                  Recover my draft and sync
                </button>
                <button onClick={() => void controller.chooseServer(record)}>
                  Use server copy and discard this draft
                </button>
              </div>
            </section>
          )}
          {state.status === "conflict" && state.server && (
            <section
              className="recovery"
              role="region"
              aria-label="Resolve conflicting changes"
            >
              <h2>Another version was saved</h2>
              <p>
                Both copies are preserved. Choose a starting point to continue
                editing. A new save checks the server revision again.
              </p>
              <Compare local={state.data} server={state.server.data} />
              <div className="buttonrow">
                <button
                  className="primary"
                  onClick={() =>
                    void controller.resolve(state.server!, state.data)
                  }
                >
                  Use my draft as the starting point
                </button>
                <button
                  onClick={() => void controller.chooseServer(state.server!)}
                >
                  Use server copy and discard my draft
                </button>
              </div>
              <p className="hint">
                To combine them, copy the text you need from either panel,
                choose a starting point, then edit the form. Saving keeps a new
                version.
              </p>
            </section>
          )}
          {!ready ? (
            <p role="status">Checking for recoverable edits…</p>
          ) : (
            <fieldset className="formfields" disabled={blocked}>
              <legend className="sr-only">{labels[section]} questions</legend>
              {index >= 4 && (
                <>
                  <section className="reference">
                    <h2>From your Analysis</h2>
                    <p>
                      <strong>Workplace task: </strong>
                      {snapshot.records.context.data.answers.task?.text ||
                        "Not yet known"}
                    </p>
                    <p>
                      <strong>Desired performance: </strong>
                      {snapshot.records.context.data.answers.desired?.text ||
                        "Not yet known"}
                    </p>
                  </section>
                  <Measures
                    section={section}
                    data={state.data}
                    update={update}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    records={snapshot.records}
                  />
                </>
              )}
              {section === "stakeholders" && (
                <>
                  <h2>
                    Who should provide subject-matter input, review the work, or
                    make final decisions?
                  </h2>
                  <p className="hint">
                    Names or roles are sufficient. Contact information is not
                    needed.
                  </p>
                  <Repeater
                    data={state.data}
                    update={update}
                    fields={stakeholderQuestions}
                    expanded={expanded}
                    setExpanded={setExpanded}
                    name="stakeholder"
                  />
                </>
              )}
              {(questions[section] ?? []).map((q) => (
                <Field
                  key={q.id}
                  question={q}
                  answer={state.data.answers[q.id]}
                  onChange={(a) =>
                    update({
                      ...state.data,
                      answers: { ...state.data.answers, [q.id]: a },
                    })
                  }
                  discrete={() => void controller.flush()}
                />
              ))}
            </fieldset>
          )}
          <div className="formfooter">
            <button
              disabled={index === 0}
              onClick={() => void navigate(sections[index - 1])}
            >
              ← Back
            </button>
            <button onClick={() => void navigate("projects")}>
              Save and return later
            </button>
            {index < 6 ? (
              <button
                className="primary"
                disabled={cannotContinue}
                onClick={() => {
                  if (!cannotContinue) void navigate(sections[index + 1]);
                }}
              >
                Continue →
              </button>
            ) : (
              <p className="hint">
                {outstanding > 0
                  ? `Analysis remains a draft. ${outstanding} core ${outstanding === 1 ? "answer is" : "answers are"} still needed for Design.`
                  : "You can continue refining your Analysis draft."}
              </p>
            )}
          </div>
          <div className="historybar">
            <div className="analysisreadiness">
              <p>
                {outstanding > 0
                  ? `Across all Analysis sections: ${outstanding} required ${outstanding === 1 ? "answer remains" : "answers remain"} before AI generation.`
                  : "All required Analysis answers are entered."}
              </p>
              {missingSections.length > 0 && (
                <ul>
                  {missingSections.map((group) => (
                    <li key={group.section}>
                      <a
                        href={`#/projects/${p.id}/${group.section}`}
                        onClick={(event) => {
                          event.preventDefault();
                          void navigate(group.section);
                        }}
                      >
                        {labels[group.section]}: {group.count} remaining
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={() => void controller.flush()}>Save now</button>
            <button
              aria-expanded={versions !== null}
              onClick={() => (versions ? setVersions(null) : void history())}
            >
              Version history
            </button>
          </div>
          {historyError && (
            <p role="alert" className="error">
              {historyError}
            </p>
          )}
          {versions && (
            <section className="history">
              <h2>Saved versions · {labels[section]}</h2>
              <p>
                The latest 10 saved versions of this section are available here.
                Restoring creates a new version and counts toward that limit.
              </p>
              {controller.dirty && (
                <p className="note">
                  Synchronize or resolve your current draft before restoring a
                  version.
                </p>
              )}
              {versions.map((v) => (
                <details key={v.id}>
                  <summary>
                    Revision {v.revision} · {date(v.created_at)}
                  </summary>
                  <Readable data={v.data} />
                  <button
                    disabled={controller.dirty || !!restoring}
                    onClick={async () => {
                      setRestoring(v.id);
                      setHistoryError("");
                      try {
                        controller.edit(v.data, true);
                        await controller.flush();
                        await history();
                      } catch (e) {
                        if ((e as any).record)
                          controller.observe((e as any).record);
                        setHistoryError(errorText(e));
                      } finally {
                        setRestoring(null);
                      }
                    }}
                  >
                    Restore revision {v.revision}
                  </button>
                </details>
              ))}
            </section>
          )}
        </main>
      </div>
    </>
  );
}
function Field({
  question: q,
  answer,
  onChange,
  discrete,
}: {
  question: Question;
  answer?: Answer;
  onChange: (a: Answer, immediate?: boolean) => void;
  discrete?: () => void;
}) {
  const id = React.useId();
  const a = answer ?? { text: "", status: "provided" };
  const answerOptions = [
    ...new Set([
      ...(q.answerOptions ?? []),
      ...(a.status === "unknown" || a.status === "not_applicable"
        ? [a.status]
        : []),
    ]),
  ];
  if (q.id === "causes")
    return (
      <CausesField
        label={q.label}
        answer={a}
        onChange={(answer) => {
          onChange(answer, true);
          discrete?.();
        }}
      />
    );
  return (
    <div className="field">
      <label htmlFor={id}>{q.label}</label>
      {q.needed && <span className="fieldtag">Needed for Design</span>}
      {q.help && (
        <p className="hint" id={id + "-help"}>
          {q.help}
        </p>
      )}
      {a.status !== "provided" && (
        <p className="answerbadge" id={id + "-status-note"}>
          {a.status === "unknown"
            ? "Not yet known"
            : a.status === "not_applicable"
              ? "Not applicable — explain why in your answer."
              : "Proposed — needs review"}
        </p>
      )}
      {q.short ? (
        <input
          id={id}
          aria-describedby={
            [
              q.help ? id + "-help" : "",
              a.status !== "provided" ? id + "-status-note" : "",
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          maxLength={q.id === "title" ? 300 : 150000}
          value={a.text}
          onChange={(e) => onChange({ ...a, text: e.target.value })}
        />
      ) : (
        <textarea
          id={id}
          aria-describedby={
            [
              q.help ? id + "-help" : "",
              a.status !== "provided" ? id + "-status-note" : "",
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          rows={3}
          value={a.text}
          maxLength={150000}
          placeholder={
            a.status === "not_applicable"
              ? "Explain why this does not apply."
              : a.status === "unknown"
                ? "Optional: describe what still needs checking."
                : undefined
          }
          onChange={(e) => onChange({ ...a, text: e.target.value })}
        />
      )}
      {answerOptions.length > 0 && (
        <fieldset className="answeroptions">
          <legend className="sr-only">Information status: {q.label}</legend>
          {answerOptions.map((status) => (
            <label key={status}>
              <input
                type="checkbox"
                checked={a.status === status}
                onChange={(e) => {
                  onChange(
                    { ...a, status: e.target.checked ? status : "provided" },
                    true,
                  );
                  discrete?.();
                }}
              />
              {status === "unknown"
                ? "Not yet known"
                : "Not applicable — add a reason"}
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
function Repeater({
  data,
  update,
  fields,
  expanded,
  setExpanded,
  name,
  extra,
}: {
  data: RecordData;
  update: (d: RecordData, immediate?: boolean) => void;
  fields: Question[];
  expanded: string;
  setExpanded: (id: string) => void;
  name: string;
  extra?: (
    item: RecordData["items"][number],
    change: (item: RecordData["items"][number], immediate?: boolean) => void,
  ) => React.ReactNode;
}) {
  return (
    <div className="repeaters">
      {data.items.length === 0 && (
        <p className="note">
          No {name}s yet. You can add one now or return later.
        </p>
      )}
      {data.items.map((item, index) => {
        const change = (next: typeof item, immediate = false) =>
          update(
            {
              ...data,
              items: data.items.map((i) => (i.id === item.id ? next : i)),
            },
            immediate,
          );
        return (
          <section className="measure" key={item.id}>
            <h3>
              <button
                className="measuretoggle"
                aria-expanded={expanded === item.id}
                onClick={() => setExpanded(expanded === item.id ? "" : item.id)}
              >
                {name === "measure" ? "Measure" : "Stakeholder"} {index + 1}:{" "}
                {item.answers[fields[0].id]?.text.trim() || "Not yet known"}{" "}
                <span aria-hidden="true">
                  {expanded === item.id ? "−" : "+"}
                </span>
              </button>
            </h3>
            {expanded === item.id && (
              <div className="measurebody">
                {fields.map((q) => (
                  <Field
                    key={q.id}
                    question={q}
                    answer={item.answers[q.id]}
                    onChange={(a, immediate) =>
                      change(
                        {
                          ...item,
                          answers: { ...item.answers, [q.id]: a },
                        },
                        immediate,
                      )
                    }
                  />
                ))}
                {extra?.(item, change)}
                <div className="buttonrow">
                  <button
                    disabled={index === 0}
                    onClick={() => {
                      const items = [...data.items];
                      [items[index - 1], items[index]] = [
                        items[index],
                        items[index - 1],
                      ];
                      update({ ...data, items }, true);
                    }}
                  >
                    Move up
                  </button>
                  <button
                    disabled={index === data.items.length - 1}
                    onClick={() => {
                      const items = [...data.items];
                      [items[index + 1], items[index]] = [
                        items[index],
                        items[index + 1],
                      ];
                      update({ ...data, items }, true);
                    }}
                  >
                    Move down
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      update(
                        {
                          ...data,
                          items: data.items.filter((i) => i.id !== item.id),
                        },
                        true,
                      );
                      setExpanded("");
                    }}
                  >
                    Remove {name}
                  </button>
                </div>
                <p className="hint">
                  Removed entries remain in saved version history.
                </p>
              </div>
            )}
          </section>
        );
      })}
      <button
        onClick={() => {
          const id = crypto.randomUUID();
          update(
            { ...data, items: [...data.items, { id, answers: {}, links: [] }] },
            true,
          );
          setExpanded(id);
        }}
      >
        + Add {name}
      </button>
    </div>
  );
}
function Measures({
  section,
  data,
  update,
  expanded,
  setExpanded,
  records,
}: {
  section: Section;
  data: RecordData;
  update: (d: RecordData, immediate?: boolean) => void;
  expanded: string;
  setExpanded: (id: string) => void;
  records: Record<Section, SavedRecord>;
}) {
  const related =
    section === "workplace"
      ? records["org-results"].data.items
      : section === "learning"
        ? records.workplace.data.items
        : [];
  return (
    <>
      <p className="note">
        {section === "learning"
          ? "These are measurement intentions. Detailed objectives and assessments come later in Design."
          : "Add one card per indicator or measure."}
      </p>
      <Repeater
        data={data}
        update={update}
        fields={[...measureQuestions[section], ...collectionQuestions]}
        expanded={expanded}
        setExpanded={setExpanded}
        name="measure"
        extra={(item, change) =>
          section === "org-results" ? null : (
            <fieldset>
              <legend>
                Related{" "}
                {section === "learning"
                  ? "workplace-performance measures"
                  : "organizational results"}
              </legend>
              {item.links?.some((id) => !related.some((r) => r.id === id)) && (
                <p className="note">
                  Needs update: a linked measure is no longer in the current
                  draft. Its reference is preserved. Check version history
                  before choosing a replacement.
                </p>
              )}
              {!related.length ? (
                <p className="hint">
                  Add measures in the previous evaluation section to link them
                  here.
                </p>
              ) : (
                related.map((r, i) => (
                  <label className="checklabel" key={r.id}>
                    <input
                      type="checkbox"
                      checked={item.links?.includes(r.id) ?? false}
                      onChange={(e) =>
                        change(
                          {
                            ...item,
                            links: e.target.checked
                              ? [...(item.links ?? []), r.id]
                              : (item.links ?? []).filter((id) => id !== r.id),
                          },
                          true,
                        )
                      }
                    />
                    {r.answers.description?.text || `Measure ${i + 1}`}
                  </label>
                ))
              )}
            </fieldset>
          )
        }
      />
    </>
  );
}
function Readable({ data }: { data: RecordData }) {
  return (
    <div className="readable">
      {Object.entries(data.answers).map(([k, a]) => (
        <p key={k}>
          <strong>
            {Object.values(questions)
              .flat()
              .find((q) => q.id === k)?.label ?? k}
          </strong>
          <br />
          {a.text || "Not yet known"}
          {a.status !== "provided" &&
            ` (${a.status === "unknown" ? "Not yet known" : a.status === "proposed" ? "Proposed — needs review" : "Not applicable"})`}
        </p>
      ))}
      {data.items.map((item, i) => (
        <section key={item.id}>
          <h4>Entry {i + 1}</h4>
          {Object.entries(item.answers).map(([k, a]) => (
            <p key={k}>
              <strong>
                {[
                  ...stakeholderQuestions,
                  ...collectionQuestions,
                  ...Object.values(measureQuestions).flat(),
                ].find((q) => q.id === k)?.label ?? k}
              </strong>
              <br />
              {a.text || "Not yet known"}
            </p>
          ))}
        </section>
      ))}
      {!Object.keys(data.answers).length && !data.items.length && (
        <p>Empty draft</p>
      )}
    </div>
  );
}
function Compare({ local, server }: { local: RecordData; server: RecordData }) {
  return (
    <div className="compare">
      <section>
        <h3>Your recoverable draft</h3>
        <Readable data={local} />
      </section>
      <section>
        <h3>Confirmed server copy</h3>
        <Readable data={server} />
      </section>
    </div>
  );
}
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
// Dispose the entry's root before a development-only module reload creates another.
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
