import { test, expect } from '@playwright/test';

test('användaren kan avboka en bokning via ordernummer', async ({ page }) => {
  await page.goto('/');

  // 1. Välj första lediga tid
  const firstSlot = page.locator('.slot').first();
  await expect(firstSlot).toBeVisible();
  await firstSlot.click();

  // 2. Boka tiden
  await page.locator('#book-btn').click();

  // 3. Hämta ordernumret från status-texten
  const statusText = page.locator('#status');
  await expect(statusText).toContainText('Ordernummer');

  const statusContent = await statusText.textContent();
  const orderNumber = statusContent.split('Ordernummer: ')[1];

  // 4. Öppna hantera bokning
  await page.locator('#manage-booking-btn').click();

  // 5. Ange ordernummer
  await page.locator('#orderNumberInput').fill(orderNumber);

  // 6. Klicka Avboka
  await page.locator('#cancelBookingBtn').click();

  // 7. Bekräfta i vit modal
  await page.locator('#confirmCancelYes').click();

  // 8. Verifiera avbokningsmeddelande
  await expect(page.locator('#manageBookingMessage'))
    .toContainText('Bokningen är avbokad');
});
