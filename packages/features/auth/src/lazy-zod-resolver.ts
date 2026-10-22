import type { FieldValues, Resolver } from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * react-hook-form resolver that loads zod (~46 KB gzip) on the first validation instead of with the page.
 * `loadSchema` must create its schema inside the callback (dynamic import), so it runs after the jitless config.
 *
 * shortcut: the first submit/validation waits for the zod chunk (a few ms on a warm cache), drop it if zod is
 * needed on the page anyway.
 */
export function lazyZodResolver<T extends FieldValues>(
  loadSchema: () => Promise<ZodType>,
): Resolver<T> {
  return async (values, context, options) => {
    const [{ z }, { zodResolver }] = await Promise.all([
      import('zod'),
      import('@hookform/resolvers/zod'),
    ]);

    // skips zod's `new Function` probe, which the CSP (no 'unsafe-eval') reports as a violation
    z.config({ jitless: true });

    const schema = await loadSchema();

    return zodResolver(schema as never)(
      values,
      context,
      options as never,
    ) as ReturnType<Resolver<T>>;
  };
}
