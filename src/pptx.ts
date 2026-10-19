import type PptxGenJS from "pptxgenjs";
import { paginate, type ExportDoc } from "./export-model";

// Editable PowerPoint: text boxes only, one slide (plus continuations) per page,
// screen, block group or aid section. Nothing is rewritten.
const W = 13.33;
const dark = "203A39";
const muted = "53685E";
const day = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export function buildPptx(Pptx: typeof PptxGenJS, doc: ExportDoc) {
  const pptx = new Pptx();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = doc.title;
  pptx.company = "AIPoweredID";
  const footer = `${doc.title} · ${doc.status} · Exported ${day(doc.exportedAt)}`;
  const slide = (title: string, subtitle?: string) => {
    const s = pptx.addSlide();
    s.addText(title, {
      x: 0.5,
      y: 0.3,
      w: W - 1,
      h: 0.7,
      fontSize: 24,
      bold: true,
      color: dark,
    });
    if (subtitle)
      s.addText(subtitle, {
        x: 0.5,
        y: 0.95,
        w: W - 1,
        h: 0.4,
        fontSize: 12,
        color: muted,
      });
    s.addText(footer, {
      x: 0.5,
      y: 7.0,
      w: W - 1,
      h: 0.3,
      fontSize: 10,
      color: muted,
    });
    return s;
  };
  const body = (
    s: PptxGenJS.Slide,
    fields: { label: string; text: string }[],
  ) =>
    s.addText(
      fields.flatMap((f) => [
        { text: f.label, options: { bold: true, breakLine: true } },
        { text: f.text, options: { breakLine: true, paraSpaceAfter: 8 } },
      ]),
      {
        x: 0.5,
        y: 1.45,
        w: W - 1,
        h: 5.4,
        fontSize: 13,
        color: dark,
        valign: "top",
        fit: "none",
      },
    );
  const pages = (
    title: string,
    subtitle: string,
    fields: { label: string; text: string }[],
  ) =>
    (fields.length ? paginate(fields, 1600) : [[]]).forEach((page, n) =>
      body(slide(n ? `${title} (continued)` : title, subtitle), page),
    );

  const cover = slide(
    doc.title,
    `${doc.status} · Exported ${day(doc.exportedAt)}`,
  );
  cover.addText(
    [
      { text: `Deliverable: ${doc.deliverable}`, options: { breakLine: true } },
      ...doc.parts.map((p) => ({
        text: `${p.label}: version ${p.version} · ${p.status}`,
        options: { breakLine: true },
      })),
    ],
    {
      x: 0.5,
      y: 1.6,
      w: W - 1,
      h: 5,
      fontSize: 14,
      color: dark,
      valign: "top",
    },
  );
  for (const part of doc.parts) {
    const subtitle = `Version ${part.version} · ${part.status}`;
    if (part.fields.length || !part.items.length)
      pages(part.label, subtitle, part.fields);
    for (const item of part.items)
      pages(
        `${part.label}: ${item.heading}`,
        item.status ? `${subtitle} · Section ${item.status}` : subtitle,
        item.fields,
      );
  }
  pages(
    "Sources",
    "Project sources available to AI",
    doc.sources.length
      ? doc.sources.map((s) => ({
          label: s.name,
          text: `${s.kind === "text" ? "Pasted text" : s.kind.toUpperCase()}${s.usable ? "" : " · No usable text"}`,
        }))
      : [{ label: "None", text: "No sources were added." }],
  );
  pages(
    "Open issues",
    "Unresolved questions, gaps and updates",
    doc.issues.length
      ? doc.issues.map((i) => ({ label: i.where, text: i.text }))
      : [{ label: "None recorded", text: "No open issues were recorded." }],
  );
  if (doc.comments)
    pages(
      "Appendix: reviewer comments",
      "Guest names are not verified",
      doc.comments.length
        ? doc.comments.map((c) => ({
            label: `${c.where} · version ${c.version} · ${c.name} · ${day(c.at)}`,
            text: c.body,
          }))
        : [{ label: "None", text: "No reviewer comments." }],
    );
  return pptx;
}

export async function downloadPptx(doc: ExportDoc) {
  const { default: Pptx } = await import("pptxgenjs");
  const name = doc.title.replace(/[^\w -]+/g, "").trim() || "export";
  await buildPptx(Pptx, doc).writeFile({
    fileName: `${name} - ${doc.status} - ${day(doc.exportedAt)}.pptx`,
  });
}
