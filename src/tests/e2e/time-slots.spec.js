import { test, expect } from '@playwright/test';

test('tillgängliga tider renderas i schemat', async ({ page }) => {
  await page.goto('/');

  const schedule = page.locator('#schedule');


  await expect(schedule).toBeVisible();

  await expect(schedule).not.toBeEmpty();
});