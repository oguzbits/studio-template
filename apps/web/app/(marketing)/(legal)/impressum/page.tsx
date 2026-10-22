import studioConfig from '~/config/studio.config';

import { SitePageHeader } from '../../_components/site-page-header';

export const metadata = { title: 'Impressum' };

function ImpressumPage() {
  const { legal } = studioConfig;

  return (
    <div>
      <SitePageHeader title={'Impressum'} subtitle={'Angaben gemäß § 5 DDG'} />

      <div className={'container mx-auto flex max-w-2xl flex-col gap-6 py-8'}>
        <p>
          {legal.name}
          <br />
          {legal.street}
          <br />
          {legal.zipCity}
        </p>

        <p>
          <b>Kontakt</b>
          <br />
          Telefon: {legal.phone}
          <br />
          E-Mail: {legal.email}
        </p>

        {legal.vatId && (
          <p>
            <b>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG</b>
            <br />
            {legal.vatId}
          </p>
        )}

        <p>
          <b>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</b>
          <br />
          {legal.responsible}, Anschrift wie oben
        </p>
      </div>
    </div>
  );
}

export default ImpressumPage;
