import { type PackingListItem } from '~/types/PackingListItem'

export const groupPackingList = (
  list: PackingListItem[],
  uid: string,
  typeOfList: 'Personal' | 'Group'
) => {
  // Only grab items that belong to the logged in user, and any shared items
  const userOrSharedPackingList = list.filter(
    (packingListItem: PackingListItem) =>
      packingListItem &&
      packingListItem.packedBy &&
      packingListItem.packedBy.length > 0 &&
      packingListItem.packedBy.some((item) =>
        typeOfList === 'Personal' ? item.uid === uid : item.isShared
      )
  )

  // group them by category
  const entries = Object.entries(
    Object.groupBy(userOrSharedPackingList, ({ category }) => category)
  )

  // find all the pre-trip category items first
  const preTripEntries = entries.filter((item) => item[0] === 'Pre-Trip')!
  // then grab all the other categories
  const allOtherEntries = entries.filter((item) => item[0] !== 'Pre-Trip')

  return [...preTripEntries, ...allOtherEntries]
}

export default groupPackingList
