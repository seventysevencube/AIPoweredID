import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { zipSync, strToU8 } from "fflate";

const origin = { Origin: "http://127.0.0.1:5173" };
const W =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
const docx = (text: string, heading = "Billing") =>
  Buffer.from(
    zipSync({
      "word/document.xml": strToU8(
        `<w:document ${W}><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${heading}</w:t></w:r></w:p><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body></w:document>`,
      ),
    }),
  );
const mime =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

test("sources: files and pasted text are added without previews, with project-wide rules", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("sources@example.test");
  await page.getByRole("button", { name: "Send code", exact: true }).click();
  const inbox = await (await page.request.get("/api/local-inbox")).json();
  await page
    .getByLabel("Sign-in code", { exact: true })
    .fill(inbox["sources@example.test"].code);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();
  const id = randomUUID();
  expect(
    (
      await page.request.post("/api/projects", {
        headers: origin,
        data: { project_id: id, operation_id: randomUUID(), title: "Sources" },
      })
    ).status(),
  ).toBe(201);
  await page.goto(`/#/projects/${id}/sources`);
  await expect(
    page.getByRole("heading", { name: "Sources", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No sources added yet.")).toBeVisible();
  await page
    .getByLabel("Add Word or PowerPoint files", { exact: true })
    .setInputFiles([
      {
        name: "Routing guide.docx",
        mimeType: mime,
        buffer: docx("Send refunds to Billing."),
      },
      { name: "Scanned.docx", mimeType: mime, buffer: docx("   ", " ") },
      {
        name: "Policy.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.7"),
      },
    ]);
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Routing guide.docx was added." }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({
      hasText: "Policy.pdf: Upload a Word (.docx) or PowerPoint (.pptx) file",
    }),
  ).toBeVisible();
  const list = page.locator(".sourcelist li");
  await expect(list).toHaveCount(2);
  await expect(list.filter({ hasText: "Routing guide.docx" })).toContainText(
    "Text available to AI",
  );
  await expect(list.filter({ hasText: "Scanned.docx" })).toContainText(
    "No usable text",
  );
  // No extracted-text preview anywhere on the page.
  await expect(page.getByText("Send refunds to Billing.")).toHaveCount(0);
  await page.getByText("Paste text instead", { exact: true }).click();
  await page.getByLabel("Source name", { exact: true }).fill("Team notes");
  await page
    .getByLabel("Source text", { exact: true })
    .fill("Outages go to Support.");
  await page
    .getByRole("button", { name: "Add pasted text", exact: true })
    .click();
  await expect(list).toHaveCount(3);
  await page
    .getByRole("button", { name: "Remove Scanned.docx", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm removing Scanned.docx", exact: true })
    .click();
  await expect(list).toHaveCount(2);
  await page
    .getByLabel("Which sources may AI use for content?", { exact: true })
    .selectOption("provided");
  await page
    .getByLabel("When sources disagree, which takes precedence?", {
      exact: true,
    })
    .fill("The routing guide wins over team notes.");
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.reload();
  await expect(
    page.getByLabel("When sources disagree, which takes precedence?", {
      exact: true,
    }),
  ).toHaveValue("The routing guide wins over team notes.");
  await expect(list).toHaveCount(2);
  await page.screenshot({ path: "test-results/sources.png", fullPage: true });
});
