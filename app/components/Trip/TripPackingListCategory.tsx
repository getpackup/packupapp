import {
  ArrowBigUp,
  ChevronDown,
  ChevronUp,
  Command,
  CopyCheck,
  Delete,
  Ellipsis,
  ListChecks,
  LogOut,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { useDeleteSubCollectionDocument, useUpdateSubCollectionDocument } from '~/services/api'
import type { PackingListItem } from '~/types/PackingListItem'

import KeyboardInput from '../KeyboardInput'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Separator } from '../ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import TripPackingListItem from './TripPackingListItem'

type TripPackingListCategoryProps = {
  categoryName: string
  items: PackingListItem[]
}

const TripPackingListCategory = ({ categoryName, items }: TripPackingListCategoryProps) => {
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null)
  const [accordionOpen, setAccordionOpen] = useState(true)
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)

  const { mutate: updatePackingListItem } = useUpdateSubCollectionDocument('trips', 'packing-list')
  const { mutate: deletePackingListItem } = useDeleteSubCollectionDocument('trips', 'packing-list')
  const { id } = useParams()

  const clearOrExitMultiSelect = () => {
    if (selectedItems.length > 0) {
      setSelectedItems([])
      setLastSelectedItem(null)
    } else {
      setIsMultiSelecting(false)
      setSelectedItems([])
      setLastSelectedItem(null)
      setActionsMenuOpen(false)
    }
  }

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

  const areAllPacked = items.every((item) => item.isPacked)

  const markSelectedAsPacked = () => {
    if (!id || !selectedItems.length) return
    selectedItems.forEach((item) => {
      const itemData = items.find((i) => i.id === item)
      if (!itemData) return
      updatePackingListItem({ parentDocId: id, id: item, data: { isPacked: true } })
    })
    toast.success('Selected items marked as packed')
    setSelectedItems([])
    setActionsMenuOpen(false)
    setIsMultiSelecting(false)
  }

  const deleteSelectedItems = () => {
    if (!id || !selectedItems.length) return
    selectedItems.forEach((item) => {
      if (!item) return
      deletePackingListItem({ parentDocId: id, id: item })
    })
    setSelectedItems([])
    setActionsMenuOpen(false)
    toast.success('Selected items deleted')
  }

  const deleteAllItems = () => {
    if (!id || !items.length) return
    items.forEach((item) => {
      if (!item.id) return
      deletePackingListItem({ parentDocId: id, id: item.id })
    })

    toast.success(`All items in ${categoryName} deleted`)
    setIsMultiSelecting(false)
    setSelectedItems([])
    setActionsMenuOpen(false)
    setLastSelectedItem(null)
  }

  const markAllPacked = () => {
    if (!id || !items.length) return

    const newState = areAllPacked ? false : true
    items.forEach((item) => {
      if (!item.id) return
      updatePackingListItem({
        parentDocId: id,
        id: item.id,
        data: { isPacked: newState },
      })
    })
  }

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

  const controlOrCommand =
    navigator.userAgent.indexOf('Mac') !== -1 ? (
      <Command className="inline size-2.5" />
    ) : (
      <ChevronUp className="inline size-2.5" />
    )

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue={categoryName}
      disabled={isMultiSelecting}
      value={accordionOpen ? categoryName : ''}
      onValueChange={(value) => {
        setAccordionOpen(value === categoryName)
      }}
    >
      <AccordionItem value={categoryName} disabled={isMultiSelecting}>
        <AccordionTrigger
          hideIcon
          className="group/accordion hover:no-underline"
          asChild
          onClick={(e) => {
            if (isMultiSelecting) {
              e.preventDefault()
              e.stopPropagation()
            }
          }}
        >
          <div
            onClick={(e) => {
              if (isMultiSelecting) {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
            className="focus-visible:border-ring focus-visible:ring-ring/50 flex w-full justify-between border-b px-2 pb-2 transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.currentTarget.click()
              }
            }}
          >
            <div className="group flex cursor-pointer items-center gap-3">
              {isMultiSelecting && (
                <Tooltip delayDuration={500}>
                  <TooltipTrigger className="ml-1" asChild>
                    <div>
                      <Checkbox
                        className="pointer-events-auto"
                        checked={
                          selectedItems.length === items.length
                            ? true
                            : selectedItems.length >= 1 && selectedItems.length < items.length
                              ? 'indeterminate'
                              : false
                        }
                        onCheckedChange={() => {
                          selectedItems.length === items.length
                            ? setSelectedItems([])
                            : setSelectedItems(items.map((item) => item.id))
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="w-44 space-y-1">
                      <div className="flex justify-between">
                        Multi-select
                        <span>
                          <KeyboardInput>{controlOrCommand}</KeyboardInput>
                          <KeyboardInput>Click</KeyboardInput>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        Select a range
                        <span>
                          <KeyboardInput>
                            <ArrowBigUp className="inline size-3" />
                          </KeyboardInput>
                          <KeyboardInput>Click</KeyboardInput>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        Select all
                        <span>
                          <KeyboardInput>{controlOrCommand}</KeyboardInput>
                          <KeyboardInput>A</KeyboardInput>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        Clear selection
                        <KeyboardInput>Esc</KeyboardInput>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
              <div>
                <div className="text-lg font-semibold">
                  {categoryName}{' '}
                  <ChevronDown className="inline h-4 w-4 group-data-[state=closed]/accordion:rotate-180" />
                </div>
                <div className="text-muted-foreground text-sm">
                  {!isMultiSelecting && (
                    <span>
                      {items.filter((item) => item.isPacked).length} of {items.length} packed
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isMultiSelecting ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-sm border border-dashed px-2 py-1">
                    <span className="opacity-80 hover:opacity-100">
                      {selectedItems.length} selected
                    </span>
                    <Separator orientation="vertical" className="!h-4" />{' '}
                    <Tooltip delayDuration={500}>
                      <TooltipTrigger asChild>
                        <button
                          className="opacity-80 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearOrExitMultiSelect()
                          }}
                        >
                          <X className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="flex items-center gap-2">
                        {selectedItems.length > 0 ? 'Clear selected' : 'Exit multi-select'}{' '}
                        <KeyboardInput>Esc</KeyboardInput>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <DropdownMenu open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                      <div>
                        <Tooltip delayDuration={500}>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActionsMenuOpen(!actionsMenuOpen)
                              }}
                              variant="outline"
                              size="sm"
                              className=""
                            >
                              <Command className="size-3 opacity-80 hover:opacity-100" /> Actions
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Open command menu <KeyboardInput>Cmd+K</KeyboardInput>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        className="flex justify-between gap-8"
                        disabled={selectedItems.length === 0}
                        onClick={(e) => {
                          e.stopPropagation()
                          markSelectedAsPacked()
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <ListChecks />
                          Mark selected as packed
                        </span>
                        <KeyboardInput>/</KeyboardInput>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={selectedItems.length === 0}
                        className="flex justify-between gap-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSelectedItems()
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Trash2 />
                          Delete selected
                        </span>
                        <KeyboardInput>
                          <Delete className="text-popover-foreground size-4" strokeWidth={1.5} />
                        </KeyboardInput>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {selectedItems.length > 0 && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            clearOrExitMultiSelect()
                          }}
                          className="flex justify-between gap-8"
                        >
                          <span className="flex items-center gap-2">
                            <X />
                            Clear selected
                          </span>
                          <KeyboardInput>Esc</KeyboardInput>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsMultiSelecting(false)
                          setSelectedItems([])
                        }}
                        className="flex justify-between gap-8"
                      >
                        <span className="flex items-center gap-2">
                          <LogOut />
                          Exit multi-select
                        </span>
                        <KeyboardInput>
                          {selectedItems.length === 0 ? 'Esc' : 'Esc+Esc'}
                        </KeyboardInput>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <>
                  <Tooltip delayDuration={500}>
                    <TooltipTrigger className="p-1 opacity-80 hover:opacity-100">
                      <Plus className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent className="flex items-center gap-2">
                      Add item to {categoryName}
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 opacity-80 hover:opacity-100">
                      <Ellipsis className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setAccordionOpen(true)
                          setIsMultiSelecting(true)
                        }}
                      >
                        <CopyCheck />
                        Multi-select items
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          markAllPacked()
                        }}
                      >
                        <ListChecks />
                        Mark all as {areAllPacked ? 'unpacked' : 'packed'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteAllItems()
                        }}
                      >
                        <Trash2 />
                        Delete all in {categoryName}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-4 text-balance">
          <div className="space-y-1">
            {items.map((item) => (
              <TripPackingListItem
                key={item.id}
                item={item}
                isMultiSelecting={isMultiSelecting}
                isSelected={selectedItems.includes(item.id)}
                onItemSelection={handleItemSelection}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export default TripPackingListCategory
