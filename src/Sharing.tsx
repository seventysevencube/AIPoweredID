import React, { useEffect, useState } from "react";
import { api } from "./http";
import { ProjectShell, pageLabels, type Snapshot } from "./ProjectShell";
import { workflowSections } from "./workflow-model";
import { Exports } from "./Exports";

type Comment = {
  id: string;
  target: { section: string; item?: string; label?: string };
  display_name: string;
  body: string;
  created_at: string;
};
export type ReviewLink = {
  id: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  active: boolean;
  sections: string[];
  versions: Record<string, number>;
  comments: Comment[];
};
const shareable = [...workflowSections, "development"] as const;
const tokenKey = (link: string) => `review-link:${link}`;
const linkUrl = (token: string) =>
  `${location.origin}${location.pathname}#/review/${token}`;
const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const hasContent = (snapshot: Snapshot, s: string) => {
  const data = snapshot.records[s]?.data;
  return (
    !!data &&
    (data.items.length > 0 ||
      Object.keys(data.answers).some((k) => !k.startsWith("_")))
  );
};

export function SharingPage({
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
  const available = shareable.filter((s) => hasContent(snapshot, s));
  const [links, setLinks] = useState<ReviewLink[] | null>(null),
    [sources, setSources] = useState<
      { id: string; name: string; usable: boolean }[]
    >([]),
    [chosen, setChosen] = useState<string[]>([]),
    [chosenSources, setChosenSources] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [created, setCreated] = useState(""),
    [copied, setCopied] = useState("");
  const base = `/projects/${id}`;
  useEffect(() => {
    api(base + "/reviews")
      .then((r) => setLinks(r.links))
      .catch((e) => setError(e.message));
    api(base + "/source-files")
      .then((r) => setSources(r.sources.filter((s: any) => s.usable)))
      .catch(() => {});
  }, []);
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
  const token = (link: string) => {
    try {
      return localStorage.getItem(tokenKey(link));
    } catch {
      return null;
    }
  };
  async function copy(link: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(link);
    } catch {
      setCopied("");
    }
  }
  const toggle = (list: string[], value: string, on: boolean) =>
    on ? [...list, value] : list.filter((v) => v !== value);
  return (
    <ProjectShell
      id={id}
      snapshot={snapshot}
      page="sharing"
      onNavigate={onNavigate}
    >
      <p className="eyebrow">Project-wide</p>
      <h1>Share and export</h1>
      <p className="sectionintro">
        Ask colleagues for comments on a fixed copy of your work, and export
        saved content for handoff.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <section aria-labelledby="review-title">
        <h2 id="review-title">Guest review links</h2>
        <p>
          Anyone with a link can read the copy you choose and leave comments
          under a name they type, which is not verified. They cannot edit your
          work, and comments never change it. A link shows the work as it is
          now; later edits need a new link. Links stop working after 14 days, or
          when you turn them off. Copies a reviewer has already saved cannot be
          recalled.
        </p>
        <fieldset className="choices">
          <legend>What to share</legend>
          {available.length === 0 && (
            <p className="hint">Nothing has been drafted yet.</p>
          )}
          {available.map((s) => (
            <label className="checklabel" key={s}>
              <input
                type="checkbox"
                checked={chosen.includes(s)}
                onChange={(e) => setChosen(toggle(chosen, s, e.target.checked))}
              />
              {pageLabels[s]}
            </label>
          ))}
        </fieldset>
        {sources.length > 0 && (
          <fieldset className="choices">
            <legend>Supporting sources to include (optional)</legend>
            <p className="hint">
              Sources are not shared unless you choose them here. The reviewer
              sees their extracted text.
            </p>
            {sources.map((s) => (
              <label className="checklabel" key={s.id}>
                <input
                  type="checkbox"
                  checked={chosenSources.includes(s.id)}
                  onChange={(e) =>
                    setChosenSources(
                      toggle(chosenSources, s.id, e.target.checked),
                    )
                  }
                />
                {s.name}
              </label>
            ))}
          </fieldset>
        )}
        <button
          className="primary"
          disabled={busy || !chosen.length}
          onClick={() =>
            void act(async () => {
              const r = await api(base + "/reviews", "POST", {
                sections: chosen,
                sources: chosenSources,
              });
              const link = r.links[0];
              try {
                localStorage.setItem(tokenKey(link.id), r.token);
              } catch {}
              setLinks(r.links);
              setCreated(link.id);
              setChosen([]);
              setChosenSources([]);
            })
          }
        >
          Create review link
        </button>
        {links === null ? (
          <p role="status">Loading review links…</p>
        ) : (
          links.length > 0 && (
            <ul className="links">
              {links.map((l) => {
                const t = token(l.id);
                return (
                  <li key={l.id} className={l.active ? "" : "inactive"}>
                    <p>
                      <strong>
                        {l.sections
                          .map((s) => pageLabels[s as keyof typeof pageLabels])
                          .join(", ")}
                      </strong>
                    </p>
                    <p className="hint">
                      Shared {day(l.created_at)} ·{" "}
                      {l.revoked_at
                        ? `Turned off ${day(l.revoked_at)}`
                        : l.active
                          ? `Active until ${day(l.expires_at)}`
                          : `Expired ${day(l.expires_at)}`}{" "}
                      · {l.comments.length} comment
                      {l.comments.length === 1 ? "" : "s"}
                    </p>
                    {l.active && t && (
                      <div className="question">
                        <label htmlFor={"link-" + l.id}>Review link</label>
                        <input
                          id={"link-" + l.id}
                          readOnly
                          value={linkUrl(t)}
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    )}
                    {created === l.id && (
                      <p className="note" role="status">
                        Link created. Copy it now: for privacy, it is shown only
                        in this browser.
                      </p>
                    )}
                    <div className="buttonrow">
                      {l.active && t && (
                        <button onClick={() => void copy(l.id, linkUrl(t))}>
                          {copied === l.id ? "Copied" : "Copy link"}
                        </button>
                      )}
                      {l.active && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void act(async () => {
                              setLinks(
                                (
                                  await api(
                                    `${base}/reviews/${l.id}/revoke`,
                                    "POST",
                                    {},
                                  )
                                ).links,
                              );
                            })
                          }
                        >
                          Turn off this link
                        </button>
                      )}
                    </div>
                    {l.comments.length > 0 && (
                      <details>
                        <summary>
                          Comments on this copy ({l.comments.length})
                        </summary>
                        <ul className="comments">
                          {l.comments.map((c) => (
                            <li key={c.id}>
                              <p className="hint">
                                {pageLabels[
                                  c.target.section as keyof typeof pageLabels
                                ] ?? c.target.section}
                                {c.target.label ? ` · ${c.target.label}` : ""} ·
                                version {l.versions[c.target.section]}
                              </p>
                              <p className="readable">{c.body}</p>
                              <p className="hint">
                                {c.display_name} (name not verified) ·{" "}
                                {new Date(c.created_at).toLocaleString()}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </li>
                );
              })}
            </ul>
          )
        )}
      </section>
      <Exports
        id={id}
        userId={userId}
        snapshot={snapshot}
        onSnapshot={onSnapshot}
        links={links ?? []}
      />
    </ProjectShell>
  );
}
