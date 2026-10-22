/** Plain questions and answers, all visible: nothing to open, nothing boxed. */
export function FaqList(props: {
  items: { question: string; answer: string }[];
  // h2 where the list sits directly under the page h1 (/faq)
  as?: 'h2' | 'h3';
}) {
  const Question = props.as ?? 'h3';

  if (props.items.length === 0) return null;

  return (
    <dl className={'grid gap-x-16 gap-y-12 md:grid-cols-2'}>
      {props.items.map((item) => (
        <div key={item.question}>
          <dt>
            <Question className={'text-2xl font-medium tracking-tight'}>
              {item.question}
            </Question>
          </dt>
          <dd className={'mt-3 text-lg'}>{item.answer}</dd>
        </div>
      ))}
    </dl>
  );
}
