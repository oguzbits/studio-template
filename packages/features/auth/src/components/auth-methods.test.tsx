import { renderToStaticMarkup } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

import messages from '../../../../../apps/web/i18n/messages/en/auth.json';
import { AuthMethods } from './auth-methods';

function render(props: Parameters<typeof AuthMethods>[0]) {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale="en" messages={{ auth: messages }}>
      <AuthMethods {...props} />
    </NextIntlClientProvider>,
  );
}

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;
const password = <form data-test="pw-form" />;
const magicLink = <form data-test="ml-form" />;
const oauth = <div data-test="oauth-block" />;

describe('AuthMethods', () => {
  it('all three: oauth, divider, the password form and a switch to the magic link', () => {
    const html = render({ password, magicLink, oauth });

    expect(html).toContain('oauth-block');
    expect(count(html, /role="separator"/g)).toBe(1);
    expect(html).toContain('pw-form');
    // one email form at a time: the magic link sits behind the switch
    expect(html).not.toContain('ml-form');
    expect(html).toContain('auth-method-switch');
    expect(html).not.toContain('role="tablist"');
  });

  it('password only: the form directly, no switch, no divider', () => {
    const html = render({ password, magicLink: null, oauth: null });

    expect(html).toContain('pw-form');
    expect(html).not.toContain('auth-method-switch');
    expect(html).not.toContain('role="separator"');
  });

  it('magic link only: the form directly, no switch', () => {
    const html = render({ password: null, magicLink, oauth: null });

    expect(html).toContain('ml-form');
    expect(html).not.toContain('auth-method-switch');
  });

  it('oauth only: no divider, no switch', () => {
    const html = render({ password: null, magicLink: null, oauth });

    expect(html).toContain('oauth-block');
    expect(html).not.toContain('role="separator"');
    expect(html).not.toContain('auth-method-switch');
  });

  it('password and magic link without oauth: switch, no divider', () => {
    const html = render({ password, magicLink, oauth: null });

    expect(html).toContain('auth-method-switch');
    expect(html).not.toContain('role="separator"');
  });
});
