import { Column, Link, Row, Section, Text } from '@react-email/components'
import type { FC } from 'react'

import type { SafetyItineraryEmailProps } from '../types/SafetyItinerary'
import { TripMemberStatus } from '../types/TripMember'
import BaseEmailTemplate from './base'
import DarkAndLightIconsFromBase64 from './components/DarkAndLightIconsFromBase64'

const testData: SafetyItineraryEmailProps = {
  tripName: 'Trip to Squamish, BC',
  startingPoint: 'Squamish, BC, Canada',
  dateRange: 'Sep 8-12, 2022',
  description: 'Coming out to BC to finally meet the Packup cofounders 🙏',
  members: [
    { displayName: 'Tony Mamo', status: TripMemberStatus.Owner },
    { displayName: 'Taylor Burk', status: TripMemberStatus.Pending },
    { displayName: 'Mack Carson', status: TripMemberStatus.Accepted },
  ],
  emergencyContacts: [{ name: 'John Doe', phoneNumber: '+1-555-0100', email: 'john@example.com' }],
  url: 'localhost:5173',
}

const SafetyItineraryEmailImpl: FC<SafetyItineraryEmailProps> = ({
  tripName,
  startingPoint,
  dateRange,
  description,
  members,
  emergencyContacts,
  url,
}) => {
  const visibleMembers = members.filter((m) => m.status !== TripMemberStatus.Removed)

  return (
    <BaseEmailTemplate
      url={url}
      heading="Safety Itinerary"
      preview={`Your Safety Itinerary for ${tripName}`}
    >
      <Text className="text-primary m-0 mb-4 text-left font-sans text-base leading-relaxed dark:text-gray-300">
        Here is your Safety Itinerary for your upcoming trip. Print this page or forward it to
        someone who can raise the alarm if you don&apos;t return on time.
      </Text>

      <Section className="mb-6 rounded border border-solid border-gray-200 bg-gray-200/50 p-4 dark:border-gray-600 dark:bg-gray-700">
        <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-bold tracking-wide uppercase dark:text-gray-300">
          Trip Details
        </Text>

        <Row>
          <Column className="w-6 align-middle">
            <DarkAndLightIconsFromBase64 base64String="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWluZm8taWNvbiBsdWNpZGUtaW5mbyI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48cGF0aCBkPSJNMTIgMTZ2LTQiLz48cGF0aCBkPSJNMTIgOGguMDEiLz48L3N2Zz4=" />
          </Column>
          <Column>
            <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed dark:text-gray-300">
              {tripName}
            </Text>
          </Column>
        </Row>

        <Row>
          <Column className="w-6 align-middle">
            <DarkAndLightIconsFromBase64 base64String="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNhbGVuZGFyLWljb24gbHVjaWRlLWNhbGVuZGFyIj48cGF0aCBkPSJNOCAydjQiLz48cGF0aCBkPSJNMTYgMnY0Ii8+PHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiB4PSIzIiB5PSI0IiByeD0iMiIvPjxwYXRoIGQ9Ik0zIDEwaDE4Ii8+PC9zdmc+" />
          </Column>
          <Column>
            <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed dark:text-gray-300">
              {dateRange}
            </Text>
          </Column>
        </Row>

        <Row>
          <Column className="w-6 align-middle">
            <DarkAndLightIconsFromBase64 base64String="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLW1hcC1waW4taWNvbiBsdWNpZGUtbWFwLXBpbiI+PHBhdGggZD0iTTIwIDEwYzAgNC45OTMtNS41MzkgMTAuMTkzLTcuMzk5IDExLjc5OWExIDEgMCAwIDEtMS4yMDIgMEM5LjUzOSAyMC4xOTMgNCAxNC45OTMgNCAxMGE4IDggMCAwIDEgMTYgMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiLz48L3N2Zz4=" />
          </Column>
          <Column>
            <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed dark:text-gray-300">
              {startingPoint}
            </Text>
          </Column>
        </Row>

        {description && description !== '' && (
          <Row>
            <Column className="w-6 pt-1 align-top">
              <DarkAndLightIconsFromBase64 base64String="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLW1lc3NhZ2Utc3F1YXJlLWljb24gbHVjaWRlLW1lc3NhZ2Utc3F1YXJlIj48cGF0aCBkPSJNMjIgMTdhMiAyIDAgMCAxLTIgMkg2LjgyOGEyIDIgMCAwIDAtMS40MTQuNTg2bC0yLjIwMiAyLjIwMkEuNzEuNzEgMCAwIDEgMiAyMS4yODZWNWEyIDIgMCAwIDEgMi0yaDE2YTIgMiAwIDAgMSAyIDJ6Ii8+PC9zdmc+" />
            </Column>
            <Column>
              <Text className="text-primary m-0 text-left align-top font-sans text-base leading-relaxed dark:text-gray-300">
                {description}
              </Text>
            </Column>
          </Row>
        )}
      </Section>

      <Section className="mb-6 rounded border border-solid border-gray-200 bg-gray-200/50 p-4 dark:border-gray-600 dark:bg-gray-700">
        <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-bold tracking-wide uppercase dark:text-gray-300">
          Trip Members
        </Text>
        {visibleMembers.map((member) => (
          <Row key={member.displayName} className="mb-1">
            <Column>
              <Text className="text-primary m-0 text-left font-sans text-base leading-relaxed dark:text-gray-300">
                {member.displayName}{' '}
                <span className="text-sm text-gray-500 dark:text-gray-400">({member.status})</span>
              </Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Section className="mb-6 rounded border border-solid border-gray-200 bg-gray-200/50 p-4 dark:border-gray-600 dark:bg-gray-700">
        <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-bold tracking-wide uppercase dark:text-gray-300">
          Emergency Contacts
        </Text>
        {emergencyContacts.length > 0 ? (
          emergencyContacts.map((contact) => (
            <Row key={contact.name} className="mb-2">
              <Column>
                <Text className="text-primary m-0 text-left font-sans text-base leading-relaxed dark:text-gray-300">
                  <strong>{contact.name}</strong>
                  <br />
                  Phone: {contact.phoneNumber}
                  {contact.email && contact.email !== '' && (
                    <>
                      <br />
                      Email: {contact.email}
                    </>
                  )}
                </Text>
              </Column>
            </Row>
          ))
        ) : (
          <Row>
            <Column>
              <Text className="text-primary m-0 text-left font-sans text-base leading-relaxed dark:text-gray-300">
                You have no emergency contacts on file. Add at least one emergency contact in your{' '}
                <Link href={`${url}/settings`} className="text-accent underline">
                  Settings
                </Link>{' '}
                so it appears here next time.
              </Text>
            </Column>
          </Row>
        )}
      </Section>

      <Section className="mb-6 rounded border border-solid border-gray-200 bg-gray-200/50 p-4 dark:border-gray-600 dark:bg-gray-700">
        <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-bold tracking-wide uppercase dark:text-gray-300">
          Local Emergency Phone Numbers
        </Text>

        <div className="mb-4 border-b border-gray-300 dark:border-gray-600">
          <Text className="text-primary m-0 text-left font-sans text-base leading-relaxed dark:text-gray-300">
            Sheriff's Office Search &amp; Rescue:
          </Text>
        </div>
        <div className="mb-4 border-b border-gray-300 dark:border-gray-600">
          <Text className="text-primary m-0 text-left font-sans text-base leading-relaxed dark:text-gray-300">
            Non-Emergency Line:
          </Text>
        </div>
        <div className="mb-4 border-b border-gray-300 dark:border-gray-600">
          <Text className="text-primary m-0 text-left font-sans text-base leading-relaxed dark:text-gray-300">
            Ranger District/National Forest/Park:
          </Text>
        </div>
      </Section>
    </BaseEmailTemplate>
  )
}

export const SafetyItineraryEmail = Object.assign(SafetyItineraryEmailImpl, {
  PreviewProps: testData,
}) as FC<SafetyItineraryEmailProps> & {
  PreviewProps: SafetyItineraryEmailProps
}

export default SafetyItineraryEmail
