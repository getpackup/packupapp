import { Link, Section, Text } from '@react-email/components'
import BaseEmailTemplate from './base'
import CallToAction from '../components/call-to-action'

interface MagicLinkSigninEmailProps {
  signinUrl: string
  ipAddress?: string
  device?: string
  timestamp?: string
}

export const MagicLinkSigninEmail = ({
  signinUrl,
  ipAddress,
  device,
  timestamp,
}: MagicLinkSigninEmailProps) => {
  const formatTimestamp = (ts?: string) => {
    if (!ts) return 'Unknown'
    const date = new Date(ts)
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    })
  }

  return (
    <BaseEmailTemplate heading="Sign in to Packup" preview="Sign in to Packup with a magic link">
      <Text className="text-primary m-0 mb-6 text-left font-sans text-base leading-relaxed">
        You requested a sign-in link for your Packup account. This one-time link expires in 1 hour
        for your security.
      </Text>
      <CallToAction text="🪄 Sign in with magic link" url={signinUrl} />

      <Text className="text-primary m-0 mb-10 text-left font-sans text-sm leading-relaxed break-all">
        Can't click the button? Copy this link:
        <br />
        {signinUrl}
      </Text>

      {timestamp ||
        device ||
        (ipAddress && (
          <Section className="mb-10 rounded border border-solid border-gray-200 bg-gray-200/50 p-4">
            <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-semibold tracking-wide uppercase">
              Login Request Details
            </Text>
            {timestamp && (
              <Text className="text-primary m-0 mb-1 text-left font-sans text-xs leading-relaxed">
                Requested at: {formatTimestamp(timestamp)}
              </Text>
            )}

            {device && (
              <Text className="text-primary m-0 mb-1 text-left font-sans text-xs leading-relaxed">
                From: {device}
              </Text>
            )}

            {ipAddress && ipAddress !== 'Unknown' && (
              <Text className="text-primary m-0 text-left font-sans text-xs leading-relaxed">
                IP Address: {ipAddress}
              </Text>
            )}
          </Section>
        ))}

      <Text className="text-primary m-0 mb-6 text-left font-sans text-base leading-relaxed">
        If you didn't request this, change your password or{' '}
        <Link href="mailto:hello@getpackup.com" className="text-accent">
          contact support
        </Link>
        .
      </Text>
    </BaseEmailTemplate>
  )
}

export default MagicLinkSigninEmail
