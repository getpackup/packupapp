export function getItemTags(item: { tags?: string[]; category?: string }): string[] {
  if (item.tags && item.tags.length > 0) return item.tags
  if (item.category) return [item.category]
  return []
}

export function getGroupKey(item: { tags?: string[]; category?: string }): string {
  return item.tags?.[0] ?? item.category ?? 'Miscellaneous'
}
