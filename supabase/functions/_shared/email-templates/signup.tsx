/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>confirm your email for safe to spend.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>confirm your email.</Heading>
        <Text style={text}>
          thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>safe to spend.</strong>
          </Link>
        </Text>
        <Text style={text}>
          please confirm your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) by clicking the button below:
        </Text>
        <Button style={button} href={confirmationUrl}>
          verify email
        </Button>
        <Text style={footer}>
          if you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Source Sans 3', 'Segoe UI', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '500' as const,
  fontStyle: 'italic' as const,
  fontFamily: "'Lora', Georgia, serif",
  color: '#2c2a27',
  margin: '0 0 20px',
}
const text = {
  fontSize: '15px',
  color: '#7a756b',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const link = { color: '#BC8034', textDecoration: 'underline' }
const button = {
  backgroundColor: '#BC8034',
  color: '#ffffff',
  fontSize: '15px',
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#a09a90', margin: '30px 0 0' }
