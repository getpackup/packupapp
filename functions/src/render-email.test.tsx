import { describe, expect, it } from 'vitest'

import type { SafetyItineraryEmailPayload } from '../../app/types/SafetyItinerary'
import { TripMemberStatus } from '../../app/types/TripMember'
import { renderSafetyItineraryHtml } from './render-email'

const basePayload: SafetyItineraryEmailPayload = {
  to: 'alice@example.com',
  tripName: 'Mt. Robson Backpacking',
  startingPoint: 'Berg Lake Trailhead, BC',
  dateRange: 'Jun 15, 2026 – Jun 18, 2026',
  description: 'Three-night trip to Berg Lake via the North Boundary Trail.',
  members: [
    { displayName: 'Alice', status: TripMemberStatus.Owner },
    { displayName: 'Bob', status: TripMemberStatus.Accepted },
    { displayName: 'Charlie', status: TripMemberStatus.Pending },
  ],
  emergencyContacts: [
    { name: 'John Doe', phoneNumber: '+1-555-0100', email: 'john@example.com' },
  ],
  recipientUid: 'alice-uid',
}

describe('renderSafetyItineraryHtml', () => {
  it('renders trip details in the HTML output', async () => {
    const html = await renderSafetyItineraryHtml(basePayload)
    expect(html).toContain('Mt. Robson Backpacking')
    expect(html).toContain('Berg Lake Trailhead, BC')
    expect(html).toContain('Jun 15, 2026 – Jun 18, 2026')
    expect(html).toContain('Three-night trip to Berg Lake via the North Boundary Trail.')
  })

  it('renders trip members', async () => {
    const html = await renderSafetyItineraryHtml(basePayload)
    expect(html).toContain('Alice')
    expect(html).toContain('Bob')
    expect(html).toContain('Charlie')
  })

  it('renders emergency contacts', async () => {
    const html = await renderSafetyItineraryHtml(basePayload)
    expect(html).toContain('John Doe')
    expect(html).toContain('+1-555-0100')
    expect(html).toContain('john@example.com')
  })

  it('renders prompt when no emergency contacts', async () => {
    const html = await renderSafetyItineraryHtml({ ...basePayload, emergencyContacts: [] })
    expect(html).toContain('emergency contact')
    expect(html).toContain('Settings')
  })

  it('snapshot matches expected output', async () => {
    const html = await renderSafetyItineraryHtml(basePayload)
    expect(html).toMatchSnapshot()
  })
})
