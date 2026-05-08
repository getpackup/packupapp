import { useAuth } from '~/contexts/auth/useAuth'

export function useIsAnonymous() {
  const { user } = useAuth()
  return user?.isAnonymous ?? false
}
