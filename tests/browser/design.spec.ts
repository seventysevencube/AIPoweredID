import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { workflowFields } from "../../src/workflow-model";
test("Analysis acceptance, canonical learning gate and editable Design drafts preserve autosave", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("design@example.test");
  await page.getByRole("button", { name: "Send code", exact: true }).click();
  const inbox = await (await page.request.get("/api/local-inbox")).json();
  await page
    .getByLabel("Sign-in code", { exact: true })
    .fill(inbox["design@example.test"].code);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();
  const id = randomUUID();
  expect(
    (
      await page.request.post("/api/projects", {
        headers: { Origin: "http://127.0.0.1:5173" },
        data: {
          project_id: id,
          operation_id: randomUUID(),
          title: "Design browser check",
        },
      })
    ).status(),
  ).toBe(201);
  await page.goto(`/#/projects/${id}/analysis-brief`);
  await expect(
    page.getByRole("button", { name: "Generate Analysis brief", exact: true }),
  ).toBeDisabled();
  const data = {
    answers: Object.fromEntries(
      workflowFields["analysis-brief"].map(([key]) => [
        key,
        { text: `Reported ${key}; needs designer review.`, status: "provided" },
      ]),
    ),
    items: [],
  };
  expect(
    (
      await page.request.put(`/api/projects/${id}/analysis-brief`, {
        headers: { Origin: "http://127.0.0.1:5173" },
        data: { operation_id: randomUUID(), base_revision: 1, data },
      })
    ).status(),
  ).toBe(200);
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Accept this version for Design",
      exact: true,
    }),
  ).toBeDisabled();
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
    .getByLabel("Which response will you pursue?", { exact: true })
    .selectOption("learning");
  await expect(
    page.getByRole("button", { name: "Generate Design skeleton", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Which deliverables are needed?", { exact: true })
    .selectOption("e-learning");
  await page
    .getByLabel("Microlearning, course, or a mix?", { exact: true })
    .selectOption("microlearning");
  await page
    .getByLabel("Storyline 360, Rise 360, or both?", { exact: true })
    .selectOption("rise");
  await page.getByRole("button", { name: "Save now", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "3 Learning objectives", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Add objective", exact: true }),
  ).toBeDisabled();
  const learning = {
    answers: {},
    items: [
      {
        id: randomUUID(),
        answers: {
          indicator: {
            text: "Demonstrate the task using the reference",
            status: "provided",
          },
        },
      },
    ],
  };
  await page.request.put(`/api/projects/${id}/learning`, {
    headers: { Origin: "http://127.0.0.1:5173" },
    data: { operation_id: randomUUID(), base_revision: 1, data: learning },
  });
  await page
    .getByRole("link", { name: "2 Performance solution", exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "I confirm these measures for instructional Design.",
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "Save now", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Generate Design skeleton", exact: true }),
  ).toBeEnabled();
  // Never click paid generation in automated browser tests.
  await page
    .getByRole("link", { name: "3 Learning objectives", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add objective", exact: true })
    .click();
  await page
    .getByLabel("Objective ID (LO-1 or EO-1.1)", { exact: true })
    .fill("LO-1");
  await page
    .getByLabel("Measurable objective", { exact: true })
    .fill("Apply the reference to perform the task.");
  await page.getByRole("button", { name: "Save now", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("Measurable objective", { exact: true }),
  ).toHaveValue("Apply the reference to perform the task.");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: "test-results/design-workspace.png",
    fullPage: true,
  });
});
