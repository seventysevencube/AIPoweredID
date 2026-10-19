import { test, expect } from "@playwright/test";
test("simultaneous tabs keep independent recovery entries", async ({
  page,
  context,
}) => {
  // Use a third fixture email; no real mail and no minute-long delay between tests.
  await page.goto("/");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("tabs@example.test");
  await page.getByRole("button", { name: "Send code", exact: true }).click();
  const inbox = await (await page.request.get("/api/local-inbox")).json();
  await page
    .getByLabel("Sign-in code", { exact: true })
    .fill(inbox["tabs@example.test"].code);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page
    .getByRole("button", { name: "+ New project", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  const task = page.getByLabel(
    "What workplace task or responsibility does this project address?",
    { exact: true },
  );
  await expect(task).toBeVisible();
  const tab = await context.newPage();
  await tab.goto(page.url());
  const other = tab.getByLabel(
    "What workplace task or responsibility does this project address?",
    { exact: true },
  );
  await expect(other).toBeVisible();
  await tab.route("**/api/projects/*/context", (r) => r.abort());
  await other.fill("An unsynced draft in the second tab");
  await expect(
    tab.getByRole("status").filter({ hasText: "Saved on this device" }),
  ).toBeVisible();
  await task.fill("A confirmed save in the first tab");
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible();
  const retained = await tab.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("aipoweredid-recovery");
      r.onsuccess = () => resolve(r.result);
      r.onerror = reject;
    });
    return new Promise<any[]>((resolve, reject) => {
      const r = db.transaction("pending").objectStore("pending").getAll();
      r.onsuccess = () => resolve(r.result);
      r.onerror = reject;
    });
  });
  expect(
    retained.some(
      (r) =>
        r.data.answers.task?.text === "An unsynced draft in the second tab",
    ),
  ).toBe(true);
  await tab.unroute("**/api/projects/*/context");
  await tab.getByRole("button", { name: "Retry synchronization" }).click();
  await expect(
    tab.getByRole("heading", { name: "Another version was saved" }),
  ).toBeVisible();
  await tab.close();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Resume your recoverable draft?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Recover my draft and sync" }).click();
  await expect(
    page.getByRole("heading", { name: "Another version was saved" }),
  ).toBeVisible();
});
