import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

// The local Supabase container is the test database; no keys needed (local only).
const container =
  process.env.SUPABASE_DB_CONTAINER ??
  `supabase_db_${
    /^project_id\s*=\s*"([^"]+)"/m.exec(
      readFileSync(
        join(__dirname, '../../../web/supabase/config.toml'),
        'utf8',
      ),
    )?.[1]
  }`;

const psql = (sql: string) =>
  execFileSync(
    'docker',
    ['exec', container, 'psql', '-U', 'postgres', '-tAc', sql],
    { encoding: 'utf8' },
  ).trim();

const clearRateLimit = () =>
  psql(`delete from public.rate_limits where key like 'contact:%'`);

test.describe('Contact form', () => {
  // the action allows 3 messages per IP and hour; every run starts with a fresh counter
  test.beforeEach(clearRateLimit);

  test('sends a message: success text, row stored, notification job queued', async ({
    page,
  }) => {
    const token = `e2e-${Date.now()}`;
    const message = `Hello <b>${token}</b> äöü`;
    const byToken = `message like '%${token}%'`;

    try {
      await page.goto('/contact');
      await expect(
        page.getByRole('heading', { level: 1, name: 'Contact' }),
      ).toBeVisible();

      await page.getByLabel('Email').fill('Visitor@Example.com');
      await page.getByLabel('Name (optional)').fill('Visitor');
      await page.getByLabel('Message').fill(message);
      await page.getByRole('button', { name: 'Send message' }).click();

      await expect(page.getByRole('status')).toContainText('Thanks');

      const [id, email, name, stored] = psql(
        `select id || '|' || email || '|' || name || '|' || message from public.contact_messages where ${byToken}`,
      ).split('|');

      expect(email).toBe('visitor@example.com');
      expect(name).toBe('Visitor');
      expect(stored).toBe(message);
      expect(
        psql(
          `select count(*) from public.jobs where type = 'contact-notification' and payload->>'messageId' = '${id}'`,
        ),
      ).toBe('1');
    } finally {
      // runs on failed assertions too: no rows left behind for the next run
      psql(
        `delete from public.jobs where payload->>'messageId' in (select id::text from public.contact_messages where ${byToken}); delete from public.contact_messages where ${byToken}`,
      );
      clearRateLimit();
    }
  });
});
