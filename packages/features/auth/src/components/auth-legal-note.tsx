import Link from 'next/link';

import { Trans } from '@kit/ui/trans';

export function AuthLegalNote({
  privacyPath,
  termsPath,
}: {
  privacyPath: string;
  termsPath?: string;
}) {
  return (
    <p className={'text-muted-foreground text-center text-sm'}>
      <Trans
        i18nKey={termsPath ? 'auth.legalNoteTerms' : 'auth.legalNote'}
        components={{
          privacy: (chunks: React.ReactNode) => (
            <Link href={privacyPath} className={'underline'}>
              {chunks}
            </Link>
          ),
          terms: (chunks: React.ReactNode) => (
            <Link href={termsPath ?? '#'} className={'underline'}>
              {chunks}
            </Link>
          ),
        }}
      />
    </p>
  );
}
