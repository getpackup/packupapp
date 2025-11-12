import { useQueryClient } from '@tanstack/react-query'
import { Check, Circle, Ellipsis, Minus, Plus, Settings, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { animated, useSpring } from 'react-spring'

import useAuth from '~/contexts/auth/useAuth'
import { useCheckboxSounds } from '~/lib/useCheckboxSounds'
import { cn } from '~/lib/utils'
import { useUpdateShoppingListItem } from '~/services/shoppingList'
import { tripKeys, useDeletePackingListItem } from '~/services/trips'
import type { ShoppingListItemType } from '~/types/ShoppingListItem'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

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
  const { id } = useParams()
  const { user } = useAuth()

  const queryClient = useQueryClient()

  const users = queryClient.getQueryData<User[]>(tripKeys.members(id ?? '', []))
  const trip = queryClient.getQueryData<Trip>(tripKeys.byId(id ?? ''))

  console.log({ user, users, trip })

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

  const { mutateAsync: updateShoppingListItemAsync } = useUpdateShoppingListItem(item.id)
  const { mutateAsync: deletePackingListItemAsync } = useDeletePackingListItem()
  // const { mutateAsync: createShoppingListItemAsync } = useCreateShoppingListItem()

  const togglePurchased = () => {
    if (!id || !item.id) return

    updateShoppingListItemAsync({ data: { id: item.id, isPurchased: !item.isPurchased } })
  }

  const handleQuantityChange = (change: number) => {
    if (!id || !item.id) return

    const newQuantity = item.quantity + change

    if (newQuantity < 1) return

    updateShoppingListItemAsync({ data: { id: item.id, quantity: newQuantity } })
  }

  const handleDelete = () => {
    if (!id || !item.id) return

    deletePackingListItemAsync({
      tripId: id,
      packingListItemId: item.id,
    })
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
    <div className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMultiSelecting ? (
            <>
              <Checkbox checked={isSelected} onClick={(e) => handleSelection(e)} id={item.id} />
              <span className="cursor-pointer select-none" onClick={(e) => handleSelection(e)}>
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
                  sounds?.playActive()
                }}
                onMouseUp={() => {
                  setActive(false)
                  item.isPurchased ? sounds?.playOff() : sounds?.playOn()
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
                  <Circle className="text-muted-foreground/80 hover:text-muted-foreground h-6 w-6" />
                )}
              </animated.div>
              <span className={cn('select-none', item.isPurchased && 'text-muted-foreground')}>
                {item.itemName}
              </span>
              {item.quantity && item.quantity !== 1 && (
                <Badge
                  className="h-5 min-w-5 rounded-full font-mono tabular-nums"
                  variant="outline"
                >
                  <X className="h-3 w-3" /> {item.quantity}
                </Badge>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isMultiSelecting && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Ellipsis className="h-4 w-4" />
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
                  <DropdownMenuItem>
                    <Settings />
                    Edit
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
