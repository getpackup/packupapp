import { render } from '@react-email/render'

import { InviteToTripEmail } from '../../app/emails/invite-to-trip'
import type { InviteToTripEmailProps } from '../../app/types/InviteToTrip'

export async function renderInviteToTripHtml(payload: InviteToTripEmailProps): Promise<string> {
  return render(<InviteToTripEmail {...payload} />)
}
