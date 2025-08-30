import { createContext } from 'react'

import type { User } from '~/types/User'

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export default AuthContext
