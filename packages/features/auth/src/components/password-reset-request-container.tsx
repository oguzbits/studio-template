'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';

import { useRequestResetPassword } from '@kit/supabase/hooks/use-request-reset-password';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { alertExtras } from '@kit/ui/alert-extras';
import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { If } from '@kit/ui/if';
import { Input } from '@kit/ui/input';
import { Trans } from '@kit/ui/trans';

import { useCaptchaToken } from '../captcha/client';
import { lazyZodResolver } from '../lazy-zod-resolver';
import { AuthErrorAlert } from './auth-error-alert';

export function PasswordResetRequestContainer(params: {
  redirectPath: string;
}) {
  const t = useTranslations('auth');
  const resetPasswordMutation = useRequestResetPassword();
  const { captchaToken, resetCaptchaToken } = useCaptchaToken();

  const error = resetPasswordMutation.error;
  const success = resetPasswordMutation.data;

  const form = useForm<{ email: string }>({
    resolver: lazyZodResolver(async () => {
      const { z } = await import('zod');

      return z.object({ email: z.string().email() });
    }),
    defaultValues: {
      email: '',
    },
  });

  return (
    <>
      <If condition={success}>
        <Alert className={alertExtras.success}>
          <AlertDescription>
            <Trans i18nKey={'auth.passwordResetSuccessMessage'} />
          </AlertDescription>
        </Alert>
      </If>

      <If condition={!resetPasswordMutation.data}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(({ email }) => {
              const redirectTo = new URL(
                params.redirectPath,
                window.location.origin,
              ).href;

              return resetPasswordMutation
                .mutateAsync({
                  email,
                  redirectTo,
                  captchaToken,
                })
                .catch(() => {
                  resetCaptchaToken();
                });
            })}
            className={'w-full'}
          >
            <div className={'flex flex-col space-y-4'}>
              <AuthErrorAlert error={error} />

              <FormField
                name={'email'}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans i18nKey={'common.emailAddress'} />
                    </FormLabel>

                    <FormControl>
                      <Input
                        className={'h-10'}
                        required
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                className={'h-11 text-base'}
                disabled={resetPasswordMutation.isPending}
                type="submit"
              >
                <Trans i18nKey={'auth.passwordResetLabel'} />
              </Button>
            </div>
          </form>
        </Form>
      </If>
    </>
  );
}
