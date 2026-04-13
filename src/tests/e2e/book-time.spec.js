import { test, expect } from '@playwright/test';

test('användaren kan boka en vald tid', async ({ page }) => {
  await page.goto('/');

  // Försök boka utan att välja tid
  await page.locator('#book-btn').click();
  await expect(page.locator('#status')).toContainText('Välj en tid först');

  // Välj första tillgängliga tid
  const firstSlot = page.locator('.slot').first();
  await expect(firstSlot).toBeVisible();
  await firstSlot.click();

  // Boka vald tid
  await page.locator('#book-btn').click();

  // Bekräftelse visas
  await expect(page.locator('#status')).toContainText('Bokning klar! Ordernummer');
});
