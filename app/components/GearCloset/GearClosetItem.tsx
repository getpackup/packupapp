import { Ellipsis, EyeOff, Pencil, Trash2, Undo2 } from 'lucide-react'

import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { getItemTags } from '~/lib/getItemTags'
import type { GearClosetItem as GearClosetItemType } from '~/types/GearItem'

type GearClosetItemProps = {
  item: GearClosetItemType & { category?: string; isRemoved?: boolean; isMasterItem?: boolean }
  onEdit?: () => void
  onDelete?: () => void
  onHide?: () => void
  onRestore?: () => void
}

const GearClosetItem = ({ item, onEdit, onDelete, onHide, onRestore }: GearClosetItemProps) => {
  const tags = getItemTags(item)

  return (
    <div className="text-sidebar-foreground hover:bg-sidebar-accent/40 flex items-center justify-between rounded-lg px-3 py-2">
      <div className="flex items-center gap-3">
        <span className={item.isRemoved ? 'text-muted-foreground line-through' : ''}>
          {item.name}
        </span>
        {item.weight && (
          <span className="text-muted-foreground text-xs">
            {item.weight}
            {item.weightUnit ?? 'g'}
          </span>
        )}
        {tags.length > 1 && (
          <div className="flex gap-1">
            {tags.slice(1).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Ellipsis className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {item.isRemoved ? (
            <DropdownMenuItem onClick={onRestore}>
              <Undo2 />
              Restore item
            </DropdownMenuItem>
          ) : (
            <>
              {!item.isMasterItem && onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil />
                  Edit
                </DropdownMenuItem>
              )}
              {item.isMasterItem && onHide && (
                <>
                  <DropdownMenuItem onClick={onHide}>
                    <EyeOff />
                    Hide from closet
                  </DropdownMenuItem>
                </>
              )}
              {!item.isMasterItem && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} variant="destructive">
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default GearClosetItem
