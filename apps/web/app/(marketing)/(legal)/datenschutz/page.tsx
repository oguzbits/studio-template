import studioConfig from '~/config/studio.config';

import { pageMetadata } from '~/lib/page-metadata';

import { SitePageHeader } from '../../_components/site-page-header';

export const metadata = pageMetadata({
  path: '/datenschutz',
  title: 'Datenschutzerklärung',
});

/**
 * Template, not legal advice: have it reviewed for your actual setup before launch.
 * Sections for optional services appear only when they are enabled via env.
 */
function DatenschutzPage() {
  const { legal } = studioConfig;
  const sentry = Boolean(process.env.SENTRY_DSN);
  const analytics = ['plausible', 'umami'].includes(
    process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? '',
  );

  return (
    <div>
      <SitePageHeader
        title={'Datenschutzerklärung'}
        subtitle={'Wie wir mit deinen Daten umgehen'}
      />

      <div className={'container mx-auto flex max-w-2xl flex-col gap-6 py-8'}>
        <Section title={'Verantwortlicher'}>
          {legal.name}, {legal.street}, {legal.zipCity}. E-Mail: {legal.email}
        </Section>

        <Section title={'Hosting (Vercel)'}>
          Diese Website wird bei Vercel Inc. gehostet. Beim Aufruf werden
          technisch notwendige Daten (z. B. IP-Adresse, Zeitpunkt, aufgerufene
          Seite) in Server-Logfiles verarbeitet. Rechtsgrundlage ist Art. 6 Abs.
          1 lit. f DSGVO (sicherer und effizienter Betrieb).
        </Section>

        <Section title={'Registrierung und Datenbank (Supabase)'}>
          Für Konto und Anmeldung speichern wir deine E-Mail-Adresse und
          Anmeldedaten bei Supabase. Die Datenbank liegt in der EU (Frankfurt).
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          Technisch notwendige Cookies halten deine Anmeldung aufrecht.
        </Section>

        <Section title={'Zahlungen (Stripe)'}>
          Zahlungen wickelt Stripe Payments Europe Ltd. ab. Zahlungsdaten gibst
          du direkt bei Stripe ein; wir erhalten keine vollständigen
          Zahlungsdaten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
        </Section>

        <Section title={'E-Mail-Versand (Resend)'}>
          Systemmails (z. B. Bestätigung, Willkommen, Digest) versenden wir über
          Resend. Dabei werden deine E-Mail-Adresse und der Inhalt der Nachricht
          verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.
        </Section>

        <Section title={'Warteliste'}>
          Wenn du dich in die Warteliste einträgst, speichern wir deine
          E-Mail-Adresse, bis du die Löschung verlangst. Rechtsgrundlage ist
          deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
        </Section>

        {sentry && (
          <Section title={'Fehlererfassung (Sentry)'}>
            Zur Fehleranalyse nutzen wir Sentry. Bei Fehlern können technische
            Daten (z. B. IP-Adresse, Browser, URL) an Sentry übertragen werden.
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
          </Section>
        )}

        {analytics && (
          <Section title={'Reichweitenmessung'}>
            Wir nutzen eine cookielose Reichweitenmessung (Plausible bzw.
            Umami). Es werden keine Cookies gesetzt und keine personenbezogenen
            Profile gebildet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
          </Section>
        )}

        <Section title={'Deine Rechte'}>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung
          der Verarbeitung, Datenübertragbarkeit und Widerspruch. Erteilte
          Einwilligungen kannst du jederzeit widerrufen. Schreibe uns dazu an{' '}
          {legal.email}.
        </Section>

        <Section title={'Beschwerderecht'}>
          Du kannst dich bei einer Datenschutz-Aufsichtsbehörde beschweren,
          insbesondere in dem Mitgliedstaat deines gewöhnlichen Aufenthalts,
          deines Arbeitsplatzes oder des mutmaßlichen Verstoßes.
        </Section>
      </div>
    </div>
  );
}

function Section(props: React.PropsWithChildren<{ title: string }>) {
  return (
    <section className={'flex flex-col gap-2'}>
      <h2 className={'text-xl font-medium'}>{props.title}</h2>
      <p>{props.children}</p>
    </section>
  );
}

export default DatenschutzPage;
