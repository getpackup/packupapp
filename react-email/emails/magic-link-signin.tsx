import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Img,
  Link,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

const baseUrl =
  process.env.NODE_ENV === 'production' ? `https://packupapp.com` : 'http://localhost:5173'

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
    <Html>
      <Head>
        <style>
          @import
          url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap');
        </style>
        <Font
          fontFamily="Packup"
          fallbackFontFamily="Verdana"
          webFont={{
            url: 'https://packupapp.com/fonts/packup-regular-webfont.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Packup"
          fallbackFontFamily="Verdana"
          webFont={{
            url: 'https://packupapp.com/fonts/packup-bold-webfont.woff2',
            format: 'woff2',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                primary: '#0b2b44',
                accent: '#b35900',
              },
              fontFamily: {
                sans: [
                  "'Packup', 'Open Sans', 'Verdana', 'Tahoma', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                ],
              },
            },
          },
        }}
      >
        <Preview>Sign in to Packup with a magic link</Preview>
        <Body className="bg-white font-sans">
          <Container className="mx-auto bg-white px-0 py-4 text-center font-sans">
            <Section className="py-6">
              <Img
                src={`${baseUrl}/icons/yak-brand.png`}
                width="60"
                height="33"
                alt="Packup yak"
                style={{ margin: '0 auto' }}
              />
              <Heading className="text-primary mx-0 my-6 p-0 font-sans text-2xl font-bold">
                Sign in to Packup
              </Heading>
              <Section className="mx-auto mb-6 max-w-lg rounded border border-solid border-gray-200 bg-gray-100/50 p-6">
                <Text className="text-primary m-0 mb-6 text-left font-sans text-base leading-relaxed">
                  You requested a sign-in link for your Packup account. This one-time link expires
                  in 1 hour for your security.
                </Text>
                <Section className="text-center">
                  <Button
                    className="bg-accent decoration-none mx-auto mt-0 mb-6 rounded px-6 py-4 text-center font-sans text-sm text-white"
                    href={signinUrl}
                  >
                    🪄 Sign in with magic link
                  </Button>
                </Section>
                <Text className="text-primary m-0 mb-10 text-left font-sans text-sm leading-relaxed break-all">
                  Can't click the button? Copy this link:
                  <br />
                  {signinUrl}
                </Text>

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

                <Text className="text-primary m-0 mb-6 text-left font-sans text-base leading-relaxed">
                  If you didn't request this, change your password or{' '}
                  <Link href="mailto:hello@getpackup.com" className="text-accent">
                    contact support
                  </Link>
                  .
                </Text>

                <Text className="text-primary m-0 mb-6 text-left font-sans text-base leading-relaxed">
                  Happy packing, and stay safe out there!
                  <br />— The Packup team
                </Text>
              </Section>
              <Text className="mx-auto my-4 max-w-md text-center font-sans text-xs leading-relaxed text-gray-400">
                This email was sent from a notification-only email address that cannot accept
                incoming email. Please do not reply to this message.
              </Text>
              <Text className="text-primary m-0 mb-6 text-center font-sans text-lg leading-relaxed">
                ✌️🧡🏕️
              </Text>
              <Text className="text-primary my-4 text-center font-sans text-xs leading-relaxed">
                Copyright © 2020&ndash;
                {new Date().getFullYear()} Packup Technologies, Ltd. <br />
                2500-10220 103 Ave NW Edmonton, AB T5J 0K4 CA
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default MagicLinkSigninEmail
