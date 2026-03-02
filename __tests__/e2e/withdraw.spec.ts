import { test, expect } from "@playwright/test";

test.describe("Withdraw page", () => {
  test("submit form shows success block with withdrawal data", async ({
    page,
  }) => {
    await page.goto("/withdraw");

    await page.getByLabel(/сумма/i).fill("100");
    await page.getByLabel(/получатель/i).fill("wallet:0xabc");
    await page.getByRole("checkbox", { name: /подтверждаю вывод/i }).check();
    await page.getByRole("button", { name: /отправить/i }).click();

    await expect(page.getByText(/заявка создана/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("100")).toBeVisible();
  });
});
