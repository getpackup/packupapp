import { isSupported, onMessage } from 'firebase/messaging'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { firebaseMessaging } from '~/firebase/config'

export function useForegroundChatNotifications() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    async function subscribe() {
      const supported = await isSupported()
      if (!supported || !firebaseMessaging) return

      unsubscribe = onMessage(firebaseMessaging, (payload) => {
        const title = payload.notification?.title
        const url = payload.data?.url
        const tripId = payload.data?.tripId

        if (!title || !url || !tripId) return

        // Suppress toast if user is already viewing this trip's chat
        const onTripPage = location.pathname === `/trips/${tripId}`
        const chatAlreadyOpen =
          onTripPage && new URLSearchParams(location.search).get('chat') === 'open'
        if (chatAlreadyOpen) return

        toast(title, {
          action: {
            label: 'Open Chat',
            onClick: () => navigate(url),
          },
          duration: 8000,
        })
      })
    }

    subscribe()

    return () => unsubscribe?.()
  }, [navigate, location.pathname, location.search])
}
