import React, { useEffect, useState } from "react";
import { api } from "./http";
import {
  buildExport,
  exportable,
  type ExportDoc,
  type Exportable,
} from "./export-model";
import type { ReviewLink } from "./Sharing";

const when = (iso: string) => new Date(iso).toLocaleString();
export const reviewComments = (links: ReviewLink[]) =>
  links.flatMap((l) =>
    l.comments.map((c) => ({ ...c, version: l.versions[c.target.section] })),
  );

// A print-ready handoff document from saved content; the browser saves it as a tagged PDF.
export function PrintView({ id, query }: { id: string; query: string }) {
  const params = new URLSearchParams(query);
  const [doc, setDoc] = useState<ExportDoc | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    (async () => {
      const comments = params.get("comments") === "1";
      const [snapshot, sources, reviews] = await Promise.all([
        api(`/projects/${id}/workflow`),
        api(`/projects/${id}/source-files`),
        comments ? api(`/projects/${id}/reviews`) : { links: [] },
      ]);
      const chosen = (params.get("sections") ?? "")
        .split(",")
        .filter((s): s is Exportable =>
          (exportable as readonly string[]).includes(s),
        );
      setDoc(
        buildExport(
          snapshot,
          { sections: chosen, comments },
          { sources: sources.sources, comments: reviewComments(reviews.links) },
        ),
      );
    })().catch((e) => setError(e.message));
  }, [id, query]);
  if (error)
    return (
      <main id="main" tabIndex={-1} className="center">
        <h1>Export unavailable</h1>
        <p role="alert">{error}</p>
      </main>
    );
  if (!doc)
    return (
      <main id="main" tabIndex={-1} className="center">
        <p role="status">Preparing the document…</p>
      </main>
    );
  return (
    <main id="main" tabIndex={-1} className="printview">
      <div className="noprint note">
        <p>
          This is the print-ready handoff document. Choose Print, then Save as
          PDF as the destination.
        </p>
        <div className="buttonrow">
          <button className="primary" onClick={() => window.print()}>
            Print or save as PDF
          </button>
          <a href={`#/projects/${id}/sharing`}>Back to Share and export</a>
        </div>
      </div>
      <header>
        <p className="eyebrow">{doc.status}</p>
        <h1>{doc.title}</h1>
        <dl className="meta">
          <dt>Status</dt>
          <dd>{doc.status}</dd>
          <dt>Deliverable</dt>
          <dd>{doc.deliverable}</dd>
          <dt>Exported</dt>
          <dd>{when(doc.exportedAt)}</dd>
          {doc.parts.map((p) => (
            <React.Fragment key={p.key}>
              <dt>{p.label}</dt>
              <dd>
                Version {p.version} · {p.status}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      </header>
      {doc.parts.map((p) => (
        <section key={p.key} className="printpart">
          <h2>{p.label}</h2>
          <p className="hint">
            Version {p.version} · {p.status}
          </p>
          {p.fields.map((f) => (
            <div key={f.label}>
              <h3>{f.label}</h3>
              <p className="readable">{f.text}</p>
            </div>
          ))}
          {p.items.map((item, n) => (
            <article key={n} className="printitem">
              <h3>{item.heading}</h3>
              {item.status && <p className="hint">Section {item.status}</p>}
              {item.fields.map((f) => (
                <div key={f.label}>
                  <h4>{f.label}</h4>
                  <p className="readable">{f.text}</p>
                </div>
              ))}
            </article>
          ))}
        </section>
      ))}
      <section className="printpart">
        <h2>Sources</h2>
        {doc.sources.length ? (
          <ul>
            {doc.sources.map((s) => (
              <li key={s.name}>
                {s.name} (
                {s.kind === "text" ? "pasted text" : s.kind.toUpperCase()}
                {s.usable ? "" : ", no usable text"})
              </li>
            ))}
          </ul>
        ) : (
          <p>No sources were added.</p>
        )}
      </section>
      <section className="printpart">
        <h2>Open issues</h2>
        {doc.issues.length ? (
          <ul>
            {doc.issues.map((i, n) => (
              <li key={n}>
                <strong>{i.where}:</strong>{" "}
                <span className="readable">{i.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No open issues were recorded.</p>
        )}
      </section>
      {doc.comments && (
        <section className="printpart">
          <h2>Appendix: reviewer comments</h2>
          <p className="hint">Guest names are not verified.</p>
          {doc.comments.length ? (
            <ul>
              {doc.comments.map((c, n) => (
                <li key={n}>
                  <strong>{c.where}</strong> (version {c.version}) · {c.name} ·{" "}
                  {when(c.at)}
                  <p className="readable">{c.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No reviewer comments.</p>
          )}
        </section>
      )}
    </main>
  );
}
