// Plain object: imported by client components, so no zod here.
type LanguagePriority = 'user' | 'application';

const featuresFlagConfig = {
  enableThemeToggle: getBoolean(
    process.env.NEXT_PUBLIC_ENABLE_THEME_TOGGLE,
    true,
  ),
  // shortcut: unknown values are not rejected, add a check to env-check if a deploy ever sets one
  languagePriority: (process.env.NEXT_PUBLIC_LANGUAGE_PRIORITY ||
    'application') as LanguagePriority,
  enableVersionUpdater: getBoolean(
    process.env.NEXT_PUBLIC_ENABLE_VERSION_UPDATER,
    false,
  ),
};

export default featuresFlagConfig;

function getBoolean(value: unknown, defaultValue: boolean) {
  if (typeof value === 'string') {
    return value === 'true';
  }

  return defaultValue;
}
