import React, { useEffect, useState } from "react";
import { api } from "./http";
import { extractOffice, ExtractionError, hasUsableText } from "./extract";
import {
  ProjectShell,
  RecordNotices,
  saveText,
  useRecord,
  type Snapshot,
} from "./ProjectShell";

type SourceFile = {
  id: string;
  name: string;
  kind: "docx" | "pptx" | "text";
  usable: boolean;
};
const noText =
  "No usable text could be extracted from this file. It will not be used as an AI source. Upload a Word or PowerPoint file with editable text, or paste the content.";
// Asked once for the whole project; AI applies these rules to every content mapping.
const questions: [string, string, [string, string][]?][] = [
  [
    "mode",
    "Which sources may AI use for content?",
    [
      ["provided", "Only the sources added on this page"],
      ["provided-web", "These sources, plus permitted web research"],
      ["web", "Permitted web research"],
    ],
  ],
  ["preferred", "Preferred sources or authorities"],
  ["excluded", "Sources or topics to exclude"],
  ["precedence", "When sources disagree, which takes precedence?"],
  [
    "boundaries",
    "Content boundaries: what the learning should and should not cover",
  ],
  [
    "gaps",
    "When required content is missing",
    [
      ["gap", "Show it as a gap for me to resolve"],
      ["propose", "Propose content, clearly marked as unverified"],
    ],
  ],
];
const kindLabels = { docx: "Word", pptx: "PowerPoint", text: "Pasted text" };

export function SourcesPage({
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
    "sources",
    snapshot,
    onSnapshot,
  );
  const [files, setFiles] = useState<SourceFile[] | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [removing, setRemoving] = useState(""),
    [pasteName, setPasteName] = useState(""),
    [pasteText, setPasteText] = useState("");
  const base = `/projects/${id}/source-files`;
  useEffect(() => {
    api(base)
      .then((r) => setFiles(r.sources))
      .catch((e) => setError(e.message));
  }, []);
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function add(
    name: string,
    kind: SourceFile["kind"],
    content: string,
    refs: { label: string }[] = [],
  ) {
    const r = await api(base, "POST", {
      source_id: crypto.randomUUID(),
      name,
      kind,
      content,
      refs,
    });
    setFiles(r.sources);
  }
  async function upload(list: FileList) {
    const messages: string[] = [];
    for (const file of Array.from(list)) {
      try {
        const out = extractOffice(
          file.name,
          new Uint8Array(await file.arrayBuffer()),
        );
        await add(file.name, out.kind, out.content, out.refs);
        messages.push(
          !out.usable
            ? `${file.name}: ${noText}`
            : `${file.name} was added.${out.truncated ? " Only its first 100,000 characters will be used." : ""}`,
        );
      } catch (e) {
        if (!(e instanceof ExtractionError)) throw e;
        messages.push(`${file.name}: ${e.message}`);
      }
    }
    setNotice(messages.join(" "));
  }
  function answer(key: string, text: string) {
    controller.edit(
      {
        ...data,
        answers: { ...data.answers, [key]: { text, status: "provided" } },
      },
      questions.find((q) => q[0] === key)?.[2] !== undefined,
    );
  }
  return (
    <ProjectShell
      id={id}
      snapshot={snapshot}
      page="sources"
      status={saveText(ready, state)}
      onNavigate={onNavigate}
    >
      <p className="eyebrow">Project-wide</p>
      <h1>Sources</h1>
      <p className="sectionintro">
        Add the material AI may draw on, and set the source rules once for the
        whole project. Design and Development drafts use them for every
        objective.
      </p>
      <div className="note">
        <h2>What you may add</h2>
        <p>
          Public material, fictional examples, or employer-approved material
          with confidential and personal details removed. Do not add
          identifiable employee or customer cases, passwords or business
          secrets. The app does not detect or remove sensitive details for you.
        </p>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <RecordNotices controller={controller} />
      <section aria-labelledby="files-title">
        <h2 id="files-title">Source files and text</h2>
        <p className="hint">
          Word (.docx) and PowerPoint (.pptx), up to 10 MB each and 20 sources
          per project. The app reads the editable text, including speaker notes;
          it does not read images, scans or PDFs. Original files are not kept.
        </p>
        <div className="question">
          <label htmlFor="source-upload">Add Word or PowerPoint files</label>
          <input
            id="source-upload"
            type="file"
            multiple
            disabled={busy}
            accept=".docx,.pptx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={(e) => {
              const list = e.target.files;
              if (list?.length) void act(() => upload(list));
              e.target.value = "";
            }}
          />
        </div>
        {notice && (
          <p className="hint" role="status">
            {notice}
          </p>
        )}
        {files === null ? (
          <p role="status">Loading sources…</p>
        ) : files.length === 0 ? (
          <p>No sources added yet.</p>
        ) : (
          <ul className="sourcelist">
            {files.map((f) => (
              <li key={f.id}>
                <span className="sourcename">{f.name}</span>{" "}
                <span className="sourcekind">{kindLabels[f.kind]}</span>
                <span className={"sourcestatus " + (f.usable ? "ok" : "warn")}>
                  <span aria-hidden="true">{f.usable ? "✓" : "!"}</span>{" "}
                  {f.usable ? "Text available to AI" : "No usable text"}
                </span>
                {!f.usable && <p className="hint">{noText}</p>}
                {removing === f.id ? (
                  <span className="buttonrow">
                    <button
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          setFiles(
                            (await api(`${base}/${f.id}`, "DELETE")).sources,
                          );
                          setRemoving("");
                        })
                      }
                    >
                      Confirm removing {f.name}
                    </button>
                    <button onClick={() => setRemoving("")}>Cancel</button>
                  </span>
                ) : (
                  <button
                    aria-label={`Remove ${f.name}`}
                    disabled={busy}
                    onClick={() => setRemoving(f.id)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <details className="revise">
          <summary>Paste text instead</summary>
          <div className="question">
            <label htmlFor="paste-name">Source name</label>
            <input
              id="paste-name"
              value={pasteName}
              maxLength={200}
              onChange={(e) => setPasteName(e.target.value)}
            />
          </div>
          <div className="question">
            <label htmlFor="paste-text">Source text</label>
            <textarea
              id="paste-text"
              rows={6}
              value={pasteText}
              maxLength={100000}
              onChange={(e) => setPasteText(e.target.value)}
            />
          </div>
          <button
            disabled={busy || !pasteName.trim() || !hasUsableText(pasteText)}
            onClick={() =>
              void act(async () => {
                await add(pasteName.trim(), "text", pasteText);
                setNotice(`${pasteName.trim()} was added.`);
                setPasteName("");
                setPasteText("");
              })
            }
          >
            Add pasted text
          </button>
        </details>
      </section>
      <fieldset
        className="workflowfields"
        disabled={blocked}
        aria-labelledby="rules-title"
      >
        <h2 id="rules-title">Source rules for this project</h2>
        <p className="hint">
          Web research is not connected in this pilot yet. Until it is, AI uses
          only the sources added on this page.
        </p>
        {questions.map(([key, label, choices]) => (
          <div className="question" key={key}>
            <label htmlFor={"sources-" + key}>{label}</label>
            {choices ? (
              <select
                id={"sources-" + key}
                value={data.answers[key]?.text ?? ""}
                onChange={(e) => answer(key, e.target.value)}
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
                id={"sources-" + key}
                rows={3}
                value={data.answers[key]?.text ?? ""}
                onChange={(e) => answer(key, e.target.value)}
              />
            )}
          </div>
        ))}
      </fieldset>
    </ProjectShell>
  );
}
