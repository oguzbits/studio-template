// Ohne verifizierte Resend-Domain stellt Resend nur an die Adresse des Resend-Kontos zu (Absender @resend.dev).
export function usesResendTestSender(emailFrom: string | undefined): boolean {
  if (!emailFrom) return true;

  const domain = emailFrom.match(/@([^@\s>]+)>?\s*$/)?.[1];

  return domain?.toLowerCase() === 'resend.dev';
}
