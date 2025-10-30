import { Column, Link, Row, Section, Text } from '@react-email/components'

import BaseEmailTemplate from './base'
import CallToAction from './components/call-to-action'
import DarkAndLightIconsFromBase64 from './components/DarkAndLightIconsFromBase64'

interface MagicLinkSigninEmailProps {
  signinUrl: string
  ipAddress?: string
  device?: string
  timestamp?: string
  url: string
}

export const MagicLinkSigninEmail = ({
  signinUrl,
  ipAddress,
  device,
  timestamp,
  url,
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
    <BaseEmailTemplate
      url={url}
      heading="Sign in to Packup"
      preview="Sign in to Packup with a magic link"
    >
      <Text className="text-primary m-0 mb-6 text-left font-sans text-base leading-relaxed dark:text-gray-300">
        You requested a sign-in link for your Packup account. This one-time link expires in 1 hour
        for your security.
      </Text>
      <CallToAction text="🪄 Sign in with magic link" url={signinUrl} />

      <Text className="text-primary m-0 mb-10 text-left font-sans text-sm leading-relaxed break-all dark:text-gray-300">
        Can't click the button? Copy this link:
        <br />
        {signinUrl}
      </Text>

      {(timestamp || device || ipAddress) && (
        <Section className="mb-10 rounded border border-solid border-gray-200 bg-gray-200/50 p-4 dark:border-gray-600 dark:bg-gray-700">
          <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-semibold tracking-wide uppercase dark:text-gray-300">
            Login Request Details
          </Text>
          {timestamp && (
            <Row>
              <Column className="w-6 align-middle">
                <DarkAndLightIconsFromBase64 base64String="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNsb2NrLWljb24gbHVjaWRlLWNsb2NrIj48cGF0aCBkPSJNMTIgNnY2bDQgMiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PC9zdmc+" />
              </Column>
              <Column>
                <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed dark:text-gray-300">
                  {formatTimestamp(timestamp)}
                </Text>
              </Column>
            </Row>
          )}

          {device && (
            <Row>
              <Column className="w-6 align-middle">
                <DarkAndLightIconsFromBase64 base64String="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLW1vbml0b3Itc21hcnRwaG9uZS1pY29uIGx1Y2lkZS1tb25pdG9yLXNtYXJ0cGhvbmUiPjxwYXRoIGQ9Ik0xOCA4VjZhMiAyIDAgMCAwLTItMkg0YTIgMiAwIDAgMC0yIDJ2N2EyIDIgMCAwIDAgMiAyaDgiLz48cGF0aCBkPSJNMTAgMTl2LTMuOTYgMy4xNSIvPjxwYXRoIGQ9Ik03IDE5aDUiLz48cmVjdCB3aWR0aD0iNiIgaGVpZ2h0PSIxMCIgeD0iMTYiIHk9IjEyIiByeD0iMiIvPjwvc3ZnPg==" />
              </Column>
              <Column>
                <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed dark:text-gray-300">
                  {device}
                </Text>
              </Column>
            </Row>
          )}

          {ipAddress && ipAddress !== 'Unknown' && (
            <Row>
              <Column className="w-6 align-middle">
                <DarkAndLightIconsFromBase64 base64String="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWVhcnRoLWljb24gbHVjaWRlLWVhcnRoIj48cGF0aCBkPSJNMjEuNTQgMTVIMTdhMiAyIDAgMCAwLTIgMnY0LjU0Ii8+PHBhdGggZD0iTTcgMy4zNFY1YTMgMyAwIDAgMCAzIDNhMiAyIDAgMCAxIDIgMmMwIDEuMS45IDIgMiAyYTIgMiAwIDAgMCAyLTJjMC0xLjEuOS0yIDItMmgzLjE3Ii8+PHBhdGggZD0iTTExIDIxLjk1VjE4YTIgMiAwIDAgMC0yLTJhMiAyIDAgMCAxLTItMnYtMWEyIDIgMCAwIDAtMi0ySDIuMDUiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjwvc3ZnPg==" />
              </Column>
              <Column>
                <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed dark:text-gray-300">
                  {ipAddress}
                </Text>
              </Column>
            </Row>
          )}
        </Section>
      )}

      <Text className="text-primary m-0 mb-6 text-left font-sans text-base leading-relaxed dark:text-gray-300">
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
