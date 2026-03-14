import type { ActivityTypes, GearClosetItem, GearItem } from '~/types/GearItem'

import { allGearListItems } from './gearListItemEnum'

const labelToKeyMap = new Map<string, keyof ActivityTypes>()
const keyToLabelMap = new Map<keyof ActivityTypes, string>()

allGearListItems.forEach((item) => {
  labelToKeyMap.set(item.label, item.name)
  keyToLabelMap.set(item.name, item.label)
})

export function activityLabelToKey(label: string): keyof ActivityTypes | undefined {
  return labelToKeyMap.get(label)
}

export function activityKeyToLabel(key: keyof ActivityTypes): string | undefined {
  return keyToLabelMap.get(key)
}

export type ClosetBrowseItem = {
  id: string
  name: string
  category?: string
  tags: string[]
  weight?: string
  weightUnit?: 'g' | 'kg' | 'oz' | 'lb'
  description?: string
  essential: boolean
  source: 'master' | 'custom'
}

export function normalizeMasterItem(item: GearItem): ClosetBrowseItem {
  const tags: string[] = []
  allGearListItems.forEach((gli) => {
    if (item[gli.name]) {
      tags.push(gli.label)
    }
  })

  return {
    id: item.id,
    name: item.name,
    category: item.category ?? undefined,
    tags,
    weight: item.weight ?? undefined,
    weightUnit: item.weightUnit ?? undefined,
    description: item.description ?? undefined,
    essential: item.essential ?? false,
    source: 'master',
  }
}

export function normalizeCustomItem(item: GearClosetItem): ClosetBrowseItem {
  return {
    id: item.id,
    name: item.name,
    tags: item.tags ?? [],
    weight: item.weight ?? undefined,
    weightUnit: item.weightUnit ?? undefined,
    description: item.description ?? undefined,
    essential: item.essential ?? false,
    source: 'custom',
  }
}

export function filterGearByActivities(
  masterItems: GearItem[],
  customItems: GearClosetItem[],
  activityKeys: Array<keyof ActivityTypes>,
  removals: string[],
  existingGearItemIds: Set<string>,
  customTagNames: string[] = []
): ClosetBrowseItem[] {
  const removalsSet = new Set(removals)

  const matchingMaster = masterItems.filter((item) => {
    if (removalsSet.has(item.id)) return false
    if (existingGearItemIds.has(item.id)) return false
    return activityKeys.some((key) => item[key] === true)
  })

  const activityLabels = new Set(
    activityKeys.map((key) => activityKeyToLabel(key)).filter(Boolean) as string[]
  )
  for (const name of customTagNames) {
    activityLabels.add(name)
  }

  const matchingCustom = customItems.filter((item) => {
    if (existingGearItemIds.has(item.id)) return false
    return item.tags?.some((tag) => activityLabels.has(tag))
  })

  const seen = new Map<string, ClosetBrowseItem>()

  for (const item of matchingCustom) {
    seen.set(item.name.toLowerCase(), normalizeCustomItem(item))
  }

  for (const item of matchingMaster) {
    const key = item.name.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, normalizeMasterItem(item))
    }
  }

  return Array.from(seen.values())
}
