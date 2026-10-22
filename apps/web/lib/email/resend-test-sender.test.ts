import { describe, expect, it } from 'vitest';

import { usesResendTestSender } from './resend-test-sender';

describe('usesResendTestSender', () => {
  it('true für resend.dev mit und ohne Anzeigenamen', () => {
    expect(usesResendTestSender('X <onboarding@resend.dev>')).toBe(true);
    expect(usesResendTestSender('a@resend.dev')).toBe(true);
  });

  it('true bei fehlendem Wert', () => {
    expect(usesResendTestSender(undefined)).toBe(true);
    expect(usesResendTestSender('')).toBe(true);
  });

  it('false für eigene Domain, auch bei ähnlichem Namen', () => {
    expect(usesResendTestSender('X <hi@acme.com>')).toBe(false);
    expect(usesResendTestSender('X <hi@notresend.dev>')).toBe(false);
  });
});
