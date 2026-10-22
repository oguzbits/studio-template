import { execFileSync } from 'node:child_process';

import { expect, test } from '@playwright/test';

// The local Supabase container is the test database; no keys needed (local only).
const psql = (sql: string) =>
  execFileSync(
    'docker',
    [
      'exec',
      'supabase_db_studio-template',
      'psql',
      '-U',
      'postgres',
      '-tAc',
      sql,
    ],
    { encoding: 'utf8' },
  ).trim();

test.describe('Contact form', () => {
  // the action allows 3 messages per IP and hour; every run starts with a fresh counter
  test.beforeEach(() => {
    psql(`delete from public.rate_limits where key like 'contact:%'`);
  });

  test('sends a message: success text, row stored, notification job queued', async ({
    page,
  }) => {
    const token = `e2e-${Date.now()}`;
    const message = `Hello <b>${token}</b> äöü`;

    await page.goto('/contact');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Contact' }),
    ).toBeVisible();

    await page.getByLabel('Email').fill('Visitor@Example.com');
    await page.getByLabel('Name (optional)').fill('Visitor');
    await page.getByLabel('Message').fill(message);
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByRole('status')).toContainText('Thanks');

    const row = psql(
      `select id || '|' || email || '|' || name || '|' || message from public.contact_messages where message like '%${token}%'`,
    );
    const [id, email, name, stored] = row.split('|');

    expect(email).toBe('visitor@example.com');
    expect(name).toBe('Visitor');
    expect(stored).toBe(message);
    expect(
      psql(
        `select count(*) from public.jobs where type = 'contact-notification' and payload->>'messageId' = '${id}'`,
      ),
    ).toBe('1');

    psql(`delete from public.contact_messages where id = '${id}'`);
  });
});
