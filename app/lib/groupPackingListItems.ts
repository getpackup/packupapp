import { getGroupKey } from '~/lib/getItemTags'
import { type PackingListItem } from '~/types/PackingListItem'

export const groupPackingList = (list: PackingListItem[]) => {
  const entries = Object.entries(
    Object.groupBy(list, (item) => getGroupKey(item))
  )

  const preTripEntries = entries.filter((item) => item[0] === 'Pre-Trip')!
  const allOtherEntries = entries.filter((item) => item[0] !== 'Pre-Trip')

  return [...preTripEntries, ...allOtherEntries]
}

export default groupPackingList
