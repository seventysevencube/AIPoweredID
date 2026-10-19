import { expect, test } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { extractOffice, ExtractionError, sourceLimits } from "../src/extract";

const W =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const docx = (body: string) =>
  zipSync({
    "[Content_Types].xml": strToU8("<Types/>"),
    "word/document.xml": strToU8(
      `<?xml version="1.0"?><w:document ${W}><w:body>${body}</w:body></w:document>`,
    ),
  });
const p = (text: string, style = "") =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}<w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;

test("Word text keeps headings, paragraphs and table rows, and ignores deleted text", () => {
  const out = extractOffice(
    "Routing guide.DOCX",
    docx(
      p("Complaint routing", "Title") +
        p("Billing", "Heading1") +
        `<w:p><w:r><w:t>Send billing &amp; refund issues</w:t></w:r><w:r><w:tab/><w:t>to Billing.</w:t></w:r><w:del><w:r><w:delText>old rule</w:delText></w:r></w:del></w:p>` +
        `<w:tbl><w:tr><w:tc>${p("Issue")}</w:tc><w:tc>${p("Team")}</w:tc></w:tr><w:tr><w:tc>${p("Refund")}</w:tc><w:tc>${p("Billing")}</w:tc></w:tr></w:tbl>` +
        p("&#169; Example Co &#x2014; fictional"),
    ),
  );
  expect(out.kind).toBe("docx");
  expect(out.content).toBe(
    [
      "# Complaint routing",
      "# Billing",
      "Send billing & refund issues to Billing.",
      "Issue | Team",
      "Refund | Billing",
      "© Example Co — fictional",
    ].join("\n"),
  );
  expect(out.refs).toEqual([
    { label: "Heading: Complaint routing" },
    { label: "Heading: Billing" },
  ]);
  expect(out.usable).toBe(true);
  expect(out.truncated).toBe(false);
});

const P = 'xmlns:p="p" xmlns:a="a" xmlns:r="r"';
const shape = (type: string | null, text: string) =>
  `<p:sp>${type ? `<p:nvSpPr><p:nvPr><p:ph type="${type}"/></p:nvPr></p:nvSpPr>` : ""}<p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
const rel = (id: string, type: string, target: string) =>
  `<Relationship Id="${id}" Type="http://x/${type}" Target="${target}"/>`;

test("PowerPoint text follows presentation order with titles and speaker notes", () => {
  const file = zipSync({
    "ppt/presentation.xml": strToU8(
      `<p:presentation ${P}><p:sldIdLst><p:sldId id="256" r:id="rId3"/><p:sldId id="257" r:id="rId2"/></p:sldIdLst></p:presentation>`,
    ),
    "ppt/_rels/presentation.xml.rels": strToU8(
      `<Relationships>${rel("rId2", "slide", "slides/slide1.xml")}${rel("rId3", "slide", "/ppt/slides/slide2.xml")}</Relationships>`,
    ),
    "ppt/slides/slide2.xml": strToU8(
      `<p:sld ${P}><p:cSld><p:spTree>${shape("title", "Why routing matters")}${shape(null, "Wrong routing delays refunds.")}${shape("sldNum", "1")}<p:graphicFrame><a:tbl><a:tr><a:tc><a:txBody><a:p><a:r><a:t>Refund</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl></p:graphicFrame></p:spTree></p:cSld></p:sld>`,
    ),
    "ppt/slides/_rels/slide2.xml.rels": strToU8(
      `<Relationships>${rel("rId1", "notesSlide", "../notesSlides/notesSlide7.xml")}${rel("rId9", "hyperlink", "https://example.test")}</Relationships>`,
    ),
    "ppt/notesSlides/notesSlide7.xml": strToU8(
      `<p:notes ${P}><p:cSld><p:spTree>${shape("sldImg", "")}${shape("body", "Ask learners for an example.")}${shape("sldNum", "1")}</p:spTree></p:cSld></p:notes>`,
    ),
    "ppt/slides/slide1.xml": strToU8(
      `<p:sld ${P}><p:cSld><p:spTree>${shape("ctrTitle", "Practice")}</p:spTree></p:cSld></p:sld>`,
    ),
  });
  const out = extractOffice("Deck.pptx", file);
  expect(out.content).toBe(
    [
      "## Slide 1: Why routing matters",
      "Wrong routing delays refunds.",
      "Refund",
      "Speaker notes (Slide 1): Ask learners for an example.",
      "## Slide 2: Practice",
    ].join("\n"),
  );
  expect(out.refs).toEqual([{ label: "Slide 1" }, { label: "Slide 2" }]);
  expect(out.usable).toBe(true);
});

test("files with no usable text are flagged; unsupported, damaged and oversized files are refused", () => {
  expect(extractOffice("Blank.docx", docx(p("   "))).usable).toBe(false);
  const images = zipSync({
    "ppt/presentation.xml": strToU8(
      `<p:presentation ${P}><p:sldIdLst><p:sldId id="1" r:id="rId1"/></p:sldIdLst></p:presentation>`,
    ),
    "ppt/_rels/presentation.xml.rels": strToU8(
      `<Relationships>${rel("rId1", "slide", "slides/slide1.xml")}</Relationships>`,
    ),
    "ppt/slides/slide1.xml": strToU8(`<p:sld ${P}/>`),
  });
  const pictures = extractOffice("Pictures.pptx", images);
  expect(pictures.content).toBe("## Slide 1");
  expect(pictures.usable).toBe(false);
  for (const [name, bytes] of [
    ["Scan.pdf", new Uint8Array([37, 80, 68, 70])],
    ["Old.doc", new Uint8Array([1])],
    ["Broken.docx", new Uint8Array([1, 2, 3])],
    ["Deck.pptx", docx(p("Not a deck"))],
    ["Huge.docx", new Uint8Array(sourceLimits.fileBytes + 1)],
  ] as const)
    expect(() => extractOffice(name, bytes), name).toThrow(ExtractionError);
  const long = extractOffice(
    "Long.docx",
    docx(p("x".repeat(sourceLimits.characters + 50))),
  );
  expect(long.truncated).toBe(true);
  expect(long.content).toHaveLength(sourceLimits.characters);
});
