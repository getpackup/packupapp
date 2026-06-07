import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ShoppingListTripPill from './ShoppingListTripPill'

const JUN_12_NOON_UTC = new Date('2026-06-12T12:00:00Z').getTime()

describe('ShoppingListTripPill', () => {
  it('renders trip name', () => {
    render(
      <ShoppingListTripPill
        tripId="trip1"
        tripName="PCT Thru-Hike"
        startDate={JUN_12_NOON_UTC}
        isPast={false}
      />
    )
    expect(screen.getByText('PCT Thru-Hike')).toBeInTheDocument()
  })

  it('renders formatted start date as compact month+day', () => {
    render(
      <ShoppingListTripPill
        tripId="trip1"
        tripName="PCT Thru-Hike"
        startDate={JUN_12_NOON_UTC}
        isPast={false}
      />
    )
    expect(screen.getByText('Jun 12')).toBeInTheDocument()
  })

  it('applies muted style when isPast is true', () => {
    const { container } = render(
      <ShoppingListTripPill
        tripId="trip1"
        tripName="Past Trip"
        startDate={JUN_12_NOON_UTC}
        isPast={true}
      />
    )
    const mutedPills = container.querySelectorAll('.opacity-50')
    expect(mutedPills.length).toBeGreaterThan(0)
  })

  it('does not apply muted style when isPast is false', () => {
    const { container } = render(
      <ShoppingListTripPill
        tripId="trip1"
        tripName="Future Trip"
        startDate={JUN_12_NOON_UTC}
        isPast={false}
      />
    )
    expect(container.querySelectorAll('.opacity-50').length).toBe(0)
  })

  it('renders a color dot for the trip', () => {
    const { container } = render(
      <ShoppingListTripPill
        tripId="trip1"
        tripName="My Trip"
        startDate={JUN_12_NOON_UTC}
        isPast={false}
      />
    )
    const dot = container.querySelector('.h-2.w-2.rounded-full')
    expect(dot).toBeInTheDocument()
  })

  it('color dot class is consistent for the same tripId across renders', () => {
    const { container: c1 } = render(
      <ShoppingListTripPill
        tripId="stable-trip-id"
        tripName="Trip A"
        startDate={JUN_12_NOON_UTC}
        isPast={false}
      />
    )
    const { container: c2 } = render(
      <ShoppingListTripPill
        tripId="stable-trip-id"
        tripName="Trip B"
        startDate={JUN_12_NOON_UTC}
        isPast={false}
      />
    )
    const dot1 = c1.querySelector('.h-2.w-2.rounded-full')
    const dot2 = c2.querySelector('.h-2.w-2.rounded-full')
    expect(dot1?.className).toBe(dot2?.className)
  })
})
