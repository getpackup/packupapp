import { render } from '@react-email/render'

import { SafetyItineraryEmail } from '../../app/emails/safety-itinerary'
import type { SafetyItineraryEmailPayload } from '../../app/types/SafetyItinerary'

const APP_URL = process.env.APP_URL ?? 'https://packupapp.com'

export async function renderSafetyItineraryHtml(
  payload: SafetyItineraryEmailPayload
): Promise<string> {
  const { to, recipientUid, ...emailProps } = payload
  return render(<SafetyItineraryEmail {...emailProps} url={APP_URL} />)
}
