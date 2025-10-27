import type { User } from '~/types/User'

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

type UserMediaObjectProps = {
  user: User
}

const UserMediaObject = ({ user }: UserMediaObjectProps) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="border">
        <AvatarImage
          src={user.photoURL}
          gravatarEmail={user.email}
          alt={`${user.username} avatar`}
        />
        <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight">
        <span>{user.displayName}</span>
        <span className="text-muted-foreground text-xs">@{user.username.toLocaleLowerCase()}</span>
      </div>
    </div>
  )
}

export default UserMediaObject
