'use client';

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Button, buttonVariants } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';
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

import { lazyZodResolver } from '../lazy-zod-resolver';
import type { PasswordSignInSchema } from '../schemas/password-sign-in.schema';

export function PasswordSignInForm({
  onSubmit,
  loading,
}: {
  onSubmit: (params: z.infer<typeof PasswordSignInSchema>) => unknown;
  loading: boolean;
}) {
  const t = useTranslations('auth');

  const form = useForm<z.infer<typeof PasswordSignInSchema>>({
    resolver: lazyZodResolver(async () => {
      const { PasswordSignInSchema } =
        await import('../schemas/password-sign-in.schema');

      return PasswordSignInSchema;
    }),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <form
        className={'w-full space-y-2.5'}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name={'email'}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey={'common.emailAddress'} />
              </FormLabel>

              <FormControl>
                <Input
                  className={'h-10'}
                  data-test={'email-input'}
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

        <FormField
          control={form.control}
          name={'password'}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <Trans i18nKey={'common.password'} />
              </FormLabel>

              <FormControl>
                <Input
                  className={'h-10'}
                  required
                  data-test={'password-input'}
                  type="password"
                  placeholder={''}
                  {...field}
                />
              </FormControl>

              <FormMessage />

              <div>
                <Link
                  href={'/auth/password-reset'}
                  prefetch={false}
                  className={cn(
                    buttonVariants({ size: 'sm', variant: 'link' }),
                    'px-0 text-xs underline',
                  )}
                >
                  <Trans i18nKey={'auth.passwordForgottenQuestion'} />
                </Link>
              </div>
            </FormItem>
          )}
        />

        <Button
          data-test="auth-submit-button"
          className={'group h-10 w-full'}
          type="submit"
          disabled={loading}
        >
          <If
            condition={loading}
            fallback={
              <>
                <Trans i18nKey={'auth.signInWithEmail'} />
                <ArrowRight className={'h-4'} />
              </>
            }
          >
            <Trans i18nKey={'auth.signingIn'} />
          </If>
        </Button>
      </form>
    </Form>
  );
}
