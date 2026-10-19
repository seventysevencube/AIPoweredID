import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { origin, signIn } from "./helpers";

const axe = async (page: import("@playwright/test").Page) =>
  (
    await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze()
  ).violations;

test("AI preferences save; break reminders are off by default, dismissible, and pause without changing work", async ({
  page,
}) => {
  await signIn(page, "pause@example.test");
  const id = randomUUID();
  await page.request.post("/api/projects", {
    headers: origin,
    data: { project_id: id, operation_id: randomUUID(), title: "Pauses" },
  });
  await page.goto(`/#/projects/${id}/preferences`);
  await expect(
    page.getByRole("heading", { name: "AI preferences", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("AI contribution", { exact: true })).toHaveValue(
    "balanced",
  );
  await expect(
    page.getByRole("checkbox", {
      name: "Remind me to take a break while I work on this project",
    }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("Remind me after", { exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Output detail", { exact: true })
    .selectOption("concise");
  await page
    .getByLabel("AI contribution", { exact: true })
    .selectOption("suggest");
  // The next step is shown without generating anything.
  await expect(
    page.getByRole("link", {
      name: "Generate the Analysis brief from your saved Analysis.",
    }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", {
      name: "Remind me to take a break while I work on this project",
    })
    .check();
  await page.getByLabel("Remind me after", { exact: true }).selectOption("30");
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.reload();
  await expect(page.getByLabel("Output detail", { exact: true })).toHaveValue(
    "concise",
  );
  await expect(page.getByLabel("Remind me after", { exact: true })).toHaveValue(
    "30",
  );
  // Simulate 31 minutes of work in this browser session.
  await page.evaluate((project) => {
    sessionStorage.setItem(
      `break-start:${project}`,
      String(Date.now() - 31 * 60000),
    );
  }, id);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Time for a break?" }),
  ).toBeVisible({
    timeout: 15000,
  });
  await page
    .getByRole("button", { name: "Remind me later", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Time for a break?" }),
  ).toHaveCount(0);
  await page.evaluate((project) => {
    sessionStorage.setItem(
      `break-start:${project}`,
      String(Date.now() - 31 * 60000),
    );
  }, id);
  await page.reload();
  await page
    .getByRole("button", { name: "Take a quiet pause", exact: true })
    .click({ timeout: 15000 });
  const dialog = page.getByRole("dialog", { name: "Paused" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("When you return:")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Resume" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Resume" })).toBeFocused();
  expect(await axe(page)).toEqual([]);
  await dialog.getByRole("button", { name: "Resume" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel("Output detail", { exact: true })).toHaveValue(
    "concise",
  );
});
