import {
  Body,
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

interface BaseEmailTemplateProps {
  heading: string
  children: React.ReactNode
  preview: string
  url: string
}

function packupFontUrl(filename: string) {
  if (typeof process !== 'undefined' && process.env.REACT_EMAIL_INTERNAL_USER_PROJECT_LOCATION) {
    return `/static/fonts/${filename}`
  }
  return `https://packupapp.com/fonts/${filename}`
}

export const BaseEmailTemplate = ({ heading, children, preview, url }: BaseEmailTemplateProps) => {
  return (
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
      <Html className="bg-white dark:bg-gray-900">
        <Head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <link
            href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300..800&display=swap"
            rel="stylesheet"
          />
          <Font
            fontFamily="Packup"
            fallbackFontFamily="Verdana"
            webFont={{
              url: packupFontUrl('packup-regular-webfont.woff2'),
              format: 'woff2',
            }}
            fontWeight={400}
            fontStyle="normal"
          />
          <Font
            fontFamily="Packup"
            fallbackFontFamily="Verdana"
            webFont={{
              url: packupFontUrl('packup-bold-webfont.woff2'),
              format: 'woff2',
            }}
            fontWeight={700}
            fontStyle="normal"
          />
        </Head>
        <Preview>{preview}</Preview>
        <Body className="font-sans">
          <Container className="mx-auto bg-white px-0 py-4 text-center font-sans dark:bg-gray-900">
            <Section className="bg-white py-6 dark:bg-gray-900">
              <Link href={url}>
                <Img
                  src="https://packupapp.com/icons/yak-brand.png"
                  width="60"
                  height="33"
                  alt="Packup yak"
                  style={{ margin: '0 auto' }}
                />
              </Link>
              <Heading className="text-primary mx-0 my-6 p-0 font-sans text-2xl font-bold dark:text-gray-300">
                {heading}
              </Heading>
              <Section className="mx-auto mb-6 rounded border border-solid border-gray-200 bg-gray-100/50 p-6 dark:border-gray-700 dark:bg-gray-800">
                {children}

                <Text className="text-primary m-0 mb-6 text-left font-sans text-base leading-relaxed dark:text-gray-300">
                  Happy packing, and stay safe out there!
                  <br />— The Packup team
                </Text>
              </Section>
              <Text className="mx-auto my-4 max-w-md text-center font-sans text-xs leading-relaxed text-gray-400">
                This email was sent from a notification-only email address that cannot accept
                incoming email. Please do not reply to this message.
              </Text>
              <Text className="text-primary m-0 mb-6 text-center font-sans text-lg leading-relaxed dark:text-gray-300">
                ✌️🧡🏕️
              </Text>
              <Text className="text-primary my-4 text-center font-sans text-xs leading-relaxed dark:text-gray-300">
                Copyright © 2020&ndash;
                {new Date().getFullYear()} Packup Technologies, Ltd. <br />
                2500-10220 103 Ave NW Edmonton, AB T5J 0K4 CA
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  )
}

export default BaseEmailTemplate
