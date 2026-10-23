'use client';

import { routing } from '@kit/i18n/routing';
import { If } from '@kit/ui/if';
import { LanguageSelector } from '@kit/ui/language-selector';
import { LoadingOverlay } from '@kit/ui/loading-overlay';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { usePersonalAccountData } from '../hooks/use-personal-account-data';
import { AccountDangerZone } from './account-danger-zone';
import { UpdateEmailFormContainer } from './email/update-email-form-container';
import { MultiFactorAuthFactorsList } from './mfa/multi-factor-auth-list';
import { UpdatePasswordFormContainer } from './password/update-password-container';
import { UpdateAccountDetailsFormContainer } from './update-account-details-form-container';
import { UpdateAccountImageContainer } from './update-account-image-container';

/**
 * The kit ships a single locale, so the language card is hidden until more are
 * added in `packages/i18n/src/locales.ts`.
 */
const supportsLanguageSelection = routing.locales.length > 1;

export function PersonalAccountSettingsContainer(
  props: React.PropsWithChildren<{
    userId: string;

    features: {
      enableAccountDeletion: boolean;
      enablePasswordUpdate: boolean;
    };

    paths: {
      callback: string;
    };
  }>,
) {
  const user = usePersonalAccountData(props.userId);

  if (!user.data || user.isPending) {
    return <LoadingOverlay fullPage />;
  }

  return (
    <div className={'border-border flex w-full flex-col border-t pb-16'}>
      <SettingsSection
        title={'account.accountImage'}
        description={'account.accountImageDescription'}
      >
        <UpdateAccountImageContainer
          user={{
            pictureUrl: user.data.picture_url,
            id: user.data.id,
          }}
        />
      </SettingsSection>

      <SettingsSection
        title={'account.name'}
        description={'account.nameDescription'}
      >
        <UpdateAccountDetailsFormContainer user={user.data} />
      </SettingsSection>

      <If condition={supportsLanguageSelection}>
        <SettingsSection
          title={'account.language'}
          description={'account.languageDescription'}
        >
          <LanguageSelector locales={routing.locales} />
        </SettingsSection>
      </If>

      <SettingsSection
        title={'account.updateEmailCardTitle'}
        description={'account.updateEmailCardDescription'}
      >
        <UpdateEmailFormContainer callbackPath={props.paths.callback} />
      </SettingsSection>

      <If condition={props.features.enablePasswordUpdate}>
        <SettingsSection
          title={'account.updatePasswordCardTitle'}
          description={'account.updatePasswordCardDescription'}
        >
          <UpdatePasswordFormContainer callbackPath={props.paths.callback} />
        </SettingsSection>
      </If>

      <SettingsSection
        title={'account.multiFactorAuth'}
        description={'account.multiFactorAuthDescription'}
      >
        <MultiFactorAuthFactorsList userId={props.userId} />
      </SettingsSection>

      <If condition={props.features.enableAccountDeletion}>
        <SettingsSection
          title={'account.dangerZone'}
          description={'account.dangerZoneDescription'}
          destructive
        >
          <AccountDangerZone />
        </SettingsSection>
      </If>
    </div>
  );
}

/**
 * One settings area per row: title and grey description on the left, the form
 * on the right, rows split by a quiet rule instead of boxed cards.
 */
function SettingsSection(
  props: React.PropsWithChildren<{
    title: string;
    description: string;
    destructive?: boolean;
  }>,
) {
  return (
    <section
      className={
        'border-border grid gap-4 border-b py-8 lg:grid-cols-[minmax(0,18rem)_minmax(0,36rem)] lg:gap-12'
      }
    >
      <div className={'flex flex-col gap-1'}>
        <h2
          className={cn('text-base font-medium', {
            'text-destructive': props.destructive,
          })}
        >
          <Trans i18nKey={props.title} />
        </h2>

        <p className={'text-muted-foreground text-sm'}>
          <Trans i18nKey={props.description} />
        </p>
      </div>

      <div className={'min-w-0'}>{props.children}</div>
    </section>
  );
}
