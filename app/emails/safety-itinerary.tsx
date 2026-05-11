import { Column, Hr, Link, Row, Section, Text } from '@react-email/components'

import { TripMemberStatus } from '../types/TripMember'
import BaseEmailTemplate from './base'

interface SafetyItineraryMember {
  displayName: string
  status: TripMemberStatus
}

interface EmergencyContact {
  name: string
  phoneNumber: string
  email: string
}

interface SafetyItineraryEmailProps {
  tripName: string
  startingPoint: string
  dateRange: string
  description: string
  members: SafetyItineraryMember[]
  emergencyContacts: EmergencyContact[]
  url: string
}

export const SafetyItineraryEmail = ({
  tripName,
  startingPoint,
  dateRange,
  description,
  members,
  emergencyContacts,
  url,
}: SafetyItineraryEmailProps) => {
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
        <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-semibold tracking-wide uppercase dark:text-gray-300">
          Trip Details
        </Text>

        <Row className="mb-1">
          <Column>
            <Text className="text-primary m-0 text-left font-sans text-lg font-bold leading-relaxed dark:text-gray-300">
              {tripName}
            </Text>
          </Column>
        </Row>

        <Row className="mb-1">
          <Column>
            <Text className="text-primary m-0 text-left font-sans text-base leading-relaxed dark:text-gray-300">
              📍 {startingPoint}
            </Text>
          </Column>
        </Row>

        <Row className="mb-1">
          <Column>
            <Text className="text-primary m-0 text-left font-sans text-base leading-relaxed dark:text-gray-300">
              📅 {dateRange}
            </Text>
          </Column>
        </Row>

        {description && description !== '' && (
          <Row className="mb-1">
            <Column>
              <Text className="text-primary m-0 text-left font-sans text-base leading-relaxed dark:text-gray-300">
                {description}
              </Text>
            </Column>
          </Row>
        )}
      </Section>

      <Section className="mb-6 rounded border border-solid border-gray-200 bg-gray-200/50 p-4 dark:border-gray-600 dark:bg-gray-700">
        <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-semibold tracking-wide uppercase dark:text-gray-300">
          Trip Members
        </Text>
        {visibleMembers.map((member) => (
          <Row key={member.displayName} className="mb-1">
            <Column>
              <Text className="text-primary m-0 text-left font-sans text-base leading-relaxed dark:text-gray-300">
                {member.displayName}{' '}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({member.status})
                </span>
              </Text>
            </Column>
          </Row>
        ))}
      </Section>

      <Section className="mb-6 rounded border border-solid border-gray-200 bg-gray-200/50 p-4 dark:border-gray-600 dark:bg-gray-700">
        <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-semibold tracking-wide uppercase dark:text-gray-300">
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

      <Hr className="my-4 border-gray-200 dark:border-gray-600" />

      <Section className="mb-6">
        <Text className="text-primary m-0 mb-2 text-left font-sans text-xs leading-relaxed font-semibold tracking-wide uppercase dark:text-gray-300">
          Fill in before sharing
        </Text>
        <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed dark:text-gray-300">
          Local SAR: ___________
        </Text>
        <Text className="text-primary m-0 mb-1 text-left font-sans text-base leading-relaxed dark:text-gray-300">
          Area Emergency Number: ___________
        </Text>
      </Section>
    </BaseEmailTemplate>
  )
}

export default SafetyItineraryEmail
