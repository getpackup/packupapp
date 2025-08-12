import {createContext} from 'react'

import type {AuthUser} from '~/types/AuthUser'

interface AuthContextType {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export default AuthContext
