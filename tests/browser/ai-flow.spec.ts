import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { preparedProject, retryAfterFailure, signIn } from "./helpers";

// Uses the local fictional AI stand-in: no network, provider account or charge.
// "[fail once]" makes each task's first attempt fail, exercising Try again.
test("a failed AI step can be tried again at every stage, through to Design", async ({
  page,
}) => {
  await signIn(page, "flow@example.test");
  const id = await preparedProject(
    page,
    `Retry check [fail once] ${randomUUID().slice(0, 8)}`,
  );
  await page.goto(`/#/projects/${id}/analysis-brief`);
  await page
    .getByRole("button", { name: "Generate Analysis brief", exact: true })
    .click();
  await retryAfterFailure(page);
  await expect(
    page.getByLabel("Project and performance gap", { exact: true }),
  ).toHaveValue(/Fictional test draft/);
  await page
    .getByRole("checkbox", {
      name: "I have reviewed this Analysis brief, including its assumptions and open questions.",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", {
      name: "Accept this version for Design",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Performance solution", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Suggest performance solution", exact: true })
    .click();
  await retryAfterFailure(page);
  await page
    .getByLabel("Which response will you pursue?", { exact: true })
    .selectOption("learning");
  await page
    .getByLabel("Which deliverables are needed?", { exact: true })
    .selectOption("e-learning");
  await page
    .getByLabel("Microlearning, course, or a mix?", { exact: true })
    .selectOption("microlearning");
  await page
    .getByLabel("Storyline 360, Rise 360, or both?", { exact: true })
    .selectOption("rise");
  await page
    .getByRole("checkbox", {
      name: "I confirm these measures for instructional Design.",
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "Save now", exact: true }).click();
  await page
    .getByRole("button", { name: "Generate Design skeleton", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Learning objectives", exact: true }),
  ).toBeVisible();
  await retryAfterFailure(page);
  await expect(
    page.getByRole("heading", { name: "LO-1", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "EO-1.1", exact: true }),
  ).toBeVisible();
  // Review status and Needs update: a later Performance solution change flags objectives only.
  const status = page.locator(".sectionstatus");
  await expect(status).toHaveText(/Draft/);
  await page
    .getByRole("button", { name: "Mark as reviewed", exact: true })
    .click();
  await expect(status).toHaveText(/Reviewed/);
  await expect(page.locator(".navstatus.reviewed")).toHaveCount(1);
  await page
    .getByRole("link", { name: "2 Performance solution", exact: true })
    .click();
  await page
    .getByLabel("Rationale, dependencies, and decisions still to review", {
      exact: true,
    })
    .fill("The team lead now reviews routing weekly.");
  await page.getByRole("button", { name: "Save now", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  // Objectives and the Design plan depend on the solution; the others do not.
  await expect(page.locator(".navstatus.needs-update")).toHaveCount(2);
  await expect(
    page.locator(".navitem", { hasText: "Design plan" }).locator(".navstatus"),
  ).toHaveText(/Needs update/);
  await page
    .getByRole("link", { name: "3 Learning objectives", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Needs update", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Performance solution changed.")).toBeVisible();
  await page.screenshot({ path: "test-results/needs-update.png" });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page
    .getByRole("button", {
      name: "Mark as reviewed and up to date",
      exact: true,
    })
    .click();
  await expect(status).toHaveText(/Reviewed/);
  await expect(page.locator(".navstatus.needs-update")).toHaveCount(1);
  // Ask AI to revise one section; the proposal changes nothing until it is used.
  const overview = page.getByLabel("Objective overview and coverage gaps", {
    exact: true,
  });
  await page
    .getByText("Ask AI to revise this section", { exact: true })
    .click();
  await page
    .getByLabel("What should change? (optional)", { exact: true })
    .fill("Add a safety objective");
  await page
    .getByRole("button", { name: "Request AI revision", exact: true })
    .click();
  // The fail-once project also fails the first revision; Try again keeps the request.
  await page
    .getByRole("button", { name: "Try again", exact: true })
    .click({ timeout: 15000 });
  await expect(
    page.getByText("An AI proposal is ready. Your draft has not changed."),
  ).toBeVisible({ timeout: 15000 });
  await expect(overview).toHaveValue(/Fictional test draft/);
  await expect(
    page.getByText("Fictional revision (Add a safety objective) for overview", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use this proposal", exact: true })
    .click();
  await expect(overview).toHaveValue(
    /Fictional revision \(Add a safety objective\)/,
  );
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await expect(status).toHaveText(/Draft/);
  await page
    .getByRole("button", { name: "Version history", exact: true })
    .click();
  // The earlier draft is still in version history.
  await expect(
    page.getByText("Fictional test draft for overview").first(),
  ).toBeAttached();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  // Keeping the current draft dismisses a proposal without changing anything.
  await page
    .getByRole("link", { name: "4 Assessments and alignment", exact: true })
    .click();
  // Assessments depend on the objectives that were just replaced.
  await expect(page.locator(".sectionstatus")).toHaveText(/Needs update/);
  await expect(page.getByText("Learning objectives changed.")).toBeVisible();
  await page
    .getByText("Ask AI to revise this section", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Request AI revision", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Try again", exact: true })
    .click({ timeout: 15000 });
  await page
    .getByRole("button", { name: "Keep my current draft", exact: true })
    .click({ timeout: 15000 });
  await expect(
    page.getByLabel(
      "Assessment approach, completion rules, and alignment gaps",
      {
        exact: true,
      },
    ),
  ).toHaveValue(/Fictional test draft/);
  await expect(page.getByText("An AI proposal is ready.")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByLabel(
      "Assessment approach, completion rules, and alignment gaps",
      {
        exact: true,
      },
    ),
  ).toBeVisible();
  await expect(page.getByText("An AI proposal is ready.")).toHaveCount(0);
});
