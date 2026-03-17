export function getItemTags(item: { tags?: string[]; category?: string }): string[] {
  const tags = item.tags ?? []
  const category = item.category === 'Uncategorized' ? undefined : item.category
  if (category && !tags.includes(category)) {
    return [category, ...tags]
  }
  return tags.length > 0 ? tags : category ? [category] : []
}

export function getGroupKey(item: { tags?: string[]; category?: string }): string {
  return item.tags?.[0] ?? item.category ?? 'Miscellaneous'
}
