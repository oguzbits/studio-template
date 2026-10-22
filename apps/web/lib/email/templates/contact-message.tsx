import { Body, Container, Html, Text } from 'react-email';

type Props = { email: string; name?: string | null; message: string };

// user input is only ever rendered as React text children (escaped), never as HTML
export function ContactMessageEmail({ email, name, message }: Props) {
  return (
    <Html>
      <Body>
        <Container>
          <Text>
            New contact message from {name ? `${name} <${email}>` : email}.
            Reply to this mail to answer.
          </Text>
          <Text style={{ whiteSpace: 'pre-wrap' }}>{message}</Text>
        </Container>
      </Body>
    </Html>
  );
}
