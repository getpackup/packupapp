import { Timestamp } from 'firebase/firestore'
import { Check, Circle, Ellipsis, Minus, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { animated, useSpring } from 'react-spring'

import { useSoundsState } from '~/contexts/globalState'
import { formatMoneyWithCommas } from '~/lib/money'
import { useCheckboxSounds } from '~/lib/useCheckboxSounds'
import { cn } from '~/lib/utils'
import { useDeleteShoppingListItem, useUpdateShoppingListItem } from '~/services/shoppingList'
import type { ShoppingListItemType } from '~/types/ShoppingListItemType'

import PriorityIcon from '../PriorityIcon'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import EditShoppingListItem from './EditShoppingListItem'

type ShoppingListItemProps = {
  item: ShoppingListItemType
  isMultiSelecting: boolean
  isSelected: boolean
  onItemSelection: (itemId: string, isShiftClick: boolean, isCommandClick: boolean) => void
  sounds?: ReturnType<typeof useCheckboxSounds>
}

const ShoppingListItem = ({
  item,
  isMultiSelecting,
  isSelected,
  onItemSelection,
  sounds,
}: ShoppingListItemProps) => {
  const { soundsEnabled } = useSoundsState()

  const [isEditing, setIsEditing] = useState(false)

  const springConfig = {
    tension: 400,
    friction: 22,
    clamp: !item.isPurchased,
  }

  const [active, setActive] = useState(false)

  const filledScale = item.isPurchased ? (active ? 1.4 : 1) : 0
  const filledSpring = useSpring({
    transform: `scale(${filledScale})`,
    config: springConfig,
  })

  const outlineScale = active ? 0.8 : 1
  const outlineSpring = useSpring({
    transform: `scale(${outlineScale})`,
    config: springConfig,
  })

  const { mutateAsync: updateShoppingListItemAsync } = useUpdateShoppingListItem()
  const { mutateAsync: deleteShoppingListItemAsync } = useDeleteShoppingListItem()

  const togglePurchased = () => {
    if (!item.id) return

    const newIsPurchased = !item.isPurchased

    updateShoppingListItemAsync({
      data: {
        id: item.id,
        isPurchased: newIsPurchased,
        purchasedAt: newIsPurchased ? Timestamp.now() : null,
      },
    })
  }

  const handleQuantityChange = (change: number) => {
    if (!item.id) return

    const newQuantity = item.quantity + change

    if (newQuantity < 1) return

    updateShoppingListItemAsync({ data: { id: item.id, quantity: newQuantity } })
  }

  const handleDelete = () => {
    if (!item.id) return

    deleteShoppingListItemAsync({ id: item.id })
  }

  const handleSelection = (event?: React.MouseEvent) => {
    if (isMultiSelecting) {
      const isShiftClick = event?.shiftKey || false
      const isCommandClick = event?.metaKey || event?.ctrlKey || false
      onItemSelection(item.id, isShiftClick, isCommandClick)
    } else {
      togglePurchased()
    }
  }

  return (
    <div className="text-sidebar-foreground hover:bg-sidebar-accent/40 rounded-lg px-3 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {isMultiSelecting ? (
            <>
              <Checkbox checked={isSelected} onClick={(e) => handleSelection(e)} id={item.id} />
              <span
                className="cursor-pointer truncate select-none"
                onClick={(e) => handleSelection(e)}
              >
                {item.itemName}
              </span>
            </>
          ) : (
            <>
              <animated.div
                style={outlineSpring}
                onClick={togglePurchased}
                onMouseDown={() => {
                  setActive(true)
                  if (soundsEnabled) {
                    sounds?.playActive()
                  }
                }}
                onMouseUp={() => {
                  setActive(false)
                  if (soundsEnabled) {
                    item.isPurchased ? sounds?.playOff() : sounds?.playOn()
                  }
                }}
              >
                {item.isPurchased ? (
                  <animated.span
                    style={filledSpring}
                    className="bg-success/80 hover:bg-success flex h-6 w-6 items-center justify-center rounded-full transition-colors"
                  >
                    <Check className="text-muted dark:text-foreground h-4 w-4" strokeWidth={3} />
                  </animated.span>
                ) : (
                  <Circle className="text-muted-foreground/80 hover:text-muted-foreground h-6 w-6 shrink-0" />
                )}
              </animated.div>
              <div className="flex min-w-0 flex-1 flex-col select-none">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      'truncate',
                      item.isPurchased && 'text-muted-foreground line-through'
                    )}
                  >
                    {item.itemName}
                  </span>
                  {item.quantity && item.quantity !== 1 && (
                    <Badge
                      className="h-5 min-w-5 shrink-0 rounded-full font-mono tabular-nums"
                      variant="outline"
                    >
                      <X className="h-3 w-3" /> {item.quantity}
                    </Badge>
                  )}
                </div>
                {(item.store || item.notes) && (
                  <div className="text-muted-foreground truncate text-xs">
                    {item.store && `${item.store}`}
                    {item.store && item.notes ? ' • ' : ''}
                    {item.notes && item.notes}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {item.estimatedPrice && (
            <Tooltip>
              <TooltipTrigger>
                <span
                  className={cn(
                    'text-muted-foreground font-mono text-xs tabular-nums',
                    item.actualPrice && 'line-through'
                  )}
                >
                  {formatMoneyWithCommas(item.estimatedPrice)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated price</p>
              </TooltipContent>
            </Tooltip>
          )}
          {item.actualPrice && (
            <Tooltip>
              <TooltipTrigger>
                <span className="font-mono text-xs tabular-nums">
                  {formatMoneyWithCommas(item.actualPrice)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Actual price</p>
              </TooltipContent>
            </Tooltip>
          )}
          {item.priority && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline">
                  <PriorityIcon priority={item.priority} withColor />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="capitalize">
                  {item.priority !== 'no priority' ? item.priority : 'No'} priority
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          {!isMultiSelecting && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <Ellipsis className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem className="flex justify-between p-0">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={item.quantity === 1}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuantityChange(-1)
                      }}
                    >
                      <Minus />
                    </Button>
                    {item.quantity}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuantityChange(1)
                      }}
                    >
                      <Plus />
                    </Button>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <EditShoppingListItem
                      item={item}
                      isEditing={isEditing}
                      setIsEditing={setIsEditing}
                    />
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleDelete} variant="destructive">
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShoppingListItem
