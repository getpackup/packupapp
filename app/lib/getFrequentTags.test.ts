import { describe, expect, it } from 'vitest'

import { getFrequentTags, FREQUENT_TAGS_CAP } from './getFrequentTags'

describe('getFrequentTags', () => {
  it('returns empty array when tagCounts is empty', () => {
    expect(getFrequentTags({}, [], FREQUENT_TAGS_CAP)).toEqual([])
  })

  it('returns empty array when tagCounts is undefined', () => {
    expect(getFrequentTags(undefined, [], FREQUENT_TAGS_CAP)).toEqual([])
  })

  it('returns a single tag with count 1', () => {
    expect(getFrequentTags({ hiking: 1 }, [], FREQUENT_TAGS_CAP)).toEqual(['hiking'])
  })

  it('sorts tags by count descending', () => {
    const counts = { hiking: 3, paddling: 5, fishing: 1 }
    const result = getFrequentTags(counts, [], FREQUENT_TAGS_CAP)
    expect(result[0]).toBe('paddling')
    expect(result[1]).toBe('hiking')
    expect(result[2]).toBe('fishing')
  })

  it('caps results at the provided cap value', () => {
    const counts = { hiking: 5, paddling: 4, fishing: 3, surfing: 2, tent: 1, carCamp: 1, hotel: 1 }
    const result = getFrequentTags(counts, [], 3)
    expect(result).toHaveLength(3)
    expect(result).toEqual(['hiking', 'paddling', 'fishing'])
  })

  it('filters out custom tag keys not present in customTags', () => {
    const counts = { hiking: 3, 'my-custom-tag': 5 }
    const customTags = [{ name: 'other-tag' }]
    const result = getFrequentTags(counts, customTags, FREQUENT_TAGS_CAP)
    expect(result).toEqual(['hiking'])
    expect(result).not.toContain('my-custom-tag')
  })

  it('does NOT filter out predefined tag keys even if absent from customTags', () => {
    const counts = { hiking: 3, tent: 2 }
    const result = getFrequentTags(counts, [], FREQUENT_TAGS_CAP)
    expect(result).toContain('hiking')
    expect(result).toContain('tent')
  })

  it('keeps custom tag keys that exist in customTags', () => {
    const counts = { hiking: 2, 'my-tag': 5 }
    const customTags = [{ name: 'my-tag' }]
    const result = getFrequentTags(counts, customTags, FREQUENT_TAGS_CAP)
    expect(result[0]).toBe('my-tag')
    expect(result).toContain('hiking')
  })

  it('exports FREQUENT_TAGS_CAP as 6', () => {
    expect(FREQUENT_TAGS_CAP).toBe(6)
  })
})
