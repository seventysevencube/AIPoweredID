import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { origin, signIn } from "./helpers";

test("project home shows each project's stage, updates and next step, and Continue returns to the last page", async ({
  page,
}) => {
  await signIn(page, "home@example.test");
  const id = randomUUID();
  await page.request.post("/api/projects", {
    headers: origin,
    data: { project_id: id, operation_id: randomUUID(), title: "Home check" },
  });
  await page.reload();
  const card = page.locator(".projectcard", { hasText: "Home check" });
  await expect(card).toContainText("Analysis");
  await expect(card).toContainText(
    "Complete 4 core answers needed for Design.",
  );
  await expect(card).toContainText("No pages need an update");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  // Visiting a page makes Continue return there on this device.
  await page.goto(`/#/projects/${id}/sources`);
  await expect(
    page.getByRole("heading", { name: "Sources", exact: true }),
  ).toBeVisible();
  await page.goto("/#/projects");
  await card.getByRole("link", { name: /Continue: Sources/ }).click();
  await expect(
    page.getByRole("heading", { name: "Sources", exact: true }),
  ).toBeVisible();
});
