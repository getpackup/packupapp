import type { PackingListItem } from '~/types/PackingListItem'

export function usePackingListCategorySelection(
  isMultiSelecting: boolean,
  lastSelectedItem: string | null,
  items: PackingListItem[],
  selectedItems: string[],
  setSelectedItems: (items: string[]) => void,
  setLastSelectedItem: (item: string | null) => void
) {
  const handleItemSelection = (itemId: string, isShiftClick: boolean, isCommandClick: boolean) => {
    if (!isMultiSelecting) return

    if (isShiftClick && lastSelectedItem) {
      // Range selection
      const lastIndex = items.findIndex((item) => item.id === lastSelectedItem)
      const currentIndex = items.findIndex((item) => item.id === itemId)

      if (lastIndex === -1 || currentIndex === -1) return

      const startIndex = Math.min(lastIndex, currentIndex)
      const endIndex = Math.max(lastIndex, currentIndex)

      const rangeItems = items.slice(startIndex, endIndex + 1).map((item) => item.id)

      // Determine if we should add or remove the range based on the current item's state
      const isCurrentItemSelected = selectedItems.includes(itemId)

      if (isCurrentItemSelected) {
        // Remove all items in range from selection
        setSelectedItems(selectedItems.filter((id) => !rangeItems.includes(id)))
      } else {
        // Add all items in range to selection
        const newSelectedItems = [...new Set([...selectedItems, ...rangeItems])]
        setSelectedItems(newSelectedItems)
      }

      // Update last selected item for future range operations
      setLastSelectedItem(itemId)
    } else if (isCommandClick) {
      // Toggle individual item
      const isCurrentlySelected = selectedItems.includes(itemId)
      if (isCurrentlySelected) {
        setSelectedItems(selectedItems.filter((id) => id !== itemId))
      } else {
        setSelectedItems([...selectedItems, itemId])
      }
      setLastSelectedItem(itemId)
    } else {
      // Regular click - toggle individual item
      const isCurrentlySelected = selectedItems.includes(itemId)
      if (isCurrentlySelected) {
        setSelectedItems(selectedItems.filter((id) => id !== itemId))
        setLastSelectedItem(null)
      } else {
        setSelectedItems([...selectedItems, itemId])
        setLastSelectedItem(itemId)
      }
    }
  }

  return { handleItemSelection }
}
