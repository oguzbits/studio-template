import { Body, Container, Html, Text } from 'react-email';

const product = process.env.NEXT_PUBLIC_PRODUCT_NAME ?? 'Studio';

export function WelcomeEmail({ name }: { name?: string }) {
  return (
    <Html>
      <Body>
        <Container>
          <Text>{name ? `Hi ${name},` : 'Hi,'}</Text>
          <Text>Welcome to {product}. Your account is ready.</Text>
        </Container>
      </Body>
    </Html>
  );
}
