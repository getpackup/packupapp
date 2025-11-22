import { useEffect } from 'react'

import type { ShoppingListItemType } from '~/types/ShoppingListItemType'

export function useShoppingListCategoryHotkeys(
  isMultiSelecting: boolean,
  clearOrExitMultiSelect: () => void,
  deleteSelectedItems: () => void,
  markSelectedAsPacked: () => void,
  setSelectedItems: (items: string[]) => void,
  selectedItems: string[],
  items: ShoppingListItemType[],
  actionsMenuOpen: boolean,
  setActionsMenuOpen: (open: boolean) => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape key to clear OR exit multi-select mode
      if (event.key === 'Escape' && isMultiSelecting) {
        event.preventDefault()
        clearOrExitMultiSelect()
        return
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && isMultiSelecting) {
        event.preventDefault()
        deleteSelectedItems()
        return
      }

      if (event.key === '/' && isMultiSelecting) {
        event.preventDefault()
        markSelectedAsPacked()
        return
      }

      // Check if Ctrl/Cmd + A is pressed
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        if (isMultiSelecting) {
          event.preventDefault()

          setSelectedItems(
            selectedItems.length === items.length ? [] : items.map((item) => item.id)
          )
        }
      }

      // Check if Ctrl/Cmd + K is pressed to open Actions menu
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        // Only trigger if we're in multi-select mode
        if (isMultiSelecting) {
          event.preventDefault()
          event.stopPropagation()

          if (actionsMenuOpen) {
            setActionsMenuOpen(false)
          } else {
            setActionsMenuOpen(true)
          }
        }
      }
    }

    // Add event listener with capture phase to handle before other handlers
    document.addEventListener('keydown', handleKeyDown, true)

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isMultiSelecting, selectedItems.length, items, actionsMenuOpen])
}
