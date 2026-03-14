export const TAG_COLOR_KEYS = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
] as const

export type TagColorKey = (typeof TAG_COLOR_KEYS)[number]

const TAG_COLORS: Record<TagColorKey, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  sky: 'bg-sky-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  purple: 'bg-purple-500',
  fuchsia: 'bg-fuchsia-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

export function getTagColorKey(
  tag: string,
  explicitColorOrMap?: TagColorKey | Map<string, TagColorKey>
): TagColorKey {
  if (explicitColorOrMap instanceof Map) {
    const mapped = explicitColorOrMap.get(tag)
    if (mapped && mapped in TAG_COLORS) return mapped
  } else if (explicitColorOrMap && explicitColorOrMap in TAG_COLORS) {
    return explicitColorOrMap
  }
  return TAG_COLOR_KEYS[hashString(tag) % TAG_COLOR_KEYS.length]
}

export function getTagDotClass(
  tag: string,
  explicitColorOrMap?: TagColorKey | Map<string, TagColorKey>
): string {
  return TAG_COLORS[getTagColorKey(tag, explicitColorOrMap)]
}
