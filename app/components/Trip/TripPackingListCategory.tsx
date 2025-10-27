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
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { cn } from '~/lib/utils'
import { useDeleteSubCollectionDocument, useUpdateSubCollectionDocument } from '~/services/api'
import type { PackingListItem } from '~/types/PackingListItem'

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
import AddPackingListDialog from './AddPackingListDialog'
import TripPackingListItem from './TripPackingListItem'
import { usePackingListCategoryHotkeys } from './usePackingListCategoryHotkeys'
import { usePackingListCategorySelection } from './usePackingListCategorySelection'

type TripPackingListCategoryProps = {
  categoryName: string
  items: PackingListItem[]
  isGroup?: boolean
}

const TripPackingListCategory = ({
  categoryName,
  items,
  isGroup,
}: TripPackingListCategoryProps) => {
  const [isMultiSelecting, setIsMultiSelecting] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null)
  const [accordionOpen, setAccordionOpen] = useState(true)
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  const [newlyAddedItem, setNewlyAddedItem] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  const { mutate: updatePackingListItem } = useUpdateSubCollectionDocument('trips', 'packing-list')
  const { mutate: deletePackingListItem } = useDeleteSubCollectionDocument('trips', 'packing-list')
  const { id } = useParams()

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

  const areAllPacked = items.every((item) => item.isPacked)

  const markSelectedAsPacked = () => {
    if (!id || !selectedItems.length) return
    selectedItems.forEach((item) => {
      const itemData = items.find((i) => i.id === item)
      if (!itemData) return
      updatePackingListItem({ parentDocId: id, id: item, data: { isPacked: true } })
    })
    toast.success(
      `${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'items'} marked as packed`
    )
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
    setIsMultiSelecting(false)
    toast.success(
      `${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'items'} deleted`
    )
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

  const { handleItemSelection } = usePackingListCategorySelection(
    isMultiSelecting,
    lastSelectedItem,
    items,
    selectedItems,
    setSelectedItems,
    setLastSelectedItem
  )

  usePackingListCategoryHotkeys(
    isMultiSelecting,
    clearOrExitMultiSelect,
    deleteSelectedItems,
    markSelectedAsPacked,
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

  return (
    <>
      <Accordion
        type="single"
        collapsible
        className={cn('w-full rounded-lg', {
          '-mr-1 -ml-1 bg-gray-200/50 px-1 dark:bg-gray-700/50': isGroup,
        })}
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
              className="focus-visible:border-ring focus-visible:ring-ring/50 mx-2 flex w-full justify-between border-b pb-2 transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
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
                <div>
                  <div className="text-lg font-semibold">
                    {categoryName}{' '}
                    {isMultiSelecting ? null : (
                      <ChevronDown className="inline h-4 w-4 group-data-[state=closed]/accordion:rotate-180" />
                    )}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {!isMultiSelecting && items.length > 0 && (
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
                          <Separator orientation="vertical" className="!h-4" />{' '}
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
                            markSelectedAsPacked()
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <ListChecks />
                            Mark selected as packed
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
                    <AddPackingListDialog
                      categoryName={categoryName}
                      onItemCreated={handleItemCreated}
                    />

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
                        {!isGroup && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteAllItems()
                            }}
                          >
                            <Trash2 />
                            Delete all in {categoryName}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-balance">
            <div className="space-y-1">
              {isGroup && items.length === 0 && (
                <div className="text-muted-foreground text-center text-sm">No group items yet</div>
              )}
              {items.map((item) => {
                const isNewlyAdded = newlyAddedItem === item.id

                return (
                  <AnimatedContainer
                    key={`${item.id}-${isNewlyAdded ? 'highlighted' : 'normal'}`}
                    animation={isNewlyAdded ? 'highlightNewItem' : undefined}
                  >
                    <TripPackingListItem
                      item={item}
                      isMultiSelecting={isMultiSelecting}
                      isSelected={selectedItems.includes(item.id)}
                      onItemSelection={handleItemSelection}
                    />
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
          'h-[40px]': newlyAddedItem,
          'h-0': !newlyAddedItem,
        })}
      />
    </>
  )
}

export default TripPackingListCategory
