import { useMemo } from 'react'

import type { TagColorKey } from '~/lib/tagColors'
import { useGearClosetQuery } from '~/services/gear'

export function useCustomTagColorMap(userId: string): Map<string, TagColorKey> {
  const { data: closet } = useGearClosetQuery({
    userId,
    queryOptions: { enabled: !!userId },
  })

  return useMemo(() => {
    const map = new Map<string, TagColorKey>()
    if (closet?.customTags) {
      for (const tag of closet.customTags) {
        map.set(tag.name, tag.color)
      }
    }
    return map
  }, [closet?.customTags])
}
