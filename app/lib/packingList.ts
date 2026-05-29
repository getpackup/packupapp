import { activityKeyToLabel, filterGearByActivities } from '~/lib/gearFilterUtils'
import type { ActivityTypes, GearClosetItem, GearItem } from '~/types/GearItem'
import type { PackingListItem } from '~/types/PackingListItem'

export type NewPackingListItemData = Omit<PackingListItem, 'id' | 'created'>

export function assemblePackingListItems({
  masterItems,
  customItems,
  activityKeys,
  removals,
  existingGearItemIds,
  customTagNames,
  userId,
  existingTripTags,
}: {
  masterItems: GearItem[]
  customItems: GearClosetItem[]
  activityKeys: Array<keyof ActivityTypes>
  removals: string[]
  existingGearItemIds: Set<string>
  customTagNames: string[]
  userId: string
  existingTripTags: string[]
}): {
  itemData: NewPackingListItemData[]
  mergedTags: string[]
} {
  const matchingItems = filterGearByActivities(
    masterItems,
    customItems,
    activityKeys,
    removals,
    existingGearItemIds,
    customTagNames
  )

  const activityLabels = activityKeys
    .map((key) => activityKeyToLabel(key))
    .filter((label): label is string => !!label)

  const mergedTags = Array.from(
    new Set([...existingTripTags, ...activityLabels, ...customTagNames])
  )

  if (matchingItems.length === 0) return { itemData: [], mergedTags }

  const tripRelevantTags = new Set([...activityLabels, ...customTagNames])

  const itemData: NewPackingListItemData[] = matchingItems.map((item) => {
    const itemTags = item.tags.filter((tag) => tripRelevantTags.has(tag))
    const data: NewPackingListItemData = {
      name: item.name,
      category: item.category ?? 'Uncategorized',
      description: item.description ?? '',
      isEssential: item.essential ?? false,
      isPacked: false,
      quantity: 1,
      gearItemId: item.id,
      gearSource: item.source,
      packedBy: [{ uid: userId, quantity: 1, isShared: false }],
    }
    if (itemTags.length > 0) data.tags = itemTags
    if (item.weight) data.weight = item.weight
    if (item.weightUnit) data.weightUnit = item.weightUnit
    if (item.source === 'custom') data.gearOwnerId = userId
    return data
  })

  return { itemData, mergedTags }
}
