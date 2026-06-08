import { act, renderHook } from '@testing-library/react'
import { Timestamp } from 'firebase/firestore'
import { describe, expect, it } from 'vitest'

import type { ShoppingListItemType } from '~/types/ShoppingListItemType'

import { useShoppingListFilters } from './useShoppingListFilters'

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
    created: Timestamp.fromMillis(0),
    updated: null,
    priority: 'no priority',
    store: null,
    sourcePackingListItemId: null,
    ...overrides,
  }
}

describe('useShoppingListFilters', () => {
  describe('initial state', () => {
    it('defaults to purchaseState unpurchased', () => {
      const { result } = renderHook(() => useShoppingListFilters([]))
      expect(result.current.purchaseState).toBe('unpurchased')
    })

    it('defaults to sortBy trip', () => {
      const { result } = renderHook(() => useShoppingListFilters([]))
      expect(result.current.sortBy).toBe('trip')
    })

    it('defaults to no active stores', () => {
      const { result } = renderHook(() => useShoppingListFilters([]))
      expect(result.current.activeStores).toEqual([])
    })
  })

  describe('storeChips derivation', () => {
    it('derives unique store values sorted alphabetically', () => {
      const items = [
        makeItem({ id: 'a', store: 'Target' }),
        makeItem({ id: 'b', store: 'Amazon' }),
        makeItem({ id: 'c', store: 'REI' }),
      ]
      const { result } = renderHook(() => useShoppingListFilters(items))
      expect(result.current.storeChips).toEqual(['Amazon', 'REI', 'Target'])
    })

    it('deduplicates stores case-insensitively, keeping first seen casing', () => {
      const items = [
        makeItem({ id: 'a', store: 'REI' }),
        makeItem({ id: 'b', store: 'rei' }),
        makeItem({ id: 'c', store: 'Rei' }),
      ]
      const { result } = renderHook(() => useShoppingListFilters(items))
      expect(result.current.storeChips).toEqual(['REI'])
    })

    it('appends "No store" after named stores when some items have null store', () => {
      const items = [
        makeItem({ id: 'a', store: 'REI' }),
        makeItem({ id: 'b', store: null }),
        makeItem({ id: 'c', store: 'Amazon' }),
      ]
      const { result } = renderHook(() => useShoppingListFilters(items))
      expect(result.current.storeChips).toEqual(['Amazon', 'REI', 'No store'])
    })

    it('does not include "No store" when all items have a named store', () => {
      const items = [
        makeItem({ id: 'a', store: 'REI' }),
        makeItem({ id: 'b', store: 'Target' }),
      ]
      const { result } = renderHook(() => useShoppingListFilters(items))
      expect(result.current.storeChips).not.toContain('No store')
    })

    it('returns empty array when all items have null store (no named stores)', () => {
      const items = [
        makeItem({ id: 'a', store: null }),
        makeItem({ id: 'b', store: null }),
      ]
      const { result } = renderHook(() => useShoppingListFilters(items))
      expect(result.current.storeChips).toEqual([])
    })

    it('returns empty array when items list is empty', () => {
      const { result } = renderHook(() => useShoppingListFilters([]))
      expect(result.current.storeChips).toEqual([])
    })
  })

  describe('setters', () => {
    it('setPurchaseState updates purchaseState', () => {
      const { result } = renderHook(() => useShoppingListFilters([]))
      act(() => {
        result.current.setPurchaseState('purchased')
      })
      expect(result.current.purchaseState).toBe('purchased')
    })

    it('setSortBy updates sortBy', () => {
      const { result } = renderHook(() => useShoppingListFilters([]))
      act(() => {
        result.current.setSortBy('priority')
      })
      expect(result.current.sortBy).toBe('priority')
    })

    it('setActiveStores updates activeStores', () => {
      const { result } = renderHook(() => useShoppingListFilters([]))
      act(() => {
        result.current.setActiveStores(['REI', 'Target'])
      })
      expect(result.current.activeStores).toEqual(['REI', 'Target'])
    })
  })
})
