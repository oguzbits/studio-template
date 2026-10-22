import { WaitlistForm } from './waitlist-form';

export function CtaBand() {
  return (
    <section className={'container mx-auto'}>
      <div
        className={
          'bg-card flex flex-col items-center gap-4 rounded-xl border px-6 py-12 text-center'
        }
      >
        <h2 className={'text-2xl font-semibold'}>Get notified at launch</h2>
        <p className={'text-muted-foreground'}>
          Leave your email and we will tell you when we go live.
        </p>
        <WaitlistForm />
      </div>
    </section>
  );
}
