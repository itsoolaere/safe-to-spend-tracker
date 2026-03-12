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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>you've been invited to safe to spend.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>you've been invited.</Heading>
        <Text style={text}>
          you've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>safe to spend.</strong>
          </Link>{' '}
          click the button below to accept and create your account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          accept invitation
        </Button>
        <Text style={footer}>
          if you weren't expecting this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
