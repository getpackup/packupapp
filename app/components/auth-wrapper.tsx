import { type ReactNode, useEffect } from 'react'
import { Outlet, redirect, useNavigate } from 'react-router'

import Logout from '~/components/logout'
import AuthProvider from '~/contexts/auth/authProvider'
import { firebaseAuth } from '~/firebase/config'
import { isAuth } from '~/services/auth'

import { ThemeToggle } from './ThemeToggle'

export async function clientLoader() {
  const isLogged = await isAuth()
  if (!isLogged) {
    throw redirect('/')
  }
}

export default function AuthWrapper({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  return (
    <AuthProvider>
      <div className="flex justify-end">
        <ThemeToggle />
        <Logout />
      </div>
      <Outlet />

      {children}
    </AuthProvider>
  )
}
