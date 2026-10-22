import 'server-only';

import { billingCancel } from './handlers/billing-cancel';
import { dailyDigest } from './handlers/daily-digest';
import { welcomeEmail } from './handlers/welcome-email';

/** Handlers validate their own payload; a throw makes the job retry. */
export type JobHandler = (
  payload: unknown,
  ctx: { now: Date },
) => Promise<void>;

export const handlers = new Map<string, JobHandler>([
  ['welcome-email', welcomeEmail],
  ['daily-digest', dailyDigest],
  ['billing-cancel', billingCancel],
]);
