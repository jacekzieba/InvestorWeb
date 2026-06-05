import { expect, test } from "@playwright/test";

test("shows macOS-style income records and supports fake-sync CRUD", async ({ page }) => {
  await page.goto("/earnings");

  const main = page.getByRole("main");
  await expect(page).toHaveURL(/\/earnings$/);
  await expect(main.getByText("UoP, B2B i obciążenia miesięczne zsynchronizowane z macOS")).toBeVisible();
  await expect(main.getByText("Wynagrodzenie · fake sync")).toBeVisible();
  await expect(main.getByText("Faktura miesięczna · fake sync")).toBeVisible();
  await expect(main.getByText("ZUS · fake sync")).toBeVisible();

  await main.getByRole("button", { name: "Obciążenia" }).click();
  await expect(main.getByText("ZUS · fake sync")).toBeVisible();
  await expect(main.getByText("Wynagrodzenie · fake sync")).toBeHidden();
  await main.getByRole("button", { name: "Wszystko" }).click();

  await main.getByRole("button", { name: "Dodaj wynagrodzenie" }).click();
  await expect(page.getByText("Nowy wpis zarobku")).toBeVisible();
  await page.getByLabel("Rok").fill("2026");
  await page.getByLabel("Miesiąc").selectOption("6");
  await page.getByLabel("Dochód").fill("12345");
  await page.getByPlaceholder("np. Wynagrodzenie, Faktura miesięczna").fill("E2E Salary");
  await page.getByRole("button", { name: "Zapisz" }).click();

  await expect(main.getByText("Zarobek zapisany lokalnie w fake sync.")).toBeVisible();
  await expect(main.getByText("E2E Salary")).toBeVisible();

  await main.getByLabel("Edytuj").first().click();
  await expect(page.getByText("Edycja zarobku")).toBeVisible();
  await page.getByPlaceholder("np. Wynagrodzenie, Faktura miesięczna").fill("E2E Salary edited");
  await page.getByRole("button", { name: "Zapisz" }).click();

  await expect(main.getByText("E2E Salary edited")).toBeVisible();
  await expect(main.getByText("E2E Salary", { exact: true })).toBeHidden();

  await main.getByLabel("Usuń").first().click();
  await expect(main.getByText("Wpis usunięty lokalnie w fake sync.")).toBeVisible();
  await expect(main.getByText("E2E Salary edited")).toBeHidden();
});
