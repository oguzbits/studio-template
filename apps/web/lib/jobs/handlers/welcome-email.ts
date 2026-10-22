import 'server-only';

import { createElement } from 'react';

import { z } from 'zod';

import appConfig from '~/config/app.config';
import { sendEmail } from '~/lib/email/send-email';
import { WelcomeEmail } from '~/lib/email/templates/welcome';

import type { JobHandler } from '../registry';
import { loadUserEmail } from './load-user-email';

const PayloadSchema = z.object({ user_id: z.guid() });

export const welcomeEmail: JobHandler = async (payload) => {
  const { user_id: userId } = PayloadSchema.parse(payload);
  const email = await loadUserEmail(userId);

  // user deleted (or no email address): nothing to send
  if (!email) {
    return;
  }

  await sendEmail({
    to: email,
    subject: `Welcome to ${appConfig.name}`,
    react: createElement(WelcomeEmail),
    idempotencyKey: `welcome:${userId}`,
  });
};
