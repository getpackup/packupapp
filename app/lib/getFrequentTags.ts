import { gearListKeys } from './gearListItemEnum'

export const FREQUENT_TAGS_CAP = 6

const predefinedKeySet: Set<string> = new Set(gearListKeys)

export function getFrequentTags(
  tagCounts: Record<string, number> | undefined,
  customTags: { name: string }[],
  cap: number,
): string[] {
  if (!tagCounts) return []

  const customTagNames = new Set(customTags.map((t) => t.name))

  return Object.entries(tagCounts)
    .filter(([key]) => predefinedKeySet.has(key) || customTagNames.has(key))
    .sort((a, b) => b[1] - a[1])
    .slice(0, cap)
    .map(([key]) => key)
}
