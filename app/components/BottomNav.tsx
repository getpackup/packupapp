import { format } from 'date-fns'
import {
  CircleQuestionMark,
  Loader2,
  LogOut,
  MapIcon,
  Menu,
  MessageSquareIcon,
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

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { useAuth } from '~/contexts/auth/useAuth'
import { useFeedbackModalState, useHelpModalState } from '~/contexts/globalState'
import { firebaseAuth } from '~/firebase/config'
import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { cn } from '~/lib/utils'
import { usePendingFriendRequestsQuery } from '~/services/friends'

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer'
import { Separator } from './ui/separator'

const mainTabs = [
  { icon: MapIcon, label: 'Trips', href: '/trips' },
  { icon: ShirtIcon, label: 'Gear', href: '/gear-closet' },
  { icon: PlusCircle, label: 'New Trip', href: '/trips/new', isCenter: true },
  { icon: ShoppingCartIcon, label: 'Shop', href: '/shopping-list' },
]

const moreItems = [
  // { icon: Files, label: 'Templates', href: '/templates' },
  { icon: UsersIcon, label: 'Friends', href: '/friends' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

interface BottomNavProps {
  className?: string
}

export function BottomNav({ className }: BottomNavProps) {
  const { user, setUser } = useAuth()
  const isAnonymous = useIsAnonymous()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { setIsFeedbackOpen } = useFeedbackModalState()
  const { setIsHelpOpen } = useHelpModalState()
  const { data: pendingRequests } = usePendingFriendRequestsQuery(user?.uid ?? '')

  const isActive = (href: string) => {
    const basePath = href.split('/')[1]
    const locationBasePath = location.pathname.split('/')[1]
    if (basePath && locationBasePath && basePath === locationBasePath) {
      if (href === `/${basePath}`) {
        return location.pathname === href || location.pathname.startsWith(`/${basePath}/`)
      }
      return location.pathname === href
    }
    return false
  }

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut()
      setUser(null)
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const isMoreActive = moreItems.some((item) => isActive(item.href))

  return (
    <div
      className={cn(
        'bg-sidebar border-sidebar-border fixed inset-x-0 bottom-0 z-50 border-t pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <nav className="flex items-center justify-around px-2">
        {mainTabs.map((tab) => (
          <Link
            key={tab.href}
            to={tab.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
              tab.isCenter
                ? 'text-accent-foreground'
                : isActive(tab.href)
                  ? 'text-sidebar-accent-foreground'
                  : 'text-muted-foreground'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center rounded-full p-1.5 transition-colors',
                tab.isCenter
                  ? 'bg-accent text-accent-foreground'
                  : isActive(tab.href)
                    ? 'bg-sidebar-accent'
                    : ''
              )}
            >
              <tab.icon className={cn('size-5', tab.isCenter && 'size-6')} />
            </div>
            <span className="font-medium">{tab.label}</span>
          </Link>
        ))}

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
                isMoreActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-full p-1.5 transition-colors',
                  isMoreActive ? 'bg-sidebar-accent' : ''
                )}
              >
                <Menu className="size-5" />
              </div>
              <span className="font-medium">More</span>
            </button>
          </DrawerTrigger>
          <DrawerContent aria-describedby={undefined}>
            <DrawerHeader>
              <DrawerTitle>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border">
                    {isAnonymous ? (
                      <AvatarFallback>
                        <User className="size-5" />
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
                            (user ? <Loader2 className="size-4 animate-spin" /> : '?')}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="grid text-left leading-tight">
                    <span className="font-bold">
                      {isAnonymous ? 'Anonymous User' : user?.displayName}
                    </span>
                    {!isAnonymous && (
                      <span className="text-muted-foreground text-sm font-normal">
                        @{user?.username.toLocaleLowerCase()}
                      </span>
                    )}
                    {!isAnonymous && user?.createdAt && (
                      <span className="text-muted-foreground text-xs font-normal">
                        Joined {format(user.createdAt.toDate(), 'MMMM do, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </DrawerTitle>
            </DrawerHeader>
            <Separator />
            <div className="flex flex-col p-2">
              {isAnonymous && (
                <DrawerClose asChild>
                  <Link
                    to="/signup"
                    className="text-destructive-foreground hover:bg-sidebar-accent flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors"
                  >
                    <UserPlus className="size-5" />
                    Create Account
                  </Link>
                </DrawerClose>
              )}
              {moreItems
                .filter((item) => !isAnonymous || item.label !== 'Profile')
                .map((item) => (
                  <DrawerClose key={item.href} asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        isActive(item.href)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-foreground hover:bg-sidebar-accent'
                      )}
                    >
                      <item.icon className="size-5" />
                      {item.label}
                      {item.label === 'Friends' &&
                        pendingRequests &&
                        pendingRequests.length > 0 && (
                          <span className="bg-destructive text-(var(--destructive-foreground)) ml-auto flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                            {pendingRequests.length}
                          </span>
                        )}
                    </Link>
                  </DrawerClose>
                ))}
              <button
                onClick={() => {
                  setDrawerOpen(false)
                  setIsFeedbackOpen(true)
                }}
                className="text-foreground hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
              >
                <MessageSquareIcon className="size-5" />
                Feedback
              </button>
              <button
                onClick={() => {
                  setDrawerOpen(false)
                  setIsHelpOpen(true)
                }}
                className="text-foreground hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
              >
                <CircleQuestionMark className="size-5" />
                Help / Support
              </button>
            </div>
            <Separator />
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="text-destructive flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="size-5" />
                Log out
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      </nav>
    </div>
  )
}
