import { useNavigate } from 'react-router'

import { useAuth } from '~/contexts/auth/useAuth'
import { firebaseAuth } from '~/firebase/config'

import { Button } from './ui/button'

export default function Logout() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut()
      setUser(null)
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Button onClick={handleLogout} type="button" variant="destructive">
      Logout
    </Button>
  )
}
