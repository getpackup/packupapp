import { renderHook } from '@testing-library/react'
import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import type { ShoppingListItemType } from '~/types/ShoppingListItemType'
import type { Trip } from '~/types/Trip'

import { useShoppingListView } from './useShoppingListView'

const PAST_MS = new Date('2020-01-10').getTime()
const PAST_START_MS = new Date('2020-01-07').getTime()
const FUTURE_MS = new Date('2030-01-10').getTime()
const FUTURE_START_MS = new Date('2030-01-07').getTime()
const FURTHER_FUTURE_START_MS = new Date('2030-06-01').getTime()

function makeTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    tripId: 'trip-1',
    name: 'Trip 1',
    description: '',
    startDate: Timestamp.fromMillis(FUTURE_START_MS),
    endDate: Timestamp.fromMillis(FUTURE_MS),
    lat: 0,
    lng: 0,
    owner: 'user-1',
    startingPoint: '',
    tags: [],
    timezoneOffset: 0,
    tripLength: 3,
    tripMembers: {},
    ...overrides,
  }
}

function makeItem(overrides: Partial<ShoppingListItemType> = {}): ShoppingListItemType {
  return {
    id: 'item-1',
    userId: 'user-1',
    tripId: 'trip-1',
    itemName: 'Item 1',
    quantity: 1,
    notes: '',
    estimatedPrice: null,
    actualPrice: null,
    isPurchased: false,
    purchasedAt: null,
    created: Timestamp.fromMillis(FUTURE_START_MS),
    updated: null,
    priority: 'no priority',
    store: null,
    sourcePackingListItemId: null,
    ...overrides,
  }
}

describe('useShoppingListView', () => {
  describe('purchase state filtering', () => {
    it('Unpurchased hides purchased items', () => {
      const items = [
        makeItem({ id: 'a', isPurchased: false }),
        makeItem({ id: 'b', isPurchased: true }),
      ]
      const trips = [makeTrip()]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips, purchaseState: 'unpurchased', sortBy: 'trip', activeStores: [] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['a'])
    })

    it('Purchased hides unpurchased items', () => {
      const items = [
        makeItem({ id: 'a', isPurchased: false }),
        makeItem({ id: 'b', isPurchased: true }),
      ]
      const trips = [makeTrip()]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips, purchaseState: 'purchased', sortBy: 'trip', activeStores: [] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['b'])
    })

    it('All shows both purchased and unpurchased', () => {
      const items = [
        makeItem({ id: 'a', isPurchased: false }),
        makeItem({ id: 'b', isPurchased: true }),
      ]
      const trips = [makeTrip()]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips, purchaseState: 'all', sortBy: 'trip', activeStores: [] })
      )
      expect(result.current.map((r) => r.item.id)).toHaveLength(2)
    })
  })

  describe('past-trip items', () => {
    it('past-trip items appear when All is active', () => {
      const pastTrip = makeTrip({ id: 'past', tripId: 'past', endDate: Timestamp.fromMillis(PAST_MS), startDate: Timestamp.fromMillis(PAST_START_MS) })
      const items = [
        makeItem({ id: 'a', tripId: 'past', isPurchased: true }),
        makeItem({ id: 'b', tripId: 'past', isPurchased: true }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [pastTrip], purchaseState: 'all', sortBy: 'trip', activeStores: [] })
      )
      expect(result.current).toHaveLength(2)
    })

    it('past-trip items are hidden when Unpurchased and all past items are purchased', () => {
      const pastTrip = makeTrip({ id: 'past', tripId: 'past', endDate: Timestamp.fromMillis(PAST_MS), startDate: Timestamp.fromMillis(PAST_START_MS) })
      const items = [
        makeItem({ id: 'a', tripId: 'past', isPurchased: true }),
        makeItem({ id: 'b', tripId: 'past', isPurchased: true }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [pastTrip], purchaseState: 'unpurchased', sortBy: 'trip', activeStores: [] })
      )
      expect(result.current).toHaveLength(0)
    })

    it('past-trip items with unpurchased items surface in Unpurchased view', () => {
      const pastTrip = makeTrip({ id: 'past', tripId: 'past', endDate: Timestamp.fromMillis(PAST_MS), startDate: Timestamp.fromMillis(PAST_START_MS) })
      const items = [
        makeItem({ id: 'a', tripId: 'past', isPurchased: false }),
        makeItem({ id: 'b', tripId: 'past', isPurchased: true }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [pastTrip], purchaseState: 'unpurchased', sortBy: 'trip', activeStores: [] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['a'])
    })
  })

  describe('store filter', () => {
    it('single store selected shows only matching items', () => {
      const items = [
        makeItem({ id: 'a', store: 'REI' }),
        makeItem({ id: 'b', store: 'Target' }),
        makeItem({ id: 'c', store: null }),
      ]
      const trips = [makeTrip()]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips, purchaseState: 'all', sortBy: 'trip', activeStores: ['REI'] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['a'])
    })

    it('multiple stores selected shows items from any of those stores', () => {
      const items = [
        makeItem({ id: 'a', store: 'REI' }),
        makeItem({ id: 'b', store: 'Target' }),
        makeItem({ id: 'c', store: 'Whole Foods' }),
      ]
      const trips = [makeTrip()]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips, purchaseState: 'all', sortBy: 'trip', activeStores: ['REI', 'Target'] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['a', 'b'])
    })

    it('"No store" selected shows only items with null store', () => {
      const items = [
        makeItem({ id: 'a', store: 'REI' }),
        makeItem({ id: 'b', store: null }),
        makeItem({ id: 'c', store: null }),
      ]
      const trips = [makeTrip()]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips, purchaseState: 'all', sortBy: 'trip', activeStores: ['No store'] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['b', 'c'])
    })

    it('empty activeStores shows all items (no store filter)', () => {
      const items = [
        makeItem({ id: 'a', store: 'REI' }),
        makeItem({ id: 'b', store: null }),
      ]
      const trips = [makeTrip()]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips, purchaseState: 'all', sortBy: 'trip', activeStores: [] })
      )
      expect(result.current).toHaveLength(2)
    })
  })

  describe('sort — trip', () => {
    it('earliest trip start date first', () => {
      const earlyTrip = makeTrip({ id: 't1', tripId: 't1', startDate: Timestamp.fromMillis(FUTURE_START_MS) })
      const lateTrip = makeTrip({ id: 't2', tripId: 't2', startDate: Timestamp.fromMillis(FURTHER_FUTURE_START_MS) })
      const items = [
        makeItem({ id: 'b', tripId: 't2' }),
        makeItem({ id: 'a', tripId: 't1' }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [earlyTrip, lateTrip], purchaseState: 'all', sortBy: 'trip', activeStores: [] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['a', 'b'])
    })

    it('priority ordering within same trip: high → medium → low → no priority', () => {
      const trip = makeTrip()
      const items = [
        makeItem({ id: 'd', priority: 'no priority' }),
        makeItem({ id: 'c', priority: 'low' }),
        makeItem({ id: 'b', priority: 'medium' }),
        makeItem({ id: 'a', priority: 'high' }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [trip], purchaseState: 'all', sortBy: 'trip', activeStores: [] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  describe('sort — priority', () => {
    it('global priority ordering: high → medium → low → no priority', () => {
      const trip = makeTrip()
      const items = [
        makeItem({ id: 'd', priority: 'no priority' }),
        makeItem({ id: 'b', priority: 'medium' }),
        makeItem({ id: 'a', priority: 'high' }),
        makeItem({ id: 'c', priority: 'low' }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [trip], purchaseState: 'all', sortBy: 'priority', activeStores: [] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['a', 'b', 'c', 'd'])
    })

    it('trip start date as tiebreaker when priorities are equal', () => {
      const earlyTrip = makeTrip({ id: 't1', tripId: 't1', startDate: Timestamp.fromMillis(FUTURE_START_MS) })
      const lateTrip = makeTrip({ id: 't2', tripId: 't2', startDate: Timestamp.fromMillis(FURTHER_FUTURE_START_MS) })
      const items = [
        makeItem({ id: 'b', tripId: 't2', priority: 'high' }),
        makeItem({ id: 'a', tripId: 't1', priority: 'high' }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [earlyTrip, lateTrip], purchaseState: 'all', sortBy: 'priority', activeStores: [] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['a', 'b'])
    })
  })

  describe('sort — store', () => {
    it('alphabetical by store', () => {
      const trip = makeTrip()
      const items = [
        makeItem({ id: 'c', store: 'Whole Foods' }),
        makeItem({ id: 'a', store: 'Amazon' }),
        makeItem({ id: 'b', store: 'REI' }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [trip], purchaseState: 'all', sortBy: 'store', activeStores: [] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['a', 'b', 'c'])
    })

    it('null store values last', () => {
      const trip = makeTrip()
      const items = [
        makeItem({ id: 'c', store: null }),
        makeItem({ id: 'a', store: 'Amazon' }),
        makeItem({ id: 'b', store: null }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [trip], purchaseState: 'all', sortBy: 'store', activeStores: [] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['a', 'c', 'b'])
    })
  })

  describe('composability', () => {
    it('store filter and sort by priority work together', () => {
      const trip = makeTrip()
      const items = [
        makeItem({ id: 'a', store: 'REI', priority: 'low' }),
        makeItem({ id: 'b', store: 'Target', priority: 'high' }),
        makeItem({ id: 'c', store: 'REI', priority: 'high' }),
        makeItem({ id: 'd', store: 'REI', priority: 'medium' }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [trip], purchaseState: 'all', sortBy: 'priority', activeStores: ['REI'] })
      )
      expect(result.current.map((r) => r.item.id)).toEqual(['c', 'd', 'a'])
    })
  })

  describe('trip enrichment', () => {
    it('resolves correct trip for each item', () => {
      const trip1 = makeTrip({ id: 't1', tripId: 't1', name: 'Camping' })
      const trip2 = makeTrip({ id: 't2', tripId: 't2', name: 'Hiking' })
      const items = [
        makeItem({ id: 'a', tripId: 't1' }),
        makeItem({ id: 'b', tripId: 't2' }),
      ]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [trip1, trip2], purchaseState: 'all', sortBy: 'trip', activeStores: [] })
      )
      const byId = Object.fromEntries(result.current.map((r) => [r.item.id, r.trip?.name]))
      expect(byId['a']).toBe('Camping')
      expect(byId['b']).toBe('Hiking')
    })

    it('returns undefined trip when tripId has no matching trip', () => {
      const items = [makeItem({ id: 'a', tripId: 'unknown' })]
      const { result } = renderHook(() =>
        useShoppingListView({ items, trips: [], purchaseState: 'all', sortBy: 'trip', activeStores: [] })
      )
      expect(result.current[0].trip).toBeUndefined()
    })
  })
})
