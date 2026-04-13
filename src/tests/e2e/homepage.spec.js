import { test, expect } from '@playwright/test';

test('frontend laddar och visar bokningssidan', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/bokningssystem/i);
});