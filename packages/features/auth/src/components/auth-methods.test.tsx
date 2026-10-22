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
  it('all three: oauth, divider and a tablist with two tabs', () => {
    const html = render({ password, magicLink, oauth });

    expect(html).toContain('oauth-block');
    expect(count(html, /role="separator"/g)).toBe(1);
    expect(count(html, /role="tablist"/g)).toBe(1);
    expect(count(html, /role="tab"/g)).toBe(2);
  });

  it('password only: the form directly, no tablist, no divider', () => {
    const html = render({ password, magicLink: null, oauth: null });

    expect(html).toContain('pw-form');
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('role="separator"');
  });

  it('oauth only: no divider, no tablist', () => {
    const html = render({ password: null, magicLink: null, oauth });

    expect(html).toContain('oauth-block');
    expect(html).not.toContain('role="separator"');
    expect(html).not.toContain('role="tablist"');
  });

  it('password and magic link without oauth: tablist, no divider', () => {
    const html = render({ password, magicLink, oauth: null });

    expect(count(html, /role="tablist"/g)).toBe(1);
    expect(html).not.toContain('role="separator"');
  });
});
