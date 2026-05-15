import { expect, test } from "@playwright/test";

test("shows the read-only dashboard shell", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Wartość portfela")).toBeVisible();
  await expect(page.getByText("Portfele")).toBeVisible();
});
