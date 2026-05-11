import { render } from '@react-email/render'

import { SafetyItineraryEmail } from '../../app/emails/safety-itinerary'
import type { SafetyItineraryEmailPayload } from '../../app/types/SafetyItinerary'

const APP_URL = process.env.APP_URL ?? 'https://getpackup.com'

export async function renderSafetyItineraryHtml(payload: SafetyItineraryEmailPayload): Promise<string> {
  return render(
    <SafetyItineraryEmail
      tripName={payload.tripName}
      startingPoint={payload.startingPoint}
      dateRange={payload.dateRange}
      description={payload.description}
      members={payload.members}
      emergencyContacts={payload.emergencyContacts}
      url={APP_URL}
    />
  )
}
