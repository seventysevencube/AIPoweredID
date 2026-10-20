import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { preparedProject, signIn, throughDesign } from "./helpers";

// Fictional AI stand-in only: no network, provider account or charge.
test("Development: reviewed Design → sample → accepted treatment → full draft → requested change", async ({
  page,
}) => {
  test.setTimeout(90000);
  await signIn(page, "develop@example.test");
  const id = await preparedProject(page, "Development check");
  await throughDesign(page, id);
  // Development waits for a reviewed Design.
  await page.getByRole("link", { name: "8 Development", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Generate Development sample",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "Design plan", exact: true }),
  ).toBeVisible();
  for (const [n, name] of [
    [2, "Performance solution"],
    [3, "Learning objectives"],
    [4, "Assessments and alignment"],
    [5, "Content and instructional support"],
    [6, "Learning sequence"],
    [7, "Design plan"],
  ] as const) {
    await page.getByRole("link", { name: `${n} ${name}`, exact: true }).click();
    await page
      .getByRole("button", { name: "Mark as reviewed", exact: true })
      .click();
    await expect(page.locator(".sectionstatus")).toHaveText(/Reviewed/);
  }
  await page.getByRole("link", { name: "8 Development", exact: true }).click();
  await page
    .getByRole("button", { name: "Generate Development sample", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open the sample", exact: true })
    .click({ timeout: 15000 });
  const outline = page.getByRole("navigation", { name: "Deliverable outline" });
  await expect(outline.getByRole("button")).toHaveCount(4); // 3 sections + Add section
  await expect(outline.getByRole("button", { name: /LSN-1/ })).toContainText(
    "Sample",
  );
  await expect(outline.getByRole("button", { name: /LSN-2/ })).toContainText(
    "Outline only",
  );
  await expect(
    page.getByLabel("Learner-facing content (exact text)", { exact: true }),
  ).toHaveValue(/Fictional sample content/);
  // The rest waits for the sample's treatment to be accepted.
  await expect(
    page.getByRole("button", { name: "Generate full draft" }),
  ).toHaveCount(0);
  await page
    .getByRole("checkbox", { name: /I accept this presentation and treatment/ })
    .check();
  await page
    .getByRole("button", { name: "Accept treatment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Treatment accepted" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Generate full draft", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Add finished sections to the draft",
      exact: true,
    })
    .click({ timeout: 20000 });
  await expect(outline.getByRole("button", { name: /LSN-2/ })).toContainText(
    "Draft",
  );
  await expect(outline.getByRole("button", { name: /LSN-3/ })).toContainText(
    "Draft",
  );
  await outline.getByRole("button", { name: /LSN-2/ }).click();
  await expect(
    page.getByLabel("Learner-facing content (exact text)", { exact: true }),
  ).toHaveValue(/Fictional section \(no request\) content/);
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(
    "Route a complaint",
  );
  // Request a change: a proposal that replaces the section only when chosen.
  await page.getByText("Request changes", { exact: true }).click();
  await page
    .getByLabel(/What should change\?/)
    .fill("Shorter, with one worked example");
  await page
    .getByRole("button", { name: "Request AI changes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use this proposal", exact: true })
    .click({ timeout: 20000 });
  await expect(
    page.getByLabel("Learner-facing content (exact text)", { exact: true }),
  ).toHaveValue(/Shorter, with one worked example/);
  await page
    .getByRole("button", { name: "Mark section reviewed", exact: true })
    .click();
  await expect(outline.getByRole("button", { name: /LSN-2/ })).toContainText(
    "Reviewed",
  );
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
  await page.screenshot({
    path: "test-results/development.png",
    fullPage: true,
  });
  // Editing the sample asks for the treatment to be accepted again.
  await outline.getByRole("button", { name: /LSN-1/ }).click();
  await page
    .getByLabel("Learner-facing content (exact text)", { exact: true })
    .fill("Edited sample text.");
  await expect(
    page.getByRole("heading", {
      name: "Accept the sample's treatment",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(outline.getByRole("button", { name: /LSN-2/ })).toContainText(
    "Reviewed",
  );

  // Exports: saved content, labelled Draft until the handoff checks pass and are confirmed.
  await page
    .getByRole("link", { name: "Share and export", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Status: Draft" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Not yet: Every Development section is written and reviewed",
    ),
  ).toBeVisible();
  await expect(
    page
      .getByRole("group", { name: "What to include" })
      .getByRole("checkbox", { name: "Development", exact: true }),
  ).toBeChecked();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Download editable PowerPoint (.pptx)",
      exact: true,
    })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(
    /^Development check - Draft - \d{4}-\d{2}-\d{2}\.pptx$/,
  );
  const { unzipSync, strFromU8 } = await import("fflate");
  const { readFile } = await import("node:fs/promises");
  const unpacked = unzipSync(
    new Uint8Array(await readFile((await file.path())!)),
  );
  const slides = Object.keys(unpacked).filter((f) =>
    /^ppt\/slides\/slide\d+\.xml$/.test(f),
  );
  expect(slides.length).toBeGreaterThan(8);
  expect(slides.map((f) => strFromU8(unpacked[f])).join("")).toContain(
    "Development: LSN-2 Route a complaint",
  );
  const popup = page.waitForEvent("popup");
  await page
    .getByRole("link", { name: "Open print-ready PDF (new tab)" })
    .click();
  const print = await popup;
  await expect(
    print.getByRole("heading", { name: "Development check", level: 1 }),
  ).toBeVisible();
  await expect(
    print.getByRole("heading", { name: "LSN-2 Route a complaint" }),
  ).toBeVisible();
  await expect(
    print.getByRole("heading", { name: "Open issues", level: 2 }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page: print })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await print.emulateMedia({ media: "print" });
  await print.screenshot({
    path: "test-results/print-view.png",
    fullPage: true,
  });
});
