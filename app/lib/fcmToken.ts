import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { getToken, isSupported, type Messaging } from 'firebase/messaging'

import { firestoreDb, getFirebaseMessaging } from '~/firebase/config'

const FCM_TOKEN_TIMEOUT_MS = 15_000

function getTokenWithTimeout(messaging: Messaging, options: Parameters<typeof getToken>[1]) {
  return Promise.race([
    getToken(messaging, options),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timed out after ${FCM_TOKEN_TIMEOUT_MS}ms while calling getToken`))
      }, FCM_TOKEN_TIMEOUT_MS)
    }),
  ])
}

function shouldRetryAfterPushServiceError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const isAbortError = error.name === 'AbortError'
  const isPushServiceMessage = /Registration failed - push service error/i.test(error.message)

  return isAbortError || isPushServiceMessage
}

export async function requestNotificationPermissionForFcm(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied'
  if (Notification.permission !== 'default') return Notification.permission

  const permission = await Notification.requestPermission()

  return permission
}

async function clearExistingPushSubscription(
  swRegistration: ServiceWorkerRegistration | undefined
): Promise<void> {
  if (!swRegistration) return
  if (!swRegistration.pushManager) return

  const existingSubscription = await swRegistration.pushManager.getSubscription()
  if (!existingSubscription) return

  await existingSubscription.unsubscribe()
}

export async function registerFcmToken(userId: string): Promise<void> {
  try {
    const supported = await isSupported()

    if (!supported) {
      return
    }

    if (typeof Notification === 'undefined') {
      return
    }

    if (Notification.permission !== 'granted') {
      return
    }

    const messaging = await getFirebaseMessaging()
    if (!messaging) {
      return
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_FCM_VAPID_KEY
    if (!vapidKey) {
      console.error('Missing VITE_FIREBASE_FCM_VAPID_KEY')
      return
    }

    const swRegistration =
      'serviceWorker' in navigator
        ? await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        : undefined

    let token: string

    try {
      token = await getTokenWithTimeout(messaging, {
        vapidKey,
        serviceWorkerRegistration: swRegistration,
      })
    } catch (error) {
      if (!shouldRetryAfterPushServiceError(error)) throw error

      await clearExistingPushSubscription(swRegistration)

      token = await getTokenWithTimeout(messaging, {
        vapidKey,
        serviceWorkerRegistration: swRegistration,
      })
    }

    if (!token) {
      return
    }

    const userRef = doc(firestoreDb, 'users', userId)
    await updateDoc(userRef, { fcmTokens: arrayUnion(token) })
  } catch (error) {
    if (shouldRetryAfterPushServiceError(error)) {
      console.error(
        'Push service rejected subscription. Check VAPID/project alignment. In Brave, enable Use Google services for push messaging (brave://settings/privacy), then restart the browser.'
      )
    }
    // Fail silently — token registration is best-effort
  }
}
