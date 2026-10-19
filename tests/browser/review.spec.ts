import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { origin, put, signIn } from "./helpers";
import { workflowFields } from "../../src/workflow-model";

const axe = async (page: import("@playwright/test").Page) =>
  (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze()
  ).violations;

test("guest review: a fixed copy, unverified names, comments back to the designer, and turning a link off", async ({
  page,
  browser,
}) => {
  await signIn(page, "share@example.test");
  const id = randomUUID();
  await page.request.post("/api/projects", {
    headers: origin,
    data: { project_id: id, operation_id: randomUUID(), title: "Shared work" },
  });
  await page.goto(`/#/projects/${id}/analysis-brief`);
  await expect(
    page.getByRole("heading", { name: "Analysis brief", exact: true }),
  ).toBeVisible();
  await put(page, id, "analysis-brief", {
    answers: {
      ...Object.fromEntries(
        workflowFields["analysis-brief"].map(([key]) => [
          key,
          { text: `Shared ${key} text.`, status: "provided" },
        ]),
      ),
      _job: { text: "private bookkeeping", status: "provided" },
    },
    items: [],
  });
  await page.goto(`/#/projects/${id}/sharing`);
  await page
    .getByRole("checkbox", { name: "Analysis brief", exact: true })
    .check();
  await page
    .getByRole("button", { name: "Create review link", exact: true })
    .click();
  const linkField = page.getByLabel("Review link", { exact: true });
  const url = await linkField.inputValue();
  expect(url).toMatch(/#\/review\/[A-Za-z0-9_-]{43}$/);
  expect(await axe(page)).toEqual([]);

  // The guest has no account or session.
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  await guest.goto(url);
  await expect(
    guest.getByRole("heading", { name: "Shared work", exact: true }),
  ).toBeVisible();
  await expect(guest.getByText("Shared gap text.")).toBeVisible();
  await expect(guest.getByText("private bookkeeping")).toHaveCount(0);
  await guest
    .getByRole("button", { name: "Comment on Analysis brief", exact: true })
    .click();
  await guest
    .getByLabel("Your name", { exact: true })
    .fill("Sam <b>Reviewer</b>");
  await guest
    .getByLabel("Comment on Analysis brief", { exact: true })
    .fill("Please add the evidence source. <script>alert(1)</script>");
  await guest
    .getByRole("button", { name: "Post comment", exact: true })
    .click();
  await expect(
    guest.getByRole("status").filter({ hasText: "Comment posted" }),
  ).toBeVisible();
  // Comments are shown as plain text, never as markup.
  await expect(
    guest.getByText("<script>alert(1)</script>", { exact: false }),
  ).toBeVisible();
  await expect(
    guest.getByText("Sam <b>Reviewer</b> (name not verified)", {
      exact: false,
    }),
  ).toBeVisible();
  expect(await axe(guest)).toEqual([]);
  await guest.screenshot({
    path: "test-results/guest-review.png",
    fullPage: true,
  });

  // The designer sees the comment with its version reference, then turns the link off.
  await page.reload();
  await page.getByText("Comments on this copy (1)").click();
  await expect(
    page.getByText("Please add the evidence source.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("Analysis brief · version 2", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Turn off this link", exact: true })
    .click();
  await expect(page.getByText(/Turned off/)).toBeVisible();
  await guest.reload();
  await expect(
    guest.getByRole("heading", { name: "Review unavailable" }),
  ).toBeVisible();
  await guestContext.close();
});
