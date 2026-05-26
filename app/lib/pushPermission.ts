import { getToken, isSupported } from 'firebase/messaging'

import { firebaseMessaging } from '~/firebase/config'

import { registerFcmToken } from './fcmToken'

const PROMPTED_KEY = 'push-permission-prompted'

function isIosAppStore(): boolean {
  return document.cookie
    .split(';')
    .some((c) => c.trim().startsWith('app-platform=iOS App Store'))
}

export async function requestPushPermission(userId: string): Promise<void> {
  try {
    if (localStorage.getItem(PROMPTED_KEY)) return

    localStorage.setItem(PROMPTED_KEY, 'true')

    if (isIosAppStore()) {
      return new Promise<void>((resolve) => {
        const handler = () => {
          window.removeEventListener('push-permission-request', handler)
          registerFcmToken(userId)
          resolve()
        }
        window.addEventListener('push-permission-request', handler)

        setTimeout(() => {
          window.removeEventListener('push-permission-request', handler)
          resolve()
        }, 30_000)

        ;(window as any).webkit?.messageHandlers?.['push-permission-request']?.postMessage({})
      })
    }

    const supported = await isSupported()
    if (!supported) return

    const messaging = firebaseMessaging
    if (!messaging) return

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_FCM_VAPID_KEY,
    })

    if (token) {
      await registerFcmToken(userId)
    }
  } catch {
    // Fail silently — permission denied or API error
  }
}
