import { type PackingListItem } from '~/types/PackingListItem'

export const groupPackingList = (list: PackingListItem[]) => {
  // group them by category
  const entries = Object.entries(Object.groupBy(list, ({ category }) => category))

  // find all the pre-trip category items first
  const preTripEntries = entries.filter((item) => item[0] === 'Pre-Trip')!
  // then grab all the other categories
  const allOtherEntries = entries.filter((item) => item[0] !== 'Pre-Trip')

  return [...preTripEntries, ...allOtherEntries]
}

export default groupPackingList
