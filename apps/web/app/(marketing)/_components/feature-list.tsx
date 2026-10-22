import siteConfig from '~/config/site.config';

export function FeatureList() {
  return (
    <section className={'container grid gap-12 pb-24 md:pb-40 lg:grid-cols-12'}>
      <h2 className={'section-heading lg:col-span-5'}>
        What every plan includes
      </h2>

      <ul className={'flex flex-col gap-12 lg:col-span-6 lg:col-start-7'}>
        {siteConfig.features.map((f) => (
          <li key={f.title}>
            <h3 className={'text-2xl font-medium tracking-tight'}>{f.title}</h3>
            <p className={'mt-3 text-lg'}>{f.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
