import { WaitlistForm } from './waitlist-form';

// The one centred moment of the page, on a flat field one tone step from the ground.
export function CtaBand() {
  return (
    <section className={'bg-muted py-24 md:py-32'}>
      <div className={'container flex flex-col items-center text-center'}>
        <h2 className={'section-heading'}>Hear when it launches</h2>
        <p className={'mt-5 max-w-[40ch] text-lg'}>
          Leave your email and we will tell you when we go live.
        </p>
        <div className={'mt-10 flex w-full justify-center'}>
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
