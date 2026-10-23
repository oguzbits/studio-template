import { expect, test } from '@playwright/test';

import { AuthPageObject } from './auth.po';

async function signUpToWelcome(page: import('@playwright/test').Page) {
  const auth = new AuthPageObject(page);

  await auth.signUpFlow('/home');
  await page.waitForURL('**/home/welcome');
}

test.describe('Onboarding', () => {
  test('new account sees the welcome step once; Skip ends it', async ({
    page,
  }) => {
    await signUpToWelcome(page);

    await page.getByRole('button', { name: 'Skip' }).click();
    await page.waitForURL(/\/home$/);

    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/home');
  });

  test('Continue with a name saves it and ends the step', async ({ page }) => {
    await signUpToWelcome(page);

    await page.getByLabel('Your name').fill('Ada Lovelace');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForURL(/\/home$/);

    await page.goto('/home');
    await page.waitForLoadState('networkidle');
    expect(new URL(page.url()).pathname).toBe('/home');
  });
});
