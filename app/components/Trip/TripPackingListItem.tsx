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
import { useState } from 'react'
import { useParams } from 'react-router'
import { animated, useSpring } from 'react-spring'

import { useSoundsState } from '~/contexts/globalState'
import { useCheckboxSounds } from '~/lib/useCheckboxSounds'
import { cn } from '~/lib/utils'
import { usePackingListItem } from '~/services/usePackingListItem'
import { type PackingListItem } from '~/types/PackingListItem'

import { AccountGateDialog } from '../AccountGateDialog'
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

  const {
    trip,
    users,
    togglePacked,
    handleQuantityChange,
    handleMoveToOrFromGroupItems,
    handleToggleAssignee,
    handleDelete,
    handleSendToShoppingList,
    showAccountGate,
    setShowAccountGate,
  } = usePackingListItem(item, id ?? '')

  const handleSelection = (event?: React.MouseEvent) => {
    if (isMultiSelecting) {
      const isShiftClick = event?.shiftKey ?? false
      const isCommandClick = (event?.metaKey ?? false) || (event?.ctrlKey ?? false)
      onItemSelection(item.id, isShiftClick, isCommandClick)
    } else {
      togglePacked()
    }
  }

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

  return (
    <div className="text-sidebar-foreground hover:bg-sidebar-accent/40 rounded-lg px-3 py-2">
      <EditPackingListItemDialog item={item} open={editOpen} onOpenChange={setEditOpen} />
      <AccountGateDialog
        open={showAccountGate}
        onOpenChange={setShowAccountGate}
        message="Create an account to build your shopping list across all your trips."
      />
      <div className="flex items-center justify-between gap-2">
        <div>
          {isMultiSelecting ? (
            <>
              <Checkbox checked={isSelected} onClick={handleSelection} id={item.id} />
              <span className="cursor-pointer select-none" onClick={handleSelection}>
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
            </>
          )}
        </div>

        <div className="flex w-full min-w-0 items-center gap-2">
          <span
            className={cn(
              'min-w-0 shrink truncate select-none',
              item.isPacked && 'text-muted-foreground'
            )}
          >
            <span className="text-left whitespace-nowrap">{item.name}</span>
          </span>
          {item.weight && (
            <Badge className="h-5 min-w-5 rounded-full font-mono tabular-nums" variant="outline">
              {item.weight}
              {item.weightUnit ?? 'g'}
            </Badge>
          )}
          {item.quantity && item.quantity !== 1 && (
            <Badge className="h-5 min-w-5 rounded-full font-mono tabular-nums" variant="outline">
              <X className="h-3 w-3" /> {item.quantity}
            </Badge>
          )}
          <TagPills item={item} />
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {!isMultiSelecting && (
            <>
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
