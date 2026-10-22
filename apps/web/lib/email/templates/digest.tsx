import { Body, Container, Heading, Html, Link, Text } from 'react-email';

const product = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? 'Studio';

export function DigestEmail({
  items,
  date,
}: {
  items: { title: string; url: string; summary?: string }[];
  date: string;
}) {
  return (
    <Html>
      <Body>
        <Container>
          <Heading as="h1">
            {product} digest, {date}
          </Heading>
          {items.map((item) => (
            <div key={item.url}>
              <Link href={item.url}>{item.title}</Link>
              {item.summary ? <Text>{item.summary}</Text> : null}
            </div>
          ))}
        </Container>
      </Body>
    </Html>
  );
}
