import { unzipSync } from "fflate";

// Basic, conventional extraction of editable text from Word (.docx) and PowerPoint (.pptx).
// XML is tokenized as text only: nothing in the file is executed, rendered or fetched.
export const sourceLimits = {
  fileBytes: 10_000_000,
  unpackedBytes: 60_000_000,
  characters: 100_000,
};
export type Extracted = {
  kind: "docx" | "pptx";
  content: string;
  refs: { label: string }[];
  usable: boolean;
  truncated: boolean;
};
export class ExtractionError extends Error {}

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};
function decode(text: string) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (all, code: string) => {
    if (code[0] === "#") {
      const n =
        code[1].toLowerCase() === "x"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff
        ? String.fromCodePoint(n)
        : "";
    }
    return entities[code] ?? all;
  });
}
type Token =
  | { tag: string; close: boolean; self: boolean; attrs: string }
  | { text: string };
function* tokens(xml: string): Generator<Token> {
  const pattern = /<(\/?)([\w:.-]+)([^>]*?)(\/?)>|<[?!][^>]*>|([^<]+)/g;
  for (const m of xml.matchAll(pattern)) {
    if (m[5] !== undefined) yield { text: m[5] };
    else if (m[2])
      yield { tag: m[2], close: m[1] === "/", self: m[4] === "/", attrs: m[3] };
  }
}
const attr = (attrs: string, name: string) =>
  attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const clean = (text: string) =>
  text
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();

function docx(xml: string) {
  const lines: string[] = [];
  const refs: { label: string }[] = [];
  let para = "",
    style = "",
    inText = false,
    tables = 0,
    cell = "",
    row: string[] = [];
  for (const t of tokens(xml)) {
    if ("text" in t) {
      if (inText) para += decode(t.text);
      continue;
    }
    const { tag, close, self } = t;
    if (tag === "w:t") inText = !close && !self;
    else if (tag === "w:tab" && !close) para += "\t";
    else if ((tag === "w:br" || tag === "w:cr") && !close) para += "\n";
    else if (tag === "w:pStyle" && !close) style = attr(t.attrs, "w:val") ?? "";
    else if (tag === "w:p" && !close && !self) {
      para = "";
      style = "";
    } else if (tag === "w:p" && close) {
      const text = clean(para);
      if (!text) continue;
      if (tables) cell += (cell ? " " : "") + text;
      else {
        const level = style.match(/^heading\s?(\d)$/i)?.[1];
        if (level || /^title$/i.test(style)) {
          lines.push(`${"#".repeat(Number(level ?? 1))} ${text}`);
          refs.push({ label: `Heading: ${text.slice(0, 120)}` });
        } else lines.push(text);
      }
    } else if (tag === "w:tbl") tables += close ? -1 : self ? 0 : 1;
    else if (tables === 1 && tag === "w:tr" && !close) row = [];
    else if (tables === 1 && tag === "w:tr" && close) {
      if (row.some(Boolean)) lines.push(row.join(" | "));
    } else if (tables === 1 && tag === "w:tc" && !close) cell = "";
    else if (tables === 1 && tag === "w:tc" && close) row.push(cell);
  }
  return { lines, refs };
}

// Text paragraphs from slide or notes shapes, skipping number/date/footer placeholders.
function slideText(xml: string, notes: boolean) {
  const out: { title: boolean; text: string }[] = [];
  let skip = false,
    title = false,
    inShape = 0,
    inText = false,
    para = "";
  for (const t of tokens(xml)) {
    if ("text" in t) {
      if (inText && !skip) para += decode(t.text);
      continue;
    }
    const { tag, close, self } = t;
    if ((tag === "p:sp" || tag === "p:graphicFrame") && !self) {
      // Placeholder roles apply only inside their own shape.
      if (tag === "p:sp") inShape += close ? -1 : 1;
      skip = false;
      title = false;
    } else if (tag === "p:ph" && !close) {
      const type = attr(t.attrs, "type") ?? "body";
      skip =
        ["sldNum", "dt", "ftr", "hdr", "sldImg"].includes(type) ||
        (notes && type !== "body");
      title = ["title", "ctrTitle"].includes(type);
    } else if (tag === "a:t") inText = !close && !self;
    else if (tag === "a:br" && !close) para += "\n";
    else if (tag === "a:p" && !close && !self) para = "";
    else if (tag === "a:p" && close) {
      const text = clean(para);
      if (text && !skip) out.push({ title: title && inShape > 0, text });
    }
  }
  return out;
}
function resolve(base: string, target: string) {
  const parts = (
    target.startsWith("/") ? target.slice(1) : base + target
  ).split("/");
  const stack: string[] = [];
  for (const p of parts)
    if (p === "..") stack.pop();
    else if (p && p !== ".") stack.push(p);
  return stack.join("/");
}
function relationships(xml: string | undefined, base: string) {
  const map = new Map<string, { type: string; target: string }>();
  for (const t of tokens(xml ?? ""))
    if ("tag" in t && t.tag === "Relationship" && !t.close) {
      const id = attr(t.attrs, "Id"),
        target = attr(t.attrs, "Target");
      if (id && target && attr(t.attrs, "TargetMode") !== "External")
        map.set(id, {
          type: attr(t.attrs, "Type") ?? "",
          target: resolve(base, target),
        });
    }
  return map;
}
function pptx(files: Record<string, string>) {
  const rels = relationships(files["ppt/_rels/presentation.xml.rels"], "ppt/");
  const slides: string[] = [];
  for (const t of tokens(files["ppt/presentation.xml"] ?? ""))
    if ("tag" in t && t.tag === "p:sldId" && !t.close) {
      const target = rels.get(attr(t.attrs, "r:id") ?? "")?.target;
      if (target && files[target] !== undefined) slides.push(target);
    }
  const lines: string[] = [];
  const refs: { label: string }[] = [];
  slides.forEach((path, n) => {
    const shapes = slideText(files[path], false);
    const heading = shapes.find((s) => s.title)?.text;
    const label = `Slide ${n + 1}`;
    refs.push({ label });
    lines.push(`## ${label}${heading ? `: ${heading}` : ""}`);
    for (const s of shapes) if (s.text !== heading) lines.push(s.text);
    const dir = path.slice(0, path.lastIndexOf("/") + 1);
    const slideRels = relationships(
      files[`${dir}_rels/${path.slice(dir.length)}.rels`],
      dir,
    );
    for (const r of slideRels.values())
      if (r.type.endsWith("/notesSlide") && files[r.target] !== undefined) {
        const notes = slideText(files[r.target], true)
          .map((s) => s.text)
          .join("\n");
        if (notes) lines.push(`Speaker notes (${label}): ${notes}`);
      }
  });
  return { lines, refs };
}

export function extractOffice(name: string, bytes: Uint8Array): Extracted {
  const kind = name.toLowerCase().endsWith(".pptx")
    ? "pptx"
    : name.toLowerCase().endsWith(".docx")
      ? "docx"
      : null;
  if (!kind)
    throw new ExtractionError(
      "Upload a Word (.docx) or PowerPoint (.pptx) file, or paste the content.",
    );
  if (bytes.byteLength > sourceLimits.fileBytes)
    throw new ExtractionError("This file is larger than 10 MB.");
  let unpacked = 0;
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes, {
      filter: (f) => {
        const wanted =
          kind === "docx"
            ? f.name === "word/document.xml"
            : /^ppt\/(presentation\.xml|_rels\/presentation\.xml\.rels|slides\/(_rels\/)?slide\d+\.xml(\.rels)?|notesSlides\/notesSlide\d+\.xml)$/.test(
                f.name,
              );
        if (!wanted) return false;
        unpacked += f.originalSize;
        if (unpacked > sourceLimits.unpackedBytes)
          throw new ExtractionError("This file expands to too much content.");
        return true;
      },
    });
  } catch (e) {
    if (e instanceof ExtractionError) throw e;
    throw new ExtractionError(
      "This file could not be read as a Word or PowerPoint document. Password-protected and older .doc/.ppt files are not supported.",
    );
  }
  const text = new TextDecoder();
  const files = Object.fromEntries(
    Object.entries(entries).map(([k, v]) => [k, text.decode(v)]),
  );
  if (
    kind === "docx"
      ? files["word/document.xml"] === undefined
      : files["ppt/presentation.xml"] === undefined
  )
    throw new ExtractionError(
      `This file is not a ${kind === "docx" ? "Word" : "PowerPoint"} document.`,
    );
  const { lines, refs } =
    kind === "docx" ? docx(files["word/document.xml"]) : pptx(files);
  const full = lines.join("\n");
  const truncated = full.length > sourceLimits.characters;
  const content = truncated ? full.slice(0, sourceLimits.characters) : full;
  return {
    kind,
    content,
    refs: refs.slice(0, 500),
    usable: hasUsableText(content),
    truncated,
  };
}
// The only check on meaning: something other than whitespace and slide labels remains.
export const hasUsableText = (content: string) =>
  content.split("\n").some((line) => {
    const text = line.trim();
    return text.length > 0 && !/^## Slide \d+$/.test(text);
  });
