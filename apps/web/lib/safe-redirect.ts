import { isInternalPath } from '@kit/shared/utils';

// user-controlled redirect targets (query params) must stay same-origin
export function safeRedirect(
  path: string | null | undefined,
  fallback: string,
) {
  return isInternalPath(path) ? path : fallback;
}
