import { useEffect } from 'react'
import { Outlet, redirect, useNavigate } from 'react-router'

import AuthProvider from '~/contexts/auth/authProvider'
import { firebaseAuth } from '~/firebase/config'
import { isAuth } from '~/services/auth'

import { Sidebar } from './Sidebar'

export async function clientLoader() {
  const isLogged = await isAuth()
  if (!isLogged) {
    throw redirect('/')
  }
}

export default function AuthWrapper() {
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
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden bg-gray-100 dark:bg-gray-800/50">
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  )
}
