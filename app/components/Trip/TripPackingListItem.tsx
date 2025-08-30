import { useQueryClient } from '@tanstack/react-query'
import { Check, Circle, Ellipsis, Minus, Plus, Settings, Trash2, Users, X } from 'lucide-react'
import { useParams } from 'react-router'

import { type PackingListItem } from '~/types/PackingListItem'
import type { User } from '~/types/User'

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

type TripPackingListItemProps = {
  item: PackingListItem
}

const TripPackingListItem = ({ item }: TripPackingListItemProps) => {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const users = queryClient.getQueryData<User[]>(['firebase', 'docs', 'trips', id, 'tripMembers'])
  return (
    <div className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {item.isPacked ? (
            <span className="bg-success/80 hover:bg-success flex h-6 w-6 items-center justify-center rounded-full">
              <Check className="text-foreground h-4 w-4" strokeWidth={3} />
            </span>
          ) : (
            <Circle className="text-muted-foreground/80 hover:text-muted-foreground h-6 w-6" />
          )}
          {item.name}
          {item.quantity && item.quantity !== 1 && (
            <Badge className="h-5 min-w-5 rounded-full font-mono tabular-nums" variant="outline">
              <X className="h-3 w-3" /> {item.quantity}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
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
            <DropdownMenuTrigger>
              <Ellipsis className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="flex justify-between p-0">
                <Button variant="ghost" size="sm">
                  <Minus />
                </Button>
                {item.quantity}
                <Button variant="ghost" size="sm">
                  <Plus />
                </Button>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Users /> Move to Group Items
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export default TripPackingListItem
