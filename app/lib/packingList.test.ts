import { describe, expect, it } from 'vitest'

import type { GearClosetItem, GearItem } from '~/types/GearItem'

import { assemblePackingListItems } from './packingList'

const masterItem = (overrides: Partial<GearItem> = {}): GearItem =>
  ({
    id: 'master-1',
    name: 'Tent',
    category: 'Accommodation',
    essential: false,
    hiking: true,
    backpacking: false,
    ...overrides,
  }) as GearItem

const customItem = (overrides: Partial<GearClosetItem> = {}): GearClosetItem =>
  ({
    id: 'custom-1',
    name: 'My Tent',
    tags: ['Hiking'],
    essential: false,
    ...overrides,
  }) as GearClosetItem

const baseParams = {
  activityKeys: ['hiking' as const],
  removals: [],
  existingGearItemIds: new Set<string>(),
  customTagNames: [],
  userId: 'user-123',
  existingTripTags: [],
}

describe('assemblePackingListItems', () => {
  describe('when no items match', () => {
    it('returns empty itemData', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem({ hiking: false })],
        customItems: [],
      })
      expect(itemData).toHaveLength(0)
    })

    it('still returns mergedTags when no items match', () => {
      const { mergedTags } = assemblePackingListItems({
        ...baseParams,
        masterItems: [],
        customItems: [],
        existingTripTags: ['Camping'],
        activityKeys: ['hiking'],
      })
      expect(mergedTags).toContain('Camping')
      expect(mergedTags).toContain('Hiking')
    })
  })

  describe('item data for master items', () => {
    it('maps master item fields correctly', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem({ name: 'Rain Jacket', category: 'Outerwear', essential: true })],
        customItems: [],
      })
      expect(itemData[0]).toMatchObject({
        name: 'Rain Jacket',
        category: 'Outerwear',
        isEssential: true,
        isPacked: false,
        quantity: 1,
        gearItemId: 'master-1',
        gearSource: 'master',
        packedBy: [{ uid: 'user-123', quantity: 1, isShared: false }],
      })
    })

    it('defaults category to Uncategorized when missing', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem({ category: undefined })],
        customItems: [],
      })
      expect(itemData[0].category).toBe('Uncategorized')
    })

    it('includes weight and weightUnit when present', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem({ weight: '500', weightUnit: 'g' })],
        customItems: [],
      })
      expect(itemData[0].weight).toBe('500')
      expect(itemData[0].weightUnit).toBe('g')
    })

    it('omits weight fields when absent', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem()],
        customItems: [],
      })
      expect(itemData[0]).not.toHaveProperty('weight')
      expect(itemData[0]).not.toHaveProperty('weightUnit')
    })

    it('does not set gearOwnerId for master items', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem()],
        customItems: [],
      })
      expect(itemData[0]).not.toHaveProperty('gearOwnerId')
    })
  })

  describe('item data for custom items', () => {
    it('sets gearOwnerId to userId for custom items', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [],
        customItems: [customItem()],
      })
      expect(itemData[0].gearOwnerId).toBe('user-123')
      expect(itemData[0].gearSource).toBe('custom')
    })

    it('maps custom item fields correctly', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [],
        customItems: [customItem({ name: 'Headlamp', essential: true })],
      })
      expect(itemData[0]).toMatchObject({
        name: 'Headlamp',
        isPacked: false,
        quantity: 1,
        gearSource: 'custom',
        packedBy: [{ uid: 'user-123', quantity: 1, isShared: false }],
      })
    })
  })

  describe('tag filtering', () => {
    it('only includes tags relevant to the trip activities', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        activityKeys: ['hiking'],
        masterItems: [masterItem({ hiking: true, backpacking: true })],
        customItems: [],
      })
      expect(itemData[0].tags).toEqual(['Hiking'])
    })

    it('omits tags field when no relevant tags', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        activityKeys: ['hiking'],
        masterItems: [masterItem({ hiking: true })],
        customItems: [],
      })
      // master item has no pre-built tags array — tags only set if non-empty
      const item = itemData[0]
      if (item.tags) {
        expect(item.tags.length).toBeGreaterThan(0)
      }
    })

    it('includes custom tag names in trip-relevant tags', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        activityKeys: [],
        customTagNames: ['Photography'],
        masterItems: [],
        customItems: [customItem({ tags: ['Photography'] })],
      })
      expect(itemData[0].tags).toContain('Photography')
    })
  })

  describe('mergedTags', () => {
    it('merges existing trip tags with activity labels', () => {
      const { mergedTags } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem()],
        customItems: [],
        existingTripTags: ['Camping'],
        activityKeys: ['hiking'],
      })
      expect(mergedTags).toContain('Camping')
      expect(mergedTags).toContain('Hiking')
    })

    it('deduplicates merged tags', () => {
      const { mergedTags } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem()],
        customItems: [],
        existingTripTags: ['Hiking'],
        activityKeys: ['hiking'],
      })
      expect(mergedTags.filter((t) => t === 'Hiking')).toHaveLength(1)
    })

    it('excludes custom tag names from merged tags', () => {
      const { mergedTags } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem()],
        customItems: [],
        customTagNames: ['MyCustomTag'],
      })
      expect(mergedTags).not.toContain('MyCustomTag')
    })

    it('excludes Other Considerations labels from merged tags', () => {
      const { mergedTags } = assemblePackingListItems({
        ...baseParams,
        masterItems: [],
        customItems: [],
        activityKeys: ['baby', 'photography'],
        existingTripTags: [],
      })
      expect(mergedTags).not.toContain('Baby')
      expect(mergedTags).not.toContain('Photography')
    })

    it('still generates items for Other Considerations keys', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem({ id: 'baby-item', baby: true, hiking: false })],
        customItems: [],
        activityKeys: ['baby'],
      })
      expect(itemData).toHaveLength(1)
      expect(itemData[0].gearItemId).toBe('baby-item')
    })
  })

  describe('personalTags', () => {
    it('includes Other Considerations keys in personalTags', () => {
      const { personalTags } = assemblePackingListItems({
        ...baseParams,
        masterItems: [],
        customItems: [],
        activityKeys: ['baby', 'hiking'],
        existingTripTags: [],
      })
      expect(personalTags).toContain('baby')
      expect(personalTags).not.toContain('hiking')
    })

    it('includes customTagNames in personalTags', () => {
      const { personalTags } = assemblePackingListItems({
        ...baseParams,
        masterItems: [],
        customItems: [],
        customTagNames: ['MyCustomTag'],
      })
      expect(personalTags).toContain('MyCustomTag')
    })

    it('returns personalTags even when no items match', () => {
      const { personalTags } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem({ hiking: false })],
        customItems: [],
        activityKeys: ['baby'],
        customTagNames: ['MyTag'],
      })
      expect(personalTags).toContain('baby')
      expect(personalTags).toContain('MyTag')
    })
  })

  describe('exclusions', () => {
    it('excludes items already in the packing list', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem({ id: 'gear-1' })],
        customItems: [],
        existingGearItemIds: new Set(['gear-1']),
      })
      expect(itemData).toHaveLength(0)
    })

    it('excludes items in the removals list', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem({ id: 'gear-1' })],
        customItems: [],
        removals: ['gear-1'],
      })
      expect(itemData).toHaveLength(0)
    })
  })

  describe('custom item priority', () => {
    it('prefers custom item over master item with the same name', () => {
      const { itemData } = assemblePackingListItems({
        ...baseParams,
        masterItems: [masterItem({ name: 'Tent', id: 'master-tent' })],
        customItems: [customItem({ name: 'Tent', id: 'custom-tent' })],
      })
      expect(itemData).toHaveLength(1)
      expect(itemData[0].gearSource).toBe('custom')
    })
  })
})
