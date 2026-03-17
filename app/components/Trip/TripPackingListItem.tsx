import { useQueryClient } from '@tanstack/react-query'
import { limit, Timestamp, where } from 'firebase/firestore'
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
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { animated, useSpring } from 'react-spring'

import useAuth from '~/contexts/auth/useAuth'
import { useSoundsState } from '~/contexts/globalState'
import { useCheckboxSounds } from '~/lib/useCheckboxSounds'
import { cn } from '~/lib/utils'
import { useCreateShoppingListItem } from '~/services/shoppingList'
import { tripKeys, useDeletePackingListItem, useUpdatePackingListItem } from '~/services/trips'
import { type PackedByUserType, type PackingListItem } from '~/types/PackingListItem'
import type { Trip } from '~/types/Trip'
import type { User } from '~/types/User'

import TagPills from '../TagPills'
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import EditPackingListItemDialog from './EditPackingListItemDialog'

type TripPackingListItemProps = {
  item: PackingListItem
  isMultiSelecting: boolean
  isSelected: boolean
  onItemSelection: (itemId: string, isShiftClick: boolean, isCommandClick: boolean) => void
  sounds?: ReturnType<typeof useCheckboxSounds>
  isGroup?: boolean
}

const TripPackingListItem = ({
  item,
  isMultiSelecting,
  isSelected,
  onItemSelection,
  sounds,
  isGroup,
}: TripPackingListItemProps) => {
  const { id } = useParams()
  const { soundsEnabled } = useSoundsState()
  const { user } = useAuth()

  const queryClient = useQueryClient()

  const trip = queryClient.getQueryData<Trip>(tripKeys.byId(id ?? ''))

  const constraints = useMemo(
    () =>
      trip?.tripMembers && Object.keys(trip.tripMembers).length > 0
        ? [where('uid', 'in', Object.keys(trip.tripMembers)), limit(10)]
        : [],
    [trip?.tripMembers]
  )
  const users = id ? queryClient.getQueryData<User[]>(tripKeys.members(id, constraints)) : []

  const springConfig = {
    tension: 400,
    friction: 22,
    clamp: !item.isPacked,
  }

  const [active, setActive] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

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
    if (!id || !item.id || !user) return

    const isAlreadyShared = item.packedBy[0].isShared

    if (isAlreadyShared) {
      updatePackingListItemAsync({
        data: { id: item.id, packedBy: [{ uid: user.uid, quantity: 1, isShared: false }] },
      })
    } else {
      updatePackingListItemAsync({
        data: {
          id: item.id,
          packedBy: [{ uid: user.uid, quantity: 1, isShared: true }],
        },
      })
    }
  }

  const handleToggleAssignee = (uid: string) => {
    if (!id || !item.id) return

    const isAssigned = item.packedBy.some((p) => p.uid === uid)
    let newPackedBy: PackedByUserType[]

    if (isAssigned) {
      newPackedBy = item.packedBy.filter((p) => p.uid !== uid)
      if (newPackedBy.length === 0) return
    } else {
      newPackedBy = [...item.packedBy, { uid, quantity: 1, isShared: true }]
    }

    updatePackingListItemAsync({ data: { id: item.id, packedBy: newPackedBy } })
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
      <EditPackingListItemDialog item={item} open={editOpen} onOpenChange={setEditOpen} />
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-4">
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
              <span
                className={cn('truncate select-none', item.isPacked && 'text-muted-foreground')}
              >
                {item.name}
              </span>
              {item.weight && (
                <span className="text-muted-foreground text-xs">
                  {item.weight}
                  {item.weightUnit ?? 'g'}
                </span>
              )}
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
        <div className="flex min-w-0 items-center gap-2">
          {!isMultiSelecting && (
            <>
              <TagPills item={item} />
              {isGroup && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex shrink-0 cursor-pointer items-center -space-x-2 rounded-full transition-opacity hover:opacity-80"
                    >
                      {item.packedBy.length > 0 ? (
                        <div className="*:data-[slot=avatar]:ring-sidebar flex shrink-0 -space-x-2 *:data-[slot=avatar]:ring-1">
                          {item.packedBy.map((packedBy) => {
                            const assignedUser = users?.find((u) => u.uid === packedBy.uid)
                            if (!assignedUser) return null
                            return (
                              <Tooltip key={packedBy.uid}>
                                <TooltipTrigger asChild>
                                  <Avatar className="size-6 border">
                                    <AvatarImage
                                      src={assignedUser.photoURL}
                                      gravatarEmail={assignedUser.email}
                                    />
                                    <AvatarFallback>
                                      {assignedUser.displayName?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>{assignedUser.displayName}</TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="border-border text-muted-foreground flex h-6 w-6 items-center justify-center rounded-full border border-dashed">
                          <UserPlus className="h-3 w-3" />
                        </div>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <p className="text-muted-foreground mb-2 px-2 text-xs font-medium">Assign to</p>
                    {users?.map((u) => {
                      const isAssigned = item.packedBy.some((p) => p.uid === u.uid)
                      return (
                        <div
                          key={u.uid}
                          role="button"
                          tabIndex={0}
                          className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                          onClick={() => handleToggleAssignee(u.uid)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleToggleAssignee(u.uid)
                            }
                          }}
                        >
                          <Checkbox
                            checked={isAssigned}
                            className="pointer-events-none"
                            tabIndex={-1}
                          />
                          <Avatar className="size-5">
                            <AvatarImage src={u.photoURL} gravatarEmail={u.email} />
                            <AvatarFallback>
                              {u.displayName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{u.displayName}</span>
                        </div>
                      )
                    })}
                  </PopoverContent>
                </Popover>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" className="shrink-0">
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
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Settings />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {trip?.tripMembers && Object.keys(trip.tripMembers).length > 1 && (
                    <>
                      <DropdownMenuItem onClick={handleMoveToOrFromGroupItems}>
                        {item.packedBy[0].isShared ? <UserIcon /> : <Users />}{' '}
                        {item.packedBy[0].isShared
                          ? 'Move to Personal Items'
                          : 'Move to Group Items'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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
