import React, { useEffect, useState } from "react";
import { api } from "./http";
import { pageLabels } from "./ProjectShell";
import {
  developmentFields,
  developmentItemFields,
  fieldsFor,
  itemFieldsFor,
  type WorkflowSection,
} from "./workflow-model";

type Target = { section: string; item?: string; label?: string };
type Comment = Target & {
  id: string;
  display_name: string;
  body: string;
  created_at: string;
};
type Shared = {
  title: string;
  expires_at: string;
  snapshot: {
    sections: string[];
    records: Record<
      string,
      {
        answers: Record<string, { text: string }>;
        items: { id: string; answers: Record<string, { text: string }> }[];
      }
    >;
    sources: { name: string; kind: string; text: string }[];
    shared_at: string;
  };
  comments: {
    id: string;
    target: Target;
    display_name: string;
    body: string;
    created_at: string;
  }[];
};
const fields = (s: string) =>
  s === "development" ? developmentFields : fieldsFor(s as WorkflowSection);
const itemFields = (s: string) =>
  s === "development"
    ? developmentItemFields
    : (itemFieldsFor(s as WorkflowSection) ?? []);
const nameKey = "review-display-name";
const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Account-free guest review of a fixed copy. Comments never change the designer's work.
export function GuestReview({ token }: { token: string }) {
  const [shared, setShared] = useState<Shared | null>(null),
    [error, setError] = useState(""),
    [target, setTarget] = useState<Target | null>(null),
    [name, setName] = useState(() => {
      try {
        return localStorage.getItem(nameKey) ?? "";
      } catch {
        return "";
      }
    }),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false),
    [posted, setPosted] = useState("");
  useEffect(() => {
    api("/review/open", "POST", { token })
      .then(setShared)
      .catch((e) => setError(e.message));
  }, [token]);
  async function post() {
    if (!target) return;
    setBusy(true);
    setError("");
    try {
      try {
        localStorage.setItem(nameKey, name.trim());
      } catch {}
      setShared(
        await api("/review/comment", "POST", {
          token,
          comment_id: crypto.randomUUID(),
          target,
          display_name: name.trim(),
          body: body.trim(),
        }),
      );
      setPosted(
        `Comment posted on ${target.label ?? pageLabels[target.section as WorkflowSection]}.`,
      );
      setBody("");
      setTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (error && !shared)
    return (
      <main id="main" tabIndex={-1} className="center">
        <h1>Review unavailable</h1>
        <p role="alert">{error}</p>
      </main>
    );
  if (!shared)
    return (
      <main id="main" tabIndex={-1} className="center">
        <p role="status">Opening the shared copy…</p>
      </main>
    );
  const same = (a: Target, b: Target) =>
    a.section === b.section && (a.item ?? "") === (b.item ?? "");
  const comments = (t: Target) =>
    shared.comments
      .filter((c) => same(c.target, t))
      .map((c) => ({ ...c, ...c.target }) as Comment);
  const block = (t: Target) => (
    <>
      {comments(t).length > 0 && (
        <ul className="comments">
          {comments(t).map((c) => (
            <li key={c.id}>
              <p className="readable">{c.body}</p>
              <p className="hint">
                {c.display_name} (name not verified) ·{" "}
                {new Date(c.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
      {target && same(target, t) ? (
        <form
          className="commentform"
          onSubmit={(e) => {
            e.preventDefault();
            void post();
          }}
        >
          <div className="question">
            <label htmlFor="review-name">Your name</label>
            <input
              id="review-name"
              required
              maxLength={80}
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
            />
            <p className="hint">Shown with your comment. It is not verified.</p>
          </div>
          <div className="question">
            <label htmlFor="review-body">
              Comment on {t.label ?? pageLabels[t.section as WorkflowSection]}
            </label>
            <textarea
              id="review-body"
              required
              rows={4}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="buttonrow">
            <button
              className="primary"
              disabled={busy || !name.trim() || !body.trim()}
            >
              Post comment
            </button>
            <button type="button" onClick={() => setTarget(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="commentbutton"
          onClick={() => {
            setTarget(t);
            setPosted("");
          }}
        >
          Comment on {t.label ?? pageLabels[t.section as WorkflowSection]}
        </button>
      )}
    </>
  );
  const { snapshot } = shared;
  return (
    <main id="main" tabIndex={-1} className="review">
      <p className="eyebrow">Guest review</p>
      <h1>{shared.title}</h1>
      <p className="sectionintro">
        A fixed copy shared on {day(snapshot.shared_at)}. Your comments go to
        the designer and do not change the work. This link works until{" "}
        {day(shared.expires_at)} unless the designer turns it off.
      </p>
      {posted && (
        <p className="note" role="status" tabIndex={-1} ref={(e) => e?.focus()}>
          {posted}
        </p>
      )}
      {snapshot.sections.map((s) => {
        const record = snapshot.records[s];
        return (
          <section key={s} className="reviewsection" aria-labelledby={"r-" + s}>
            <h2 id={"r-" + s}>{pageLabels[s as WorkflowSection]}</h2>
            {fields(s)
              .filter(([k]) => record.answers[k]?.text?.trim())
              .map(([k, label]) => (
                <div key={k}>
                  <h3>{label}</h3>
                  <p className="readable">{record.answers[k].text}</p>
                </div>
              ))}
            {block({ section: s })}
            {record.items.map((item, n) => {
              const label =
                [item.answers.code?.text, item.answers.title?.text]
                  .filter(Boolean)
                  .join(" ") || `Entry ${n + 1}`;
              return (
                <article key={item.id} className="workflowcard">
                  <h3>{label}</h3>
                  {itemFields(s)
                    .filter(
                      ([k]) =>
                        k !== "code" &&
                        k !== "title" &&
                        item.answers[k]?.text?.trim(),
                    )
                    .map(([k, l]) => (
                      <p key={k} className="readable">
                        <strong>{l}:</strong> {item.answers[k].text}
                      </p>
                    ))}
                  {block({ section: s, item: item.id, label })}
                </article>
              );
            })}
          </section>
        );
      })}
      {snapshot.sources.length > 0 && (
        <section className="reviewsection" aria-labelledby="r-sources">
          <h2 id="r-sources">Supporting sources</h2>
          {snapshot.sources.map((src) => (
            <details key={src.name}>
              <summary>{src.name}</summary>
              <p className="readable">{src.text}</p>
            </details>
          ))}
        </section>
      )}
    </main>
  );
}
