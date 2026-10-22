// Reine Hilfsfunktionen für `pnpm studio:new` (testbar, ohne I/O).

export function validateName(name) {
  if (!/^[a-z][a-z0-9-]{2,39}$/.test(name ?? '') || name.endsWith('-')) {
    return 'Name muss 3–40 Zeichen lang sein, mit einem Kleinbuchstaben beginnen und nur a–z, 0–9 und - enthalten.';
  }
  return null;
}

// Eigener lokaler Port-Bereich pro Projekt, damit mehrere Supabase-Stacks parallel laufen können.
// Das Template selbst nutzt 553xx; Projekte bekommen 55400–59300.
export function portBase(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 55400 + (hash % 40) * 100;
}

export function rewritePorts(source, base) {
  return source.replace(/\b5532(\d)\b/g, (_, digit) =>
    String(base + 20 + Number(digit)),
  );
}

export function sqlLiteral(value) {
  if (String(value).includes('\u0000')) throw new Error('Nullbyte in SQL-Wert');
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function buildChecklist({
  name,
  siteUrl,
  supabaseRef,
  smtpConfigured,
  stripeConfigured = false,
}) {
  const stripeSteps = [
    `Stripe-Konto für „${name}“ anlegen (Testmodus), Produkt + Preis für \`pro\` erstellen; STRIPE_SECRET_KEY und STRIPE_PRICE_PRO in Vercel (Production) und apps/web/.env.local setzen.`,
    `Stripe-Webhook-Endpoint eintragen: ${siteUrl}/api/billing/webhook – Events: checkout.session.completed, checkout.session.async_payment_succeeded, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted. Signing-Secret als STRIPE_WEBHOOK_SECRET setzen.`,
    'Stripe-Kundenportal im Dashboard aktivieren (Settings → Billing → Customer portal), inkl. Kündigung.',
    'Nach dem Stripe-Env-Update in Vercel neu deployen (Server-Env wird beim Deploy übernommen).',
  ];
  const steps = [
    ...(stripeConfigured ? [] : stripeSteps),
    'Resend: Domain hinzufügen, DNS-Einträge (SPF, DKIM, ggf. DMARC) setzen, verifizieren; EMAIL_FROM auf eine Adresse dieser Domain setzen und den Absender in Supabase → Auth → SMTP anpassen. Bis dahin stellt Resend (Absender onboarding@resend.dev) nur an die Adresse des Resend-Kontos zu: Bestätigungsmails an andere Nutzer kommen nicht an.',
    smtpConfigured
      ? 'Supabase-SMTP ist auf Resend gesetzt (Absender vorläufig); nach Domain-Verifizierung Absender ändern.'
      : 'Supabase-SMTP ist NICHT gesetzt (kein RESEND_API_KEY) – ohne eigenes SMTP sendet Supabase nur wenige Auth-Mails pro Stunde.',
    `Google-Login: in der Google Cloud Console die Redirect-URI https://${supabaseRef}.supabase.co/auth/v1/callback eintragen und Client-ID/Secret in Supabase → Auth → Providers → Google setzen.`,
    `Domain verbinden: Vercel → Project „${name}“ → Domains; danach NEXT_PUBLIC_SITE_URL in Vercel, Supabase Auth (Site URL, Redirect URLs) und das Vault-Secret worker_url auf die neue Domain ändern und neu deployen.`,
    'Rechtliches: LEGAL_*-Werte prüfen (Impressum/Datenschutz), AGB und Widerrufsbelehrung ergänzen, Kündigungsbutton (§ 312k BGB) rechtlich prüfen.',
  ];
  return [
    'Manuelle Schritte:',
    ...steps.map((step, i) => `  ${i + 1}. ${step}`),
  ].join('\n');
}

// Stripe-REST erwartet application/x-www-form-urlencoded mit `a[b]=c` und `a[0]=x`.
export function formEncode(value, prefix) {
  if (value === undefined || value === null) return [];
  if (typeof value !== 'object') {
    return `${prefix}=${encodeURIComponent(String(value))}`;
  }
  const parts = Object.entries(value).flatMap(([key, inner]) =>
    formEncode(inner, prefix ? `${prefix}[${key}]` : key),
  );
  return prefix ? parts : parts.join('&');
}

// studio:new richtet nur Testmodus ein; Live-Umstellung gehört zu studio:launch.
export function stripeKeyError(key) {
  if (/^(sk|rk)_live_/.test(key)) {
    return 'STRIPE_SECRET_KEY ist ein Live-Key. studio:new nutzt nur Testmodus (sk_test_…/rk_test_…).';
  }
  if (!/^(sk|rk)_test_/.test(key)) {
    return 'STRIPE_SECRET_KEY hat kein gültiges Format (sk_test_…/rk_test_…).';
  }
  return null;
}

// Betrag und Intervall im lookup_key: Preisänderung in billing.json → neuer Preis, alter bleibt für Bestandskunden.
export function priceBody(project, key, productId, product) {
  const subscription = product.mode === 'subscription';
  const unitAmount = Math.round(
    (subscription ? product.priceMonthlyEur : product.priceEur) * 100,
  );
  return {
    product: productId,
    currency: 'eur',
    unit_amount: unitAmount,
    recurring: subscription ? { interval: 'month' } : undefined,
    lookup_key: `${project}_${key}_${unitAmount}_${subscription ? 'month' : 'once'}`,
    metadata: { studio_project: project, studio_product: key },
  };
}
