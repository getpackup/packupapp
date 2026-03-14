import type { TagColorKey } from '~/lib/tagColors'

export type UserTag = { name: string; color: TagColorKey }

export type GearCloset = {
  id: string
  owner: string
  categories: string[]
  removals: string[]
  customTags?: UserTag[]
}
