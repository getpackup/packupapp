import { useEffect } from 'react'
import { Outlet, redirect, useLocation, useNavigate } from 'react-router'

import AuthProvider from '~/contexts/auth/authProvider'
import { firebaseAuth } from '~/firebase/config'
import { trackPage } from '~/lib/analytics'
import { useForegroundChatNotifications } from '~/lib/useForegroundChatNotifications'
import { isAuth } from '~/services/auth'

import { BottomNav } from './BottomNav'
import { FeedbackModal } from './FeedbackModal'
import { HelpModal } from './HelpModal'
import { Sidebar } from './Sidebar'

const pageNameMap = (id?: string) => ({
  '/': 'Home',
  '/signin': 'Sign In',
  '/signup': 'Sign Up',
  '/friends': 'Friends',
  '/gear-closet': 'Gear Closet',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/shopping-list': 'Shopping List',
  '/templates': 'Templates',
  '/trips': 'Trips',
  [`/trips/${id}`]: `Trip By ID: ${id}`,
  '/trips/new': 'New Trip',
})

export async function clientLoader() {
  const isLogged = await isAuth()
  if (!isLogged) {
    throw redirect('/')
  }
}

export default function AuthWrapper() {
  const navigate = useNavigate()
  const location = useLocation()

  useForegroundChatNotifications()

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  useEffect(() => {
    trackPage(
      pageNameMap(location.pathname.split('/')[2])[location.pathname as keyof typeof pageNameMap],
      location.pathname,
      document.title
    )
  }, [location.pathname])

  return (
    <AuthProvider>
      <div className="flex h-screen">
        <Sidebar className="hidden md:flex" />
        <main className="flex flex-1 flex-col overflow-hidden bg-gray-100 pb-16 md:pb-0 dark:bg-gray-800/50">
          <Outlet />
        </main>
        <BottomNav className="md:hidden" />
        <FeedbackModal />
        <HelpModal />
      </div>
    </AuthProvider>
  )
}
