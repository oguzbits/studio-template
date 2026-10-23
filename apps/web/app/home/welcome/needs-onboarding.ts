// `onboarded` is a UX flag in user_metadata (the user can write it themselves): never a security check.
// shortcut: one generic step; add product-specific questions/steps per product here and on /home/welcome.
export function needsOnboarding(user: {
  user_metadata?: Record<string, unknown>;
}) {
  return user.user_metadata?.onboarded !== true;
}
