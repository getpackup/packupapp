import { render } from '@react-email/render'
import { describe, expect, it } from 'vitest'

import { SafetyItineraryEmail } from './safety-itinerary'

const baseProps = {
  tripName: 'Mt. Robson Backpacking',
  startingPoint: 'Berg Lake Trailhead, BC',
  dateRange: 'Jun 15 – Jun 18, 2026',
  description: 'Three-night trip to Berg Lake via the North Boundary Trail.',
  members: [
    { displayName: 'Alice', status: 'Owner' as const },
    { displayName: 'Bob', status: 'Accepted' as const },
    { displayName: 'Charlie', status: 'Pending' as const },
    { displayName: 'Dana', status: 'Declined' as const },
    { displayName: 'Eve', status: 'Left' as const },
  ],
  emergencyContacts: [
    { name: 'John Doe', phoneNumber: '+1-555-0100', email: 'john@example.com' },
    { name: 'Jane Doe', phoneNumber: '+1-555-0101', email: '' },
  ],
  url: 'https://packupapp.com',
}

describe('SafetyItineraryEmail', () => {
  it('renders trip name, location, date range, and description', async () => {
    const html = await render(<SafetyItineraryEmail {...baseProps} />)
    expect(html).toContain('Mt. Robson Backpacking')
    expect(html).toContain('Berg Lake Trailhead, BC')
    expect(html).toContain('Jun 15 – Jun 18, 2026')
    expect(html).toContain('Three-night trip to Berg Lake via the North Boundary Trail.')
  })

  it('renders all trip members with visible status labels', async () => {
    const html = await render(<SafetyItineraryEmail {...baseProps} />)
    expect(html).toContain('Alice')
    expect(html).toContain('Owner')
    expect(html).toContain('Bob')
    expect(html).toContain('Accepted')
    expect(html).toContain('Charlie')
    expect(html).toContain('Pending')
    expect(html).toContain('Dana')
    expect(html).toContain('Declined')
    expect(html).toContain('Eve')
    expect(html).toContain('Left')
  })

  it('does not render members with Removed status', async () => {
    const propsWithRemoved = {
      ...baseProps,
      members: [
        ...baseProps.members,
        { displayName: 'Mallory', status: 'Removed' as const },
      ],
    }
    const html = await render(<SafetyItineraryEmail {...propsWithRemoved} />)
    expect(html).not.toContain('Mallory')
  })

  it('renders emergency contacts with name, phone, and email', async () => {
    const html = await render(<SafetyItineraryEmail {...baseProps} />)
    expect(html).toContain('John Doe')
    expect(html).toContain('+1-555-0100')
    expect(html).toContain('john@example.com')
    expect(html).toContain('Jane Doe')
    expect(html).toContain('+1-555-0101')
  })

  it('renders prompt to add contacts when no emergency contacts exist', async () => {
    const propsNoContacts = { ...baseProps, emergencyContacts: [] }
    const html = await render(<SafetyItineraryEmail {...propsNoContacts} />)
    expect(html).toContain('Settings')
    expect(html).toContain('emergency contact')
  })

  it('renders SAR and emergency number placeholder lines', async () => {
    const html = await render(<SafetyItineraryEmail {...baseProps} />)
    expect(html).toContain('Local SAR')
    expect(html).toContain('Area Emergency Number')
    expect(html).toContain('___________')
  })

  it('renders without errors with minimal props (no contacts, no description)', async () => {
    const minimalProps = {
      tripName: 'Quick Hike',
      startingPoint: 'Local Trailhead',
      dateRange: 'Jul 1, 2026',
      description: '',
      members: [{ displayName: 'Solo', status: 'Owner' as const }],
      emergencyContacts: [],
      url: 'https://packupapp.com',
    }
    const html = await render(<SafetyItineraryEmail {...minimalProps} />)
    expect(html).toContain('Quick Hike')
    expect(html).toContain('Local Trailhead')
  })

  it('snapshot matches expected output', async () => {
    const html = await render(<SafetyItineraryEmail {...baseProps} />)
    expect(html).toMatchSnapshot()
  })
})
