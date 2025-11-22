import { useQueryClient } from '@tanstack/react-query'
import { Timestamp } from 'firebase/firestore'
import {
  Check,
  Circle,
  Ellipsis,
  Minus,
  Plus,
  Settings,
  ShoppingBasket,
  Trash2,
  UserIcon,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { animated, useSpring } from 'react-spring'

import useAuth from '~/contexts/auth/useAuth'
import { useSoundsState } from '~/contexts/globalState'
import { useCheckboxSounds } from '~/lib/useCheckboxSounds'
import { cn } from '~/lib/utils'
import { useCreateShoppingListItem } from '~/services/shoppingList'
import { tripKeys, useDeletePackingListItem, useUpdatePackingListItem } from '~/services/trips'
import { type PackingListItem } from '~/types/PackingListItem'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
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

type TripPackingListItemProps = {
  item: PackingListItem
  isMultiSelecting: boolean
  isSelected: boolean
  onItemSelection: (itemId: string, isShiftClick: boolean, isCommandClick: boolean) => void
  sounds?: ReturnType<typeof useCheckboxSounds>
}

const TripPackingListItem = ({
  item,
  isMultiSelecting,
  isSelected,
  onItemSelection,
  sounds,
}: TripPackingListItemProps) => {
  const { id } = useParams()
  const { soundsEnabled } = useSoundsState()
  const { user } = useAuth()

  const queryClient = useQueryClient()

  const users = queryClient.getQueryData<User[]>(tripKeys.members(id ?? '', []))
  const trip = queryClient.getQueryData<Trip>(tripKeys.byId(id ?? ''))

  const springConfig = {
    tension: 400,
    friction: 22,
    clamp: !item.isPacked,
  }

  const [active, setActive] = useState(false)

  const filledScale = item.isPacked ? (active ? 1.4 : 1) : 0
  const filledSpring = useSpring({
    transform: `scale(${filledScale})`,
    config: springConfig,
  })

  const outlineScale = active ? 0.8 : 1
  const outlineSpring = useSpring({
    transform: `scale(${outlineScale})`,
    config: springConfig,
  })

  const { mutateAsync: updatePackingListItemAsync } = useUpdatePackingListItem({ tripId: id ?? '' })
  const { mutateAsync: deletePackingListItemAsync } = useDeletePackingListItem()
  const { mutateAsync: createShoppingListItemAsync } = useCreateShoppingListItem()

  const togglePacked = () => {
    if (!id || !item.id) return

    updatePackingListItemAsync({ data: { id: item.id, isPacked: !item.isPacked } })
  }

  const handleQuantityChange = (change: number) => {
    if (!id || !item.id) return

    const newQuantity = item.quantity + change

    if (newQuantity < 1) return

    updatePackingListItemAsync({ data: { id: item.id, quantity: newQuantity } })
  }

  const handleMoveToOrFromGroupItems = () => {
    if (!id || !item.id) return

    const isAlreadyShared = item.packedBy[0].isShared

    updatePackingListItemAsync({
      data: { id: item.id, packedBy: [{ ...item.packedBy[0], isShared: !isAlreadyShared }] },
    })
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
      togglePacked()
    }
  }

  const handleSendToShoppingList = () => {
    if (!id || !item.id || !trip || !user) return

    createShoppingListItemAsync({
      data: {
        actualPrice: null,
        created: Timestamp.now(),
        estimatedPrice: null,
        isPurchased: false,
        itemName: item.name,
        notes: '',
        priority: 'no priority',
        purchasedAt: null,
        quantity: item.quantity,
        sourcePackingListItemId: item.id,
        store: null,
        tripId: trip.tripId,
        updated: null,
        userId: user.uid,
      },
    })
  }

  return (
    <div className="text-sidebar-foreground hover:bg-sidebar-accent/40 rounded-lg px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMultiSelecting ? (
            <>
              <Checkbox checked={isSelected} onClick={(e) => handleSelection(e)} id={item.id} />
              <span className="cursor-pointer select-none" onClick={(e) => handleSelection(e)}>
                {item.name}
              </span>
            </>
          ) : (
            <>
              <animated.div
                style={outlineSpring}
                onClick={togglePacked}
                onMouseDown={() => {
                  setActive(true)
                  if (soundsEnabled) {
                    sounds?.playActive()
                  }
                }}
                onMouseUp={() => {
                  setActive(false)
                  if (soundsEnabled) {
                    item.isPacked ? sounds?.playOff() : sounds?.playOn()
                  }
                }}
              >
                {item.isPacked ? (
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
              <span className={cn('select-none', item.isPacked && 'text-muted-foreground')}>
                {item.name}
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
              <div className="*:data-[slot=avatar]:ring-sidebar flex -space-x-2 *:data-[slot=avatar]:ring-1">
                {item.packedBy?.map((packedBy) => {
                  const user = users?.find((user) => user.uid === packedBy.uid)
                  if (!user || !item.isPacked) return null
                  return (
                    <Avatar key={packedBy.uid} className="size-6">
                      <AvatarImage src={user?.photoURL} />
                      <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )
                })}
              </div>
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
                  <DropdownMenuItem>
                    <Settings />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleMoveToOrFromGroupItems}>
                    {item.packedBy[0].isShared ? <UserIcon /> : <Users />}{' '}
                    {item.packedBy[0].isShared ? 'Move to Personal Items' : 'Move to Group Items'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSendToShoppingList}>
                    <ShoppingBasket />
                    Send to Shopping List
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

export default TripPackingListItem
