export function getItemTags(item: { tags?: string[]; category?: string }): string[] {
  const tags = item.tags ?? []
  if (item.category && !tags.includes(item.category)) {
    return [item.category, ...tags]
  }
  return tags.length > 0 ? tags : item.category ? [item.category] : []
}

export function getGroupKey(item: { tags?: string[]; category?: string }): string {
  return item.tags?.[0] ?? item.category ?? 'Miscellaneous'
}
