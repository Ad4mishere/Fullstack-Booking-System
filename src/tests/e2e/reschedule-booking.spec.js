import { test, expect } from '@playwright/test';

test('användaren kan boka om en befintlig bokning', async ({ page }) => {
  // 1. Starta appen och vänta på tider
  await page.goto('/');

  const firstSlot = page.locator('.slot').first();
  await expect(firstSlot).toBeVisible();

  // 2. Boka första tiden
  await firstSlot.click();
  await page.locator('#book-btn').click();

  const statusText = page.locator('#status');
  await expect(statusText).toContainText('Ordernummer');

  // 3. Hämta ordernumret från UI
  const statusMessage = await statusText.textContent();
  const orderNumber = statusMessage.match(/Ordernummer:\s*(\S+)/)[1];

  // 4. Öppna hantera-bokning-modal
  await page.locator('#manage-booking-btn').click();

  const modal = page.locator('#manageBookingModal');
  await expect(modal).toBeVisible();

  // 5. Ange ordernummer och klicka "Boka om"
  await page.locator('#orderNumberInput').fill(orderNumber);
  await page.locator('#rescheduleBookingBtn').click();

  // 6. Välj en ny tid (andra sloten)
  const secondSlot = page.locator('.slot').nth(1);
  await expect(secondSlot).toBeVisible();
  await secondSlot.click();

  // 7. Klicka "Boka vald tid" igen (PUT)
  await page.locator('#book-btn').click();

  // 8. Verifiera bekräftelse
  await expect(statusText).toContainText('Bokningen är ombokad');
});