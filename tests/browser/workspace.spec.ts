import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function signIn(page: Page, email = "designer@example.test") {
  await page.goto("/");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Send code", exact: true }).click();
  await expect(page.getByLabel("Sign-in code", { exact: true })).toBeVisible();
  const r = await page.request.get("/api/local-inbox");
  const inbox = await r.json();
  await page
    .getByLabel("Sign-in code", { exact: true })
    .fill(inbox[email].code);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();
}
async function a11y(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
}
test("private workspace, truthful saving, recovery, two-tab conflict, history and linked measures", async ({
  page,
  context,
  browser,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().startsWith("http")) requests.push(r.url());
  });
  await page.goto("/");
  await a11y(page);
  await signIn(page);
  await page
    .getByRole("button", { name: "+ New project", exact: true })
    .click();
  await page
    .getByLabel(
      "What would you like to call this project? A working title is fine.",
    )
    .fill("Milestone browser verification");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Project context and performance gap",
      exact: true,
    }),
  ).toBeVisible();
  await a11y(page);
  const task = page.getByLabel(
    "What workplace task or responsibility does this project address?",
    { exact: true },
  );
  const next = page.getByRole("button", { name: "Continue →", exact: true });
  await expect(next).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Save and return later", exact: true }),
  ).toBeEnabled();
  await task.fill("Review an equipment checklist");
  const desired = page.getByLabel(
    "What should people be able to do, and what does successful performance look like?",
    { exact: true },
  );
  const current = page.getByLabel(
    "What is happening now, and how does it differ from the desired performance?",
    { exact: true },
  );
  await desired.fill("Complete all required checklist steps");
  await current.fill("   ");
  await expect(next).toBeEnabled();
  await current.fill("Some steps are missed");
  await expect(next).toBeEnabled();
  const taskField = page.locator(".field").filter({ has: task });
  await expect(page.getByText("Enter an answer", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("Answer options", { exact: true })).toHaveCount(
    0,
  );
  await expect(taskField.locator("details")).toHaveCount(0);
  await taskField
    .getByRole("checkbox", { name: "Not yet known", exact: true })
    .check();
  await expect(next).toBeEnabled();
  await taskField
    .getByRole("checkbox", { name: "Not yet known", exact: true })
    .uncheck();
  await expect(next).toBeEnabled();
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await page.reload();
  await expect(task).toHaveValue("Review an equipment checklist");
  await page.screenshot({
    path: "test-results/analysis-workspace.png",
    fullPage: true,
  });
  const projectURL = page.url();
  await context.setOffline(true);
  await task.fill("Recover this offline draft");
  await expect(
    page.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible({ timeout: 20000 });
  // Keep the write interrupted while reconnecting: otherwise the online handler
  // can successfully sync before reload, leaving no draft that needs recovery.
  await page.route("**/api/projects/*/context", (route) =>
    route.request().method() === "PUT" ? route.abort() : route.continue(),
  );
  await context.setOffline(false);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Resume your recoverable draft?" }),
  ).toBeVisible();
  await page.unroute("**/api/projects/*/context");
  await page.getByRole("button", { name: "Recover my draft and sync" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await expect(task).toHaveValue("Recover this offline draft");
  const tab = await context.newPage();
  await tab.goto(projectURL);
  await expect(
    tab.getByLabel(
      "What workplace task or responsibility does this project address?",
      { exact: true },
    ),
  ).toHaveValue("Recover this offline draft");
  // Prevent background polling so both edits intentionally share the same base revision.
  await tab.route("**/api/projects/*", (route) =>
    route.request().method() === "GET" ? route.abort() : route.continue(),
  );
  await task.fill("First tab saved");
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await tab
    .getByLabel(
      "What workplace task or responsibility does this project address?",
      { exact: true },
    )
    .fill("Second tab draft");
  await expect(
    tab.getByRole("heading", { name: "Another version was saved" }),
  ).toBeVisible();
  await a11y(tab);
  await tab
    .getByRole("button", { name: "Use my draft as the starting point" })
    .click();
  await expect(
    tab.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await tab.close();
  await page.reload();
  await expect(task).toHaveValue("Second tab draft");
  await page
    .getByRole("button", { name: "Version history", exact: true })
    .click();
  await page.getByText("Revision 1 ·", { exact: false }).click();
  await page
    .getByRole("button", { name: "Restore revision 1", exact: true })
    .click();
  await expect(task).toHaveValue("");
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await expect(next).toBeEnabled(); // Empty required answers do not block section navigation.
  await page
    .getByRole("link", { name: /Evidence and possible causes/ })
    .click();
  await expect(next).toBeEnabled();
  const evidence = page.locator(".field").filter({
    has: page.getByLabel(
      "What information supports your description of the performance gap?",
      { exact: true },
    ),
  });
  await evidence
    .getByRole("checkbox", { name: "Not yet known", exact: true })
    .check();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(
    page.getByRole("heading", {
      name: "Audience and work environment",
      exact: true,
    }),
  ).toBeVisible();
  await expect(next).toBeEnabled();
  const roles = page.getByLabel(
    "Who needs to perform this task? Describe their roles or responsibilities.",
    { exact: true },
  );
  await roles.fill("Maintenance technicians");
  await expect(next).toBeEnabled();
  const audience = page.locator(".field").filter({ has: roles });
  await audience
    .getByRole("checkbox", { name: "Not yet known", exact: true })
    .check();
  await expect(next).toBeEnabled();
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await page.reload();
  await expect(next).toBeEnabled();
  await expect(
    audience.getByRole("checkbox", { name: "Not yet known", exact: true }),
  ).toBeChecked();
  await audience
    .getByRole("checkbox", { name: "Not yet known", exact: true })
    .uncheck();
  await next.click();
  await expect(
    page.getByRole("heading", {
      name: "Stakeholders and project constraints",
      exact: true,
    }),
  ).toBeVisible();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(next).toBeEnabled();
  await page.getByRole("link", { name: /Organizational results/ }).click();
  await page
    .getByRole("button", { name: "+ Add measure", exact: true })
    .click();
  await page
    .getByLabel(
      "What organizational result should improved performance contribute to?",
      { exact: true },
    )
    .fill("Fewer incomplete checks");
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await a11y(page);
  await page.getByRole("link", { name: /Workplace performance/ }).click();
  await page
    .getByRole("button", { name: "+ Add measure", exact: true })
    .click();
  await page
    .getByLabel(
      "What should people do differently or more consistently during their work?",
      { exact: true },
    )
    .fill("Complete each checklist step");
  await page
    .getByRole("checkbox", { name: "Fewer incomplete checks", exact: true })
    .check();
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: /Measure 1: Complete each checklist step/ })
    .click();
  await expect(
    page.getByRole("checkbox", {
      name: "Fewer incomplete checks",
      exact: true,
    }),
  ).toBeChecked();
  await page.getByRole("link", { name: /Organizational results/ }).click();
  await page
    .getByRole("button", { name: /Measure 1: Fewer incomplete checks/ })
    .click();
  await page
    .getByRole("button", { name: "Remove measure", exact: true })
    .click();
  await page.getByRole("link", { name: /Workplace performance/ }).click();
  await page
    .getByRole("button", { name: /Measure 1: Complete each checklist step/ })
    .click();
  await expect(page.getByText(/Needs update: a linked measure/)).toBeVisible();
  await expect(
    page.getByLabel(
      "What should people do differently or more consistently during their work?",
      { exact: true },
    ),
  ).toHaveValue("Complete each checklist step");
  await expect(next).toBeEnabled();
  await next.click();
  await expect(
    page.getByRole("heading", { name: "Evidence of learning", exact: true }),
  ).toBeVisible();
  await expect(next).toHaveCount(0);
  await expect(page.getByText(/Analysis remains a draft/)).toBeVisible();
  const peer = await browser.newContext();
  const peerPage = await peer.newPage();
  await signIn(peerPage, "peer@example.test");
  await expect(
    peerPage.getByRole("heading", {
      name: "Milestone browser verification",
      exact: true,
    }),
  ).toHaveCount(0);
  await peerPage.goto(projectURL);
  await expect(
    peerPage.getByRole("heading", { name: "Project unavailable" }),
  ).toBeVisible();
  await peer.close();
  expect(
    requests.every((url) => new URL(url).origin === "http://127.0.0.1:5173"),
  ).toBe(true);
});

test("keyboard entry and desktop reflow keep controls reachable", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByLabel("Email address", { exact: true })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to main content" }),
  ).toBeFocused();
  const currentRoute = page.url();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  expect(page.url()).toBe(currentRoute);
  await page.getByLabel("Email address", { exact: true }).focus();
  await page.keyboard.type("keyboard@example.test");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Send code", exact: true }),
  ).toBeFocused();
  await page.setViewportSize({ width: 720, height: 500 });
  await a11y(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
