import { describe, expect, it } from 'vitest'

import { FREQUENT_TAGS_CAP, getFrequentTags } from './getFrequentTags'

describe('getFrequentTags', () => {
  it('returns empty array when tagCounts is empty', () => {
    expect(getFrequentTags({}, [], FREQUENT_TAGS_CAP)).toEqual([])
  })

  it('returns empty array when tagCounts is undefined', () => {
    expect(getFrequentTags(undefined, [], FREQUENT_TAGS_CAP)).toEqual([])
  })

  it('returns a single predefined tag with count 1', () => {
    expect(getFrequentTags({ hiking: 1 }, [], FREQUENT_TAGS_CAP)).toEqual(['hiking'])
  })

  it('sorts tags by count descending', () => {
    const tagCounts = { hiking: 3, paddling: 5, tent: 1 }
    const result = getFrequentTags(tagCounts, [], FREQUENT_TAGS_CAP)
    expect(result[0]).toBe('paddling')
    expect(result).toEqual(['paddling', 'hiking', 'tent'])
  })

  it('caps results at the provided cap value', () => {
    const tagCounts = { hiking: 5, paddling: 4, tent: 3, surfing: 2, fishing: 1 }
    const result = getFrequentTags(tagCounts, [], 3)
    expect(result).toHaveLength(3)
    expect(result).toEqual(['hiking', 'paddling', 'tent'])
  })

  it('filters out a custom tag key absent from customTags', () => {
    const tagCounts = { hiking: 3, 'my-deleted-tag': 5 }
    const result = getFrequentTags(tagCounts, [], FREQUENT_TAGS_CAP)
    expect(result).toEqual(['hiking'])
    expect(result).not.toContain('my-deleted-tag')
  })

  it('keeps a custom tag key present in customTags', () => {
    const tagCounts = { hiking: 1, 'my-custom-tag': 5 }
    const customTags = [{ name: 'my-custom-tag' }]
    const result = getFrequentTags(tagCounts, customTags, FREQUENT_TAGS_CAP)
    expect(result).toEqual(['my-custom-tag', 'hiking'])
  })

  it('never filters out a predefined tag regardless of customTags', () => {
    const tagCounts = { hiking: 3, tent: 2, carCamping: 1 }
    const result = getFrequentTags(tagCounts, [], FREQUENT_TAGS_CAP)
    expect(result).toContain('hiking')
    expect(result).toContain('tent')
    expect(result).toContain('carCamping')
  })

  it('exports FREQUENT_TAGS_CAP as 6', () => {
    expect(FREQUENT_TAGS_CAP).toBe(6)
  })
})
