import { format } from 'date-fns'
import { Copy, Loader2, MoreVertical, Reply, Trash2 } from 'lucide-react'
import { useParams } from 'react-router'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'
import { useDeleteSubCollectionDocument } from '~/services/api'
import type { ChatMessage } from '~/types/Chat'
import type { User } from '~/types/User'

import { Button } from '../ui/button'

interface MessageBubbleProps {
  message: ChatMessage
  user?: User
  isCurrentUser: boolean
}

export default function MessageBubble({ message, user, isCurrentUser }: MessageBubbleProps) {
  const { id } = useParams()
  const { mutateAsync: deleteMessage } = useDeleteSubCollectionDocument('trips', 'messages')

  const onDelete = () => {
    if (!id || !message.id) return
    deleteMessage({ parentDocId: id, id: message.id })
  }
  return (
    <div className="flex w-full gap-2">
      {message.type === 'system' ? (
        <Avatar className="mt-1 size-8 border">
          <AvatarImage
            src="/icons/icon-192x192.png"
            alt="Packup yak logomark"
            gravatarEmail={undefined}
          />
        </Avatar>
      ) : (
        <Avatar className="mt-1 size-8 border">
          <AvatarImage
            src={user?.photoURL ?? ''}
            alt={`${user?.username.toLocaleLowerCase()} avatar`}
            gravatarEmail={user?.email}
          />
          <AvatarFallback>
            {user?.displayName?.charAt(0) ??
              (user ? <Loader2 className="h-4 w-4 animate-spin" /> : '?')}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex w-full flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sidebar-foreground text-sm font-bold">
            {message.type === 'system' ? 'Packup Yakbot' : user?.username}
          </span>
          <span className="text-muted-foreground text-xs">
            {format(message.createdAt.toDate(), 'MMM d, yyyy h:mm a')}
          </span>
        </div>

        <div className="flex max-w-[95%] min-w-0 items-center gap-2">
          <div
            className={cn('bg-muted max-w-[75%] min-w-0 flex-1 rounded-lg px-4 py-2', {
              'bg-accent text-accent-foreground': isCurrentUser && message.type !== 'system',
              'max-w-full': message.type === 'system',
            })}
          >
            <p className="text-sm wrap-break-word whitespace-pre-wrap">{message.content}</p>
          </div>

          {message.type !== 'system' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isCurrentUser ? 'end' : 'start'}>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </DropdownMenuItem>
                {isCurrentUser && (
                  <DropdownMenuItem onClick={onDelete} variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}
