import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

// Shared steps for browser tests that use the local fictional AI stand-in.
export const origin = { Origin: "http://127.0.0.1:5173" };
export async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Send code", exact: true }).click();
  const inbox = await (await page.request.get("/api/local-inbox")).json();
  await page
    .getByLabel("Sign-in code", { exact: true })
    .fill(inbox[email].code);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();
}
export async function put(
  page: Page,
  id: string,
  section: string,
  data: unknown,
) {
  const r = await page.request.put(`/api/projects/${id}/${section}`, {
    headers: origin,
    data: { operation_id: randomUUID(), base_revision: 1, data },
  });
  expect(r.status()).toBe(200);
}
export const provided = (text: string) => ({ text, status: "provided" });
export async function retryAfterFailure(page: Page) {
  await expect(
    page.getByText("AI could not finish this draft.", { exact: false }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page
    .getByRole("button", { name: "Open the AI draft", exact: true })
    .click({ timeout: 15000 });
}
export async function preparedProject(page: Page, title: string) {
  const id = randomUUID();
  expect(
    (
      await page.request.post("/api/projects", {
        headers: origin,
        data: { project_id: id, operation_id: randomUUID(), title },
      })
    ).status(),
  ).toBe(201);
  await put(page, id, "context", {
    answers: {
      title: provided(title),
      task: provided("Route a customer complaint to the right team"),
      desired: provided("Every complaint routed correctly within one day"),
      current: provided("About a third are routed to the wrong team"),
    },
    items: [],
  });
  await put(page, id, "audience", {
    answers: { roles: provided("New customer service agents") },
    items: [],
  });
  await put(page, id, "learning", {
    answers: {},
    items: [
      {
        id: randomUUID(),
        answers: {
          indicator: provided("Route five practice complaints correctly"),
        },
      },
    ],
  });
  return id;
}

// Generates and opens AI drafts from the Analysis brief through the Design skeleton.
export async function throughDesign(page: Page, id: string) {
  await page.goto(`/#/projects/${id}/analysis-brief`);
  await page
    .getByRole("button", { name: "Generate Analysis brief", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open the AI draft", exact: true })
    .click({ timeout: 15000 });
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
  await page
    .getByRole("button", { name: "Suggest performance solution", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open the AI draft", exact: true })
    .click({ timeout: 15000 });
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
  await page
    .getByRole("button", { name: "Open the AI draft", exact: true })
    .click({ timeout: 15000 });
  await expect(
    page.getByRole("heading", { name: "LO-1", exact: true }),
  ).toBeVisible();
}
