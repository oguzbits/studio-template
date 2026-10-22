'use client';

import { z } from 'zod';

// Skips zod's `new Function` probe, which the CSP (no 'unsafe-eval') reports as a violation.
// Lives here, not in instrumentation-client.ts: that file runs on every page and would put zod (~108 KB) into the
// first load of the marketing pages. Wrap every client route that validates with zod (auth, app, admin).
z.config({ jitless: true });

export function ZodJitless(props: React.PropsWithChildren) {
  return props.children;
}
