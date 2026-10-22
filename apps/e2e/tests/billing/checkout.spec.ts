import { expect, test } from '@playwright/test';

import { AuthPageObject } from '../authentication/auth.po';

// Needs STRIPE_* test keys in apps/web/.env.local and a running
// `stripe listen --forward-to localhost:3000/api/billing/webhook`; see README.
test.describe('Billing smoke', () => {
  test('sign up → Stripe test checkout → protected page', async ({ page }) => {
    test.setTimeout(120_000);
    const auth = new AuthPageObject(page);

    await auth.signUpFlow('/home');

    await page.goto('/home/pro');
    await expect(page).toHaveURL(/\/pricing/);

    await page.click('[data-test="checkout-pro"]');
    await page.waitForURL(/checkout\.stripe\.com/);

    await page.fill('#cardNumber', '4242424242424242');
    await page.fill('#cardExpiry', '12/34');
    await page.fill('#cardCvc', '123');
    await page.fill('#billingName', 'E2E Test');
    await page.click('[data-testid="hosted-payment-submit-button"]');

    await page.waitForURL(/localhost:3000/, { timeout: 60_000 });

    // the entitlement arrives via webhook, so poll the protected page
    await expect(async () => {
      await page.goto('/home/pro');
      await expect(page.locator('[data-test="pro-content"]')).toBeVisible({
        timeout: 2_000,
      });
    }).toPass({ timeout: 30_000 });
  });
});
