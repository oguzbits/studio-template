import { ChevronDown } from 'lucide-react';

export function FaqList(props: {
  items: { question: string; answer: string }[];
}) {
  if (props.items.length === 0) return null;

  return (
    <div className={'mx-auto flex w-full max-w-2xl flex-col'}>
      {props.items.map((item) => (
        <details key={item.question} className={'group border-b py-4'}>
          <summary
            className={
              'flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden'
            }
          >
            {item.question}
            <ChevronDown
              aria-hidden
              className={
                'text-muted-foreground size-5 shrink-0 transition-transform group-open:rotate-180'
              }
            />
          </summary>
          <p className={'text-muted-foreground pt-2 text-sm'}>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
