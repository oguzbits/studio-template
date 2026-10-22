/** Decorative app preview built from plain markup. Replace per product. */
export function HeroMock() {
  const bar = 'bg-muted rounded';

  return (
    <div
      aria-hidden
      className={
        'bg-card mx-auto mt-14 w-full max-w-4xl overflow-hidden rounded-xl border shadow-xl'
      }
    >
      <div className={'flex items-center gap-1.5 border-b px-4 py-3'}>
        <span className={'bg-border size-2.5 rounded-full'} />
        <span className={'bg-border size-2.5 rounded-full'} />
        <span className={'bg-border size-2.5 rounded-full'} />
        <span className={`${bar} mx-auto h-5 w-1/3`} />
      </div>

      <div className={'flex h-56 md:h-80'}>
        <div className={'hidden w-44 flex-col gap-3 border-r p-4 sm:flex'}>
          <span className={'bg-accent-brand/20 h-6 rounded'} />
          <span className={`${bar} h-6`} />
          <span className={`${bar} h-6`} />
          <span className={`${bar} h-6`} />
        </div>

        <div className={'flex flex-1 flex-col gap-4 p-4 md:p-6'}>
          <div className={'grid grid-cols-3 gap-3'}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={'flex flex-col gap-2 rounded-lg border p-3'}
              >
                <span className={`${bar} h-2.5 w-1/2`} />
                <span className={'bg-accent-brand/30 h-5 w-2/3 rounded'} />
              </div>
            ))}
          </div>

          <div className={'flex flex-1 flex-col gap-2 rounded-lg border p-3'}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={'flex items-center gap-3'}>
                <span className={'bg-border size-6 shrink-0 rounded-full'} />
                <span className={`${bar} h-3 flex-1`} />
                <span className={`${bar} h-3 w-12`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
