import { format } from 'date-fns'
import {
  CircleAlert,
  Copy,
  Heart,
  type LucideIcon,
  MoreVertical,
  Reply,
  Smile,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { useParams } from 'react-router'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import useAuth from '~/contexts/auth/useAuth'
import { cn } from '~/lib/utils'
import { useDeleteChatMessage, useUpdateChatMessage } from '~/services/trips'
import type { ChatMessage } from '~/types/Chat'
import type { User } from '~/types/User'

import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

const iconMap: Record<string, LucideIcon> = {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Smile,
  CircleAlert,
}

const emojiNameMap: Record<string, string> = {
  Heart: 'Heart',
  ThumbsUp: 'Like',
  ThumbsDown: 'Dislike',
  Smile: 'Smile',
  CircleAlert: 'Exclamation',
}

interface MessageBubbleProps {
  message: ChatMessage
  user: User
  isCurrentUser: boolean
  userMap: Map<string, User>
  setReplyToMessageId: (messageId: string) => void
  replyToMessageContent: string | null
}

export default function MessageBubble({
  message,
  user,
  isCurrentUser,
  userMap,
  setReplyToMessageId,
  replyToMessageContent,
}: MessageBubbleProps) {
  const { user: currentUser } = useAuth()
  const { id } = useParams()
  const { mutateAsync: deleteMessageAsync } = useDeleteChatMessage()

  const { mutateAsync: updateMessage } = useUpdateChatMessage({
    tripId: id ?? '',
    chatMessageId: message.id,
  })

  const onReact = (emoji: string) => {
    if (!id || !message.id || !currentUser?.uid) return

    const existingReactions = message.reactions || {}
    const existingUsers = existingReactions[emoji] || []
    const userIndex = existingUsers.indexOf(currentUser.uid)

    let updatedUsers: string[]
    if (userIndex > -1) {
      // User already reacted - remove them (toggle off)
      updatedUsers = existingUsers.filter((uid) => uid !== currentUser.uid)
    } else {
      // User hasn't reacted - add them (toggle on)
      updatedUsers = [...existingUsers, currentUser.uid]
    }

    const updatedReactions = { ...existingReactions }

    if (updatedUsers.length === 0) {
      // If no users left for this emoji, remove the key entirely
      delete updatedReactions[emoji]
    } else {
      // Update the emoji with the new user array
      updatedReactions[emoji] = updatedUsers
    }

    updateMessage({
      data: { reactions: updatedReactions },
    })
  }

  const onDelete = () => {
    if (!id || !message.id) return
    deleteMessageAsync({ tripId: id, chatMessageId: message.id })
  }

  return (
    <div className="group flex w-full gap-2 last:pb-4">
      <Avatar className="mt-1 size-8 border">
        <AvatarImage
          src={user.photoURL ?? ''}
          alt={`${user.username?.toLocaleLowerCase()} avatar`}
          gravatarEmail={user.email}
        />
        <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex w-full flex-col items-start gap-1">
        <div className="flex w-full items-center gap-2">
          <span className="text-sidebar-foreground max-w-1/2 truncate text-sm font-bold">
            {user.username}
          </span>
          <span className="text-muted-foreground max-w-1/2 shrink-0 text-xs">
            {format(message.createdAt.toDate(), 'MMM d, yyyy h:mm a')}
          </span>
        </div>

        {message.replyToMessageId && typeof replyToMessageContent === 'string' && (
          <div className="flex w-full max-w-[95%] items-end justify-start gap-2">
            <Reply className="text-muted-foreground size-4 scale-x-[-1]" />
            <div className="bg-muted relative max-w-[80%] min-w-0 rounded-lg px-4 py-2">
              <p className="text-sm wrap-break-word whitespace-pre-wrap italic">
                {replyToMessageContent}
              </p>
            </div>
          </div>
        )}
        <div className="group flex w-full max-w-[95%] min-w-0 items-center gap-2">
          <div
            className={cn('bg-muted relative max-w-[75%] min-w-0 rounded-lg px-4 py-2', {
              'bg-accent text-accent-foreground': isCurrentUser && message.type !== 'system',
              'max-w-full': message.type === 'system',
            })}
          >
            <p className="text-sm wrap-break-word whitespace-pre-wrap">{message.content}</p>
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="bg-muted absolute -bottom-3 left-2 flex gap-2 rounded-lg border px-2 py-1">
                {Object.entries(message.reactions)
                  .sort(([emojiA], [emojiB]) => {
                    const iconOrder = Object.keys(iconMap)
                    const indexA = iconOrder.indexOf(emojiA)
                    const indexB = iconOrder.indexOf(emojiB)
                    // If emoji not found in iconMap, put it at the end
                    if (indexA === -1) return 1
                    if (indexB === -1) return -1
                    return indexA - indexB
                  })
                  .map(([emoji, users]) => {
                    const usernames = users.map((user) => userMap.get(user)?.username)
                    const IconComponent = iconMap[emoji]

                    return (
                      <div key={emoji}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => onReact(emoji)}
                              className={cn('', {
                                '*:fill-accent/20 *:stroke-accent': message.reactions?.[
                                  emoji
                                ]?.includes(currentUser?.uid ?? ''),
                              })}
                            >
                              <IconComponent className="size-3 text-gray-700 opacity-80 hover:opacity-100 dark:text-gray-300" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 text-sm font-bold">
                                <IconComponent className="size-3" />
                                {emojiNameMap[emoji]}
                              </div>
                              {usernames.map((username) => (
                                <span key={username}>{username}</span>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {message.type !== 'system' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="animate-in fade-in opacity-0 duration-300 ease-in-out group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  asChild
                  className="p-0 hover:bg-transparent! focus:bg-transparent!"
                >
                  <div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onReact('Heart')}
                      className={cn('', {
                        '*:fill-accent/20 *:stroke-accent': message.reactions?.Heart?.includes(
                          currentUser?.uid ?? ''
                        ),
                      })}
                    >
                      <Heart />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onReact('ThumbsUp')}
                      className={cn('', {
                        '*:fill-accent/20 *:stroke-accent': message.reactions?.ThumbsUp?.includes(
                          currentUser?.uid ?? ''
                        ),
                      })}
                    >
                      <ThumbsUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onReact('ThumbsDown')}
                      className={cn('', {
                        '*:fill-accent/20 *:stroke-accent': message.reactions?.ThumbsDown?.includes(
                          currentUser?.uid ?? ''
                        ),
                      })}
                    >
                      <ThumbsDown />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onReact('Smile')}
                      className={cn('', {
                        '*:fill-accent/20 *:stroke-accent': message.reactions?.Smile?.includes(
                          currentUser?.uid ?? ''
                        ),
                      })}
                    >
                      <Smile />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onReact('CircleAlert')}
                      className={cn('', {
                        '*:fill-accent/20 *:stroke-accent':
                          message.reactions?.CircleAlert?.includes(currentUser?.uid ?? ''),
                      })}
                    >
                      <CircleAlert />
                    </Button>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setReplyToMessageId(message.id)}>
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
