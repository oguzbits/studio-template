import { createElement } from 'react';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

vi.mock('@kit/shared/logger', () => ({
  getLogger: async () => ({ info: vi.fn(), warn: vi.fn() }),
}));

import { EmailError, sendEmail } from './send-email';

const mail = {
  to: 'a@example.com',
  subject: 'Hi',
  react: createElement('p', null, 'hello'),
};

describe('sendEmail', () => {
  beforeEach(() => {
    send.mockReset();
    vi.unstubAllEnvs();
    vi.stubEnv('EMAIL_FROM', 'Studio <hi@example.com>');
  });

  it('does not call Resend without a key outside production', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('NODE_ENV', 'test');

    await expect(sendEmail(mail)).resolves.toEqual({ id: 'dev' });
    expect(send).not.toHaveBeenCalled();
  });

  it('throws EmailError without a key in production', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('NODE_ENV', 'production');

    await expect(sendEmail(mail)).rejects.toBeInstanceOf(EmailError);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends rendered html with the idempotency key', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    send.mockResolvedValue({ data: { id: 'msg_1' }, error: null });

    await expect(sendEmail({ ...mail, idempotencyKey: 'k1' })).resolves.toEqual(
      { id: 'msg_1' },
    );
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Studio <hi@example.com>',
        to: 'a@example.com',
        html: expect.stringContaining('hello'),
      }),
      { idempotencyKey: 'k1' },
    );
  });

  it('wraps a Resend error in EmailError', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    send.mockResolvedValue({ data: null, error: { message: 'boom' } });

    await expect(sendEmail(mail)).rejects.toThrow(EmailError);
  });
});
