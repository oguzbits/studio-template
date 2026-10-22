import { render } from 'react-email';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendEmail, maybeSingle } = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock('@kit/supabase/server-admin-client', () => ({
  getSupabaseServerAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));
vi.mock('~/lib/email/send-email', () => ({ sendEmail }));

const { contactNotification } = await import('./contact-notification');

const id = '00000000-0000-0000-0000-00000000000a';
const ctx = { now: new Date() };
const row = { id, email: 'anna@example.com', name: 'Anna', message: 'Hello' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('ADMIN_EMAILS', ' boss@example.com , other@example.com');
  maybeSingle.mockResolvedValue({ data: row, error: null });
  sendEmail.mockResolvedValue({ id: 'email_1' });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('contact-notification', () => {
  it('mails the first admin with the sender as reply-to and an idempotency key', async () => {
    await contactNotification({ messageId: id }, ctx);

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'boss@example.com',
        replyTo: 'anna@example.com',
        idempotencyKey: `contact:${id}`,
      }),
    );
  });

  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['only commas', ' , '],
  ])(
    'ends without error and without mail when ADMIN_EMAILS is %s',
    async (_, value) => {
      vi.stubEnv('ADMIN_EMAILS', value as string);

      await expect(
        contactNotification({ messageId: id }, ctx),
      ).resolves.toBeUndefined();
      expect(sendEmail).not.toHaveBeenCalled();
    },
  );

  it('renders user text as escaped text, never as markup', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        ...row,
        name: '<b>Anna</b>',
        message: '<script>x</script>\nZweite Zeile äöü',
      },
      error: null,
    });

    await contactNotification({ messageId: id }, ctx);

    const html = await render(sendEmail.mock.calls[0]![0].react);

    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>Anna</b>');
    expect(html).toContain('äöü');
  });

  it('ends without mail when the message no longer exists', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(
      contactNotification({ messageId: id }, ctx),
    ).resolves.toBeUndefined();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('throws on a database error so the job retries', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'db' } });

    await expect(contactNotification({ messageId: id }, ctx)).rejects.toThrow();
  });

  it('rejects an invalid payload', async () => {
    await expect(contactNotification({}, ctx)).rejects.toThrow();
    await expect(
      contactNotification({ messageId: 'nope' }, ctx),
    ).rejects.toThrow();
  });
});
