import { Column, Img, Row, Section, Text } from '@react-email/components'
import { BaseEmailTemplate } from './base'
import CallToAction from '../components/call-to-action'

const baseUrl =
  process.env.NODE_ENV === 'production' ? `https://packupapp.com` : 'http://localhost:5173'

interface InviteToTripEmailProps {
  invitedBy: string
  email: string
  greetingName: string
  tripName: string
  where: string
  why: string
  when: string
  tags: string
}

export const InviteToTripEmail = ({
  greetingName,
  invitedBy,
  tripName,
  where,
  why,
  when,
  tags,
}: InviteToTripEmailProps) => {
  return (
    <BaseEmailTemplate
      heading="New Trip Invitation on Packup"
      preview={`@${invitedBy} has invited you to join them on a trip on Packup 🏕️`}
    >
      <Text className="text-primary m-0 mb-6 text-left font-sans text-base leading-relaxed">
        Hey{greetingName ? ` ${greetingName}` : ', there'}!<br />
        <b className="text-primary font-sans font-bold">@{invitedBy}</b> has created a trip on
        Packup and is inviting you to join in on the fun.
      </Text>
      <Section className="mb-10 rounded border border-solid border-gray-200 bg-gray-200/50 p-4">
        <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-semibold tracking-wide uppercase">
          Trip Details
        </Text>

        <Row>
          <Column className="w-6 align-middle">
            <Img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWluZm8taWNvbiBsdWNpZGUtaW5mbyI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48cGF0aCBkPSJNMTIgMTZ2LTQiLz48cGF0aCBkPSJNMTIgOGguMDEiLz48L3N2Zz4="
              className="h-4 w-4"
            />
          </Column>
          <Column>
            <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed">
              {tripName}
            </Text>
          </Column>
        </Row>

        <Row>
          <Column className="w-6 align-middle">
            <Img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNhbGVuZGFyLWljb24gbHVjaWRlLWNhbGVuZGFyIj48cGF0aCBkPSJNOCAydjQiLz48cGF0aCBkPSJNMTYgMnY0Ii8+PHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiB4PSIzIiB5PSI0IiByeD0iMiIvPjxwYXRoIGQ9Ik0zIDEwaDE4Ii8+PC9zdmc+"
              className="h-4 w-4"
            />
          </Column>
          <Column>
            <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed">
              {when}
            </Text>
          </Column>
        </Row>
        <Row>
          <Column className="w-6 align-middle">
            <Img
              src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLW1hcC1waW4taWNvbiBsdWNpZGUtbWFwLXBpbiI+PHBhdGggZD0iTTIwIDEwYzAgNC45OTMtNS41MzkgMTAuMTkzLTcuMzk5IDExLjc5OWExIDEgMCAwIDEtMS4yMDIgMEM5LjUzOSAyMC4xOTMgNCAxNC45OTMgNCAxMGE4IDggMCAwIDEgMTYgMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiLz48L3N2Zz4="
              className="h-4 w-4"
            />
          </Column>
          <Column>
            <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed">
              {where}
            </Text>
          </Column>
        </Row>

        {why && why !== '' && (
          <Row>
            <Column className="w-6 pt-1 align-top">
              <Img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLW1lc3NhZ2Utc3F1YXJlLWljb24gbHVjaWRlLW1lc3NhZ2Utc3F1YXJlIj48cGF0aCBkPSJNMjIgMTdhMiAyIDAgMCAxLTIgMkg2LjgyOGEyIDIgMCAwIDAtMS40MTQuNTg2bC0yLjIwMiAyLjIwMkEuNzEuNzEgMCAwIDEgMiAyMS4yODZWNWEyIDIgMCAwIDEgMi0yaDE2YTIgMiAwIDAgMSAyIDJ6Ii8+PC9zdmc+"
                className="h-4 w-4"
              />
            </Column>
            <Column>
              <Text className="text-primary m-0 text-left align-top font-sans text-base leading-relaxed">
                {why}
              </Text>
            </Column>
          </Row>
        )}

        {tags && tags !== '' && (
          <Row className="pt-2">
            <Column className="w-6 align-baseline">
              <Img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXRhZ3MtaWNvbiBsdWNpZGUtdGFncyI+PHBhdGggZD0iTTEzLjE3MiAyYTIgMiAwIDAgMSAxLjQxNC41ODZsNi43MSA2LjcxYTIuNCAyLjQgMCAwIDEgMCAzLjQwOGwtNC41OTIgNC41OTJhMi40IDIuNCAwIDAgMS0zLjQwOCAwbC02LjcxLTYuNzFBMiAyIDAgMCAxIDYgOS4xNzJWM2ExIDEgMCAwIDEgMS0xeiIvPjxwYXRoIGQ9Ik0yIDd2Ni4xNzJhMiAyIDAgMCAwIC41ODYgMS40MTRsNi43MSA2LjcxYTIuNCAyLjQgMCAwIDAgMy4xOTEuMTkzIi8+PGNpcmNsZSBjeD0iMTAuNSIgY3k9IjYuNSIgcj0iLjUiIGZpbGw9ImN1cnJlbnRDb2xvciIvPjwvc3ZnPg=="
                className="h-4 w-4"
              />
            </Column>
            <Column>
              <Text className="text-primary m-0 mb-1 text-left font-sans text-xs leading-relaxed">
                {tags.split(',').map((tag) => (
                  <span
                    className="bg-primary mr-1 mb-1 inline-block rounded-full px-3 py-0.5 text-white"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </Text>
            </Column>
          </Row>
        )}
      </Section>
      <CallToAction text="View Trip Invitation" url={baseUrl} />
    </BaseEmailTemplate>
  )
}

export default InviteToTripEmail
