import 'server-only';

import type { ReactElement } from 'react';

import { render } from 'react-email';
import { Resend } from 'resend';

import { getLogger } from '@kit/shared/logger';

export class EmailError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'EmailError';
  }
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
  idempotencyKey?: string;
}): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // never drop mail silently in production
    if (process.env.NODE_ENV === 'production') {
      throw new EmailError('Please provide the variable RESEND_API_KEY');
    }

    (await getLogger()).info(
      { to: params.to, subject: params.subject },
      'RESEND_API_KEY not set, email not sent',
    );

    return { id: 'dev' };
  }

  const from = process.env.EMAIL_FROM;

  if (!from) {
    throw new EmailError('Please provide the variable EMAIL_FROM');
  }

  // rendered here so the SDK needs no optional react-email peer
  const html = await render(params.react);

  const { data, error } = await new Resend(apiKey).emails.send(
    {
      from,
      to: params.to,
      subject: params.subject,
      html,
      replyTo: params.replyTo,
    },
    params.idempotencyKey
      ? { idempotencyKey: params.idempotencyKey }
      : undefined,
  );

  if (error || !data) {
    throw new EmailError(`Resend failed: ${error?.message ?? 'no data'}`, {
      cause: error,
    });
  }

  return { id: data.id };
}
