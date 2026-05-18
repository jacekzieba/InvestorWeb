import { expect, test } from "@playwright/test";

test("redirects protected routes to login with the next parameter", async ({ page }) => {
  await page.goto("/import");

  await expect(page).toHaveURL(/\/login\?next=%2Fimport$/);
  await expect(page.getByRole("heading", { name: "Logowanie" })).toBeVisible();
});

test("keeps public market data routes outside the auth gate", async ({ request }) => {
  const response = await request.get("/api/market-data/fx?code=PLN");

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("application/json");
  await expect(response.json()).resolves.toMatchObject({
    data: {
      provider: "nbp",
      base: "PLN",
      quote: "PLN",
      rate: 1,
    },
  });
});
