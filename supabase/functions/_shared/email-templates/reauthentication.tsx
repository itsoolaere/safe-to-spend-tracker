/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>your verification code for safe to spend.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>confirm your identity.</Heading>
        <Text style={text}>use the code below to verify it's you:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          this code will expire shortly. if you didn't request this, you can
          safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#BC8034',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#a09a90', margin: '30px 0 0' }
