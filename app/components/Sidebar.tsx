import { format } from 'date-fns'
import {
  CircleQuestionMark,
  EllipsisVertical,
  ExternalLink,
  Loader2,
  LogOut,
  MapIcon,
  MenuIcon,
  MessageSquareIcon,
  MountainSnow,
  PlusCircle,
  Settings,
  ShirtIcon,
  ShoppingCartIcon,
  User,
  UserPlus,
  UsersIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { animated } from 'react-spring'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { useAuth } from '~/contexts/auth/useAuth'
import { useFeedbackModalState, useHelpModalState, useSidebarState } from '~/contexts/globalState'
import { firebaseAuth } from '~/firebase/config'
import useBoop from '~/lib/useBoop'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { usePlan } from '~/lib/usePlan'
import { cn } from '~/lib/utils'
import { usePendingFriendRequestsQuery } from '~/services/friends'

import { Logo } from './Logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface SidebarProps {
  className?: string
}

const PRICING_URL = 'https://getpackup.com/pricing'

export function Sidebar({ className }: SidebarProps) {
  const { user, setUser } = useAuth()
  const isAnonymous = useIsAnonymous()
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebarState()
  const { isPro, isFree } = usePlan()
  const { setIsFeedbackOpen } = useFeedbackModalState()
  const { setIsHelpOpen } = useHelpModalState()
  const [nextStyle, triggerNext] = useBoop({ x: 2 }) as [any, () => void]
  const [animatingItem, setAnimatingItem] = useState<string | null>(null)
  const { data: pendingRequests } = usePendingFriendRequestsQuery(user?.uid ?? '')

  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut()
      setUser(null)
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const navigationItems = [
    { icon: PlusCircle, label: 'New Trip', href: '/trips/new' },
    { icon: MapIcon, label: 'Trips', href: '/trips' },
    { icon: ShirtIcon, label: 'Gear Closet', href: '/gear-closet' },
    // { icon: Files, label: 'Packing List Templates', href: '/templates' },
    { icon: ShoppingCartIcon, label: 'Shopping List', href: '/shopping-list' },
    { icon: UsersIcon, label: 'Friends', href: '/friends' },
  ]

  const bottomItems = [
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  const isActive = (href: string) => {
    const basePath = href.split('/')[1]
    const locationBasePath = location.pathname.split('/')[1]
    if (basePath && locationBasePath && basePath === locationBasePath) {
      if (href === `/${basePath}`) {
        return location.pathname === href || location.pathname.startsWith(`/${basePath}/`)
      } else {
        return location.pathname === href
      }
    }

    return false
  }

  const handleItemAnimation = (itemLabel: string) => {
    setAnimatingItem(itemLabel)
    triggerNext()

    setTimeout(() => setAnimatingItem(null), 150)
  }

  return (
    <div
      className={cn(
        'bg-sidebar border-sidebar-border flex h-full flex-col border-r transition-all duration-300',
        isSidebarCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <div
        className={cn('border-sidebar-border flex items-center border-b p-2', {
          'justify-center': isSidebarCollapsed,
          'justify-between': !isSidebarCollapsed,
        })}
      >
        {!isSidebarCollapsed && (
          <div className="ml-2 flex items-center gap-2">
            <Logo className="size-8" fill="var(--sidebar-foreground)" />{' '}
            <h2 className="text-sidebar-foreground text-xl font-bold">packup</h2>
          </div>
        )}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-center rounded-lg px-3 py-2 transition-colors"
        >
          <MenuIcon className="h-5 w-5 shrink-0" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-2">
          {navigationItems.map((item, index) => (
            <li key={item.label}>
              <Link
                to={item.href}
                onMouseDown={() => handleItemAnimation(item.label)}
                className={cn(
                  'group text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex h-10 items-center rounded-lg px-3 py-2 transition-colors',
                  {
                    'justify-center': isSidebarCollapsed,
                    'gap-3': !isSidebarCollapsed,
                    'bg-sidebar-accent': isActive(item.href),
                    'text-accent-foreground hover:text-accent-foreground bg-accent hover:bg-accent/80':
                      index === 0,
                  }
                )}
              >
                <animated.span
                  style={animatingItem === item.label ? nextStyle : undefined}
                  className="flex items-center gap-2"
                >
                  <item.icon
                    className={cn('h-5 w-5 shrink-0', {
                      'transition-transform duration-300 group-hover:rotate-90': index === 0,
                    })}
                  />

                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </animated.span>
                {item.label === 'Friends' && pendingRequests && pendingRequests.length > 0 && (
                  <span className="bg-destructive ml-auto flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-(--destructive-foreground)">
                    {pendingRequests.length}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-sidebar-border border-t p-2">
        <div className="">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="text-sidebar-foreground hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent hover:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex items-center justify-center gap-2 rounded-lg px-3 py-2 transition-colors">
                <Avatar className="h-8 w-8 border">
                  {isAnonymous ? (
                    <AvatarFallback>
                      <User className="size-4" />
                    </AvatarFallback>
                  ) : (
                    <>
                      <AvatarImage
                        src={user?.photoURL ?? ''}
                        alt={`${user?.username.toLocaleLowerCase()} avatar`}
                        gravatarEmail={user?.email}
                      />
                      <AvatarFallback>
                        {user?.displayName?.charAt(0) ??
                          (user ? <Loader2 className="h-4 w-4 animate-spin" /> : '?')}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                {!isSidebarCollapsed && (
                  <>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">
                        {isAnonymous ? 'Anonymous User' : user?.displayName}
                      </span>
                      {!isAnonymous && (
                        <span className="text-muted-foreground truncate text-xs">
                          @{user?.username.toLocaleLowerCase()}
                        </span>
                      )}
                    </div>
                    <EllipsisVertical className="ml-auto size-4" />
                  </>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side="right"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-start gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-12 border">
                    {isAnonymous ? (
                      <AvatarFallback>
                        <User className="size-6" />
                      </AvatarFallback>
                    ) : (
                      <>
                        <AvatarImage
                          src={user?.photoURL ?? ''}
                          alt={`${user?.username.toLocaleLowerCase()} avatar`}
                          gravatarEmail={user?.email}
                        />
                        <AvatarFallback>
                          {user?.displayName?.charAt(0) ??
                            (user ? <Loader2 className="h-4 w-4 animate-spin" /> : '?')}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="font-bold">
                      {isAnonymous ? 'Anonymous User' : user?.displayName}
                    </span>

                    <span className={isAnonymous ? 'italic' : undefined}>
                      {isAnonymous
                        ? 'Pending account creation'
                        : `@${user?.username.toLocaleLowerCase()}`}
                    </span>
                    {user?.createdAt && (
                      <span className="text-muted-foreground text-xs">
                        Joined {format(user.createdAt.toDate(), 'MMMM do, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAnonymous ? (
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/signup" className="font-bold">
                      <UserPlus className="size-4" />
                      Create Account
                    </Link>
                  </DropdownMenuItem>
                  {bottomItems
                    .filter((item) => item.label !== 'Profile')
                    .map((item) => (
                      <DropdownMenuItem key={item.label} asChild>
                        <Link to={item.href}>
                          <item.icon />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
              ) : (
                <DropdownMenuGroup>
                  {bottomItems.map((item) => (
                    <DropdownMenuItem key={item.label} asChild>
                      <Link to={item.href}>
                        <item.icon />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              )}
              {!isAnonymous && (
                <>
                  <DropdownMenuSeparator />
                  {isFree && (
                    <DropdownMenuItem asChild>
                      <a
                        href={`${PRICING_URL}?uid=${user?.uid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MountainSnow className="size-4" />
                        Upgrade to Pro
                        <ExternalLink className="size-4" />
                      </a>
                    </DropdownMenuItem>
                  )}
                  {isPro && (
                    <DropdownMenuItem asChild>
                      <form action="/resource/manage-subscription" method="post">
                        <input type="hidden" name="uid" value={user?.uid} />
                        <button type="submit" className="flex w-full items-center gap-2">
                          <MountainSnow className="size-4" />
                          Manage Subscription
                        </button>
                      </form>
                    </DropdownMenuItem>
                  )}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsFeedbackOpen(true)}>
                <MessageSquareIcon />
                Feedback
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsHelpOpen(true)}>
                <CircleQuestionMark />
                Help / Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
