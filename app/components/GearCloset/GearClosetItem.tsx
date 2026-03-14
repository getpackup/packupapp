import { Ellipsis, Pencil, Trash2 } from 'lucide-react'

import TagPills from '~/components/TagPills'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import type { GearClosetItem as GearClosetItemType } from '~/types/GearItem'

type GearClosetItemProps = {
  item: GearClosetItemType & { category?: string; isMasterItem?: boolean }
  onEdit?: () => void
  onDelete?: () => void
}

const GearClosetItem = ({ item, onEdit, onDelete }: GearClosetItemProps) => {
  return (
    <div className="text-sidebar-foreground hover:bg-sidebar-accent/40 flex items-center justify-between rounded-lg px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate">{item.name}</span>
        {item.weight && (
          <span className="text-muted-foreground shrink-0 text-xs">
            {item.weight}
            {item.weightUnit ?? 'g'}
          </span>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <TagPills item={item} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="shrink-0">
              <Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil />
                Edit
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} variant="destructive">
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default GearClosetItem
