import { Timestamp } from 'firebase/firestore'
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
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useCheckboxSounds } from '~/lib/useCheckboxSounds'
import { cn } from '~/lib/utils'
import { useDeleteShoppingListItem, useUpdateShoppingListItem } from '~/services/shoppingList'
import type { ShoppingListItemType } from '~/types/ShoppingListItemType'
import type { Trip } from '~/types/Trip'

import AnimatedContainer from '../AnimatedContainer'
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
import { Kbd, KbdGroup } from '../ui/kbd'
import { Separator } from '../ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import AddShoppingListItemDialog from './AddShoppingListItemDialog'
import ShoppingListItem from './ShoppingListItem'
import { useShoppingListCategoryHotkeys } from './useShoppingListCategoryHotkeys'
import { useShoppingListCategorySelection } from './useShoppingListCategorySelection'

type ShoppingListCategoryProps = {
  trip: Trip
  items: ShoppingListItemType[]
  sounds?: ReturnType<typeof useCheckboxSounds>
}

const ShoppingListCategory = ({ trip, items, sounds }: ShoppingListCategoryProps) => {
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null)
  const [accordionOpen, setAccordionOpen] = useState(true)
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  const [newlyAddedItem, setNewlyAddedItem] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  const { mutateAsync: updateShoppingListItemAsync } = useUpdateShoppingListItem()
  const { mutateAsync: deleteShoppingListItemAsync } = useDeleteShoppingListItem()

  const handleItemCreated = (itemId: string) => {
    if (newlyAddedItem) {
      return
    }

    if (!accordionOpen) {
      setAccordionOpen(true)
    }

    setTimeout(
      () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'center' })
      },
      accordionOpen ? 100 : 500
    )

    setNewlyAddedItem(itemId)

    setTimeout(() => {
      setNewlyAddedItem(null)
    }, 2000)
  }

  useEffect(() => {
    return () => {
      setNewlyAddedItem(null)
    }
  }, [])

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

  const areAllPurchased = items.every((item) => item.isPurchased)

  const markSelectedAsPurchased = () => {
    if (!selectedItems.length) return
    selectedItems.forEach((item) => {
      const itemData = items.find((i) => i.id === item)
      if (!itemData) return
      updateShoppingListItemAsync({
        data: { id: item, isPurchased: true, purchasedAt: Timestamp.now() },
      })
    })
    toast.success(
      `${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'items'} marked as purchased`
    )
    setSelectedItems([])
    setActionsMenuOpen(false)
    setIsMultiSelecting(false)
  }

  const deleteSelectedItems = () => {
    if (!selectedItems.length) return
    selectedItems.forEach((item) => {
      if (!item) return
      deleteShoppingListItemAsync({ id: item })
    })
    setSelectedItems([])
    setActionsMenuOpen(false)
    setIsMultiSelecting(false)
    toast.success(
      `${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'items'} deleted`
    )
  }

  const deleteAllItems = () => {
    if (!items.length) return
    items.forEach((item) => {
      if (!item.id) return
      deleteShoppingListItemAsync({ id: item.id })
    })

    toast.success(`All items in ${trip.name} deleted`)
    setIsMultiSelecting(false)
    setSelectedItems([])
    setActionsMenuOpen(false)
    setLastSelectedItem(null)
  }

  const markAllAsPurchased = () => {
    if (!items.length) return

    const newState = areAllPurchased ? false : true
    const purchasedAt = newState ? Timestamp.now() : null
    items.forEach((item) => {
      if (!item.id) return
      updateShoppingListItemAsync({
        data: {
          id: item.id,
          isPurchased: newState,
          purchasedAt,
        },
      })
    })
  }

  const { handleItemSelection } = useShoppingListCategorySelection(
    isMultiSelecting,
    lastSelectedItem,
    items,
    selectedItems,
    setSelectedItems,
    setLastSelectedItem
  )

  useShoppingListCategoryHotkeys(
    isMultiSelecting,
    clearOrExitMultiSelect,
    deleteSelectedItems,
    markSelectedAsPurchased,
    setSelectedItems,
    selectedItems,
    items,
    actionsMenuOpen,
    setActionsMenuOpen
  )

  const controlOrCommand =
    navigator.userAgent.indexOf('Mac') !== -1 ? (
      <Command className="inline size-2.5" />
    ) : (
      <ChevronUp className="inline size-2.5" />
    )

  // each item can have multiple quantities, so if it is purchased, count the quantity
  const purchasedItemsCount = items
    .filter((item) => item.isPurchased)
    .reduce((acc, item) => acc + (item.quantity ?? 1), 0)
  // each item can have multiple quantities, so we need to count the total number of items
  const totalItemsCount = items.reduce((acc, item) => acc + (item.quantity ?? 1), 0)

  return (
    <>
      <Accordion
        type="single"
        collapsible
        className="mb-4 w-full rounded-lg border p-2"
        defaultValue={trip.name}
        disabled={isMultiSelecting}
        value={accordionOpen ? trip.name : ''}
        onValueChange={(value) => {
          setAccordionOpen(value === trip.name)
        }}
      >
        <AccordionItem value={trip.name} disabled={isMultiSelecting}>
          <AccordionTrigger
            hideIcon
            className="group/accordion py-2 hover:no-underline"
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
              className="focus-visible:border-ring focus-visible:ring-ring/50 mx-2 flex w-full justify-between transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
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
                  <Tooltip>
                    <TooltipTrigger className="ml-1 flex items-center" asChild>
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
                      <div className="w-44 space-y-3">
                        <div className="flex items-center justify-between">
                          Multi-select
                          <KbdGroup>
                            <Kbd>{controlOrCommand}</Kbd>
                            <span>+</span>
                            <Kbd>Click</Kbd>
                          </KbdGroup>
                        </div>
                        <div className="flex items-center justify-between">
                          Select a range
                          <span>
                            <KbdGroup>
                              <Kbd>
                                <ArrowBigUp className="inline size-3" />
                              </Kbd>
                              <span>+</span>
                              <Kbd>Click</Kbd>
                            </KbdGroup>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          Select all
                          <KbdGroup>
                            <Kbd>{controlOrCommand}</Kbd>
                            <span>+</span>
                            <Kbd>A</Kbd>
                          </KbdGroup>
                        </div>
                        <div className="flex items-center justify-between">
                          Clear selection
                          <KbdGroup>
                            <Kbd>Esc</Kbd>
                          </KbdGroup>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
                <div className="flex items-center gap-4">
                  {isMultiSelecting ? null : (
                    <ChevronDown className="ml-1 inline size-6 transition-transform group-data-[state=closed]/accordion:-rotate-90" />
                  )}
                  <div className="select-none">
                    <div className="text-lg font-semibold">{trip.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {!isMultiSelecting && totalItemsCount > 0 && (
                        <span>
                          {purchasedItemsCount} of {totalItemsCount} purchased
                        </span>
                      )}{' '}
                      | Needed by {trip.startDate.toDate().toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMultiSelecting ? (
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="dashed"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearOrExitMultiSelect()
                          }}
                          className="gap-2"
                        >
                          {selectedItems.length} selected
                          <Separator orientation="vertical" className="h-4" />{' '}
                          <X className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="flex items-center gap-4">
                        {selectedItems.length > 0 ? 'Clear selected' : 'Exit multi-select'}{' '}
                        <KbdGroup>
                          <Kbd>Esc</Kbd>
                        </KbdGroup>
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenu open={actionsMenuOpen} onOpenChange={setActionsMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActionsMenuOpen(!actionsMenuOpen)
                                }}
                                variant="outline"
                                size="sm"
                              >
                                <Command className="size-3 opacity-80 hover:opacity-100" /> Actions
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="flex items-center gap-4">
                                Open command menu{' '}
                                <KbdGroup>
                                  <Kbd>{controlOrCommand}</Kbd>
                                  <span>+</span>
                                  <Kbd>K</Kbd>
                                </KbdGroup>
                              </div>
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
                            markSelectedAsPurchased()
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <ListChecks />
                            Mark selected as purchased
                          </span>
                          <KbdGroup>
                            <Kbd>/</Kbd>
                          </KbdGroup>
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
                          <KbdGroup>
                            <Kbd>
                              <Delete className="size-4" strokeWidth={1.5} />
                            </Kbd>
                          </KbdGroup>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          disabled={selectedItems.length === 0}
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
                          <KbdGroup>
                            <Kbd>Esc</Kbd>
                          </KbdGroup>
                        </DropdownMenuItem>

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
                          <span>
                            <KbdGroup>
                              <Kbd>Esc</Kbd>
                              <span>+</span>
                              <Kbd>Esc</Kbd>
                            </KbdGroup>
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <>
                    <AddShoppingListItemDialog trip={trip} onItemCreated={handleItemCreated} />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="mr-1">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
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
                            markAllAsPurchased()
                          }}
                        >
                          <ListChecks />
                          Mark all as {areAllPurchased ? 'unpurchased' : 'purchased'}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteAllItems()
                          }}
                        >
                          <Trash2 />
                          Delete all items
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 py-0 text-balance">
            <div className="space-y-1">
              {items
                .sort((a, b) => a.created.toDate().getTime() - b.created.toDate().getTime())
                .map((item) => {
                  const isNewlyAdded = newlyAddedItem === item.id

                  return (
                    <AnimatedContainer
                      key={`${item.id}-${isNewlyAdded ? 'highlighted' : 'normal'}`}
                      animation={isNewlyAdded ? 'highlightNewItem' : undefined}
                    >
                      <div key={`${item.id}`}>
                        <ShoppingListItem
                          item={item}
                          isMultiSelecting={isMultiSelecting}
                          isSelected={selectedItems.includes(item.id)}
                          onItemSelection={handleItemSelection}
                          sounds={sounds}
                        />
                      </div>
                    </AnimatedContainer>
                  )
                })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div
        ref={bottomRef}
        className={cn('', {
          'h-10': newlyAddedItem,
          'h-0': !newlyAddedItem,
        })}
      />
    </>
  )
}

export default ShoppingListCategory
