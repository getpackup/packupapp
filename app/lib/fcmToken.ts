import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { getToken, isSupported } from 'firebase/messaging'

import { firebaseMessaging, firestoreDb } from '~/firebase/config'

const FCM_DEBUG_PREFIX = '[fcmToken]'
const FCM_TOKEN_TIMEOUT_MS = 15_000

function logFcmDebug(message: string, data?: unknown): void {
  if (!import.meta.env.DEV) return

  if (typeof data === 'undefined') {
    console.log(`${FCM_DEBUG_PREFIX} ${message}`)
    return
  }

  console.log(`${FCM_DEBUG_PREFIX} ${message}`, data)
}

function getTokenWithTimeout(
  messaging: NonNullable<typeof firebaseMessaging>,
  options: Parameters<typeof getToken>[1]
) {
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

  logFcmDebug('Notification permission request completed', { permission })

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
      logFcmDebug('Messaging not supported in this browser')
      return
    }

    if (typeof Notification === 'undefined') {
      logFcmDebug('Notification API is unavailable')
      return
    }

    if (Notification.permission !== 'granted') {
      logFcmDebug('Notification permission is not granted', {
        permission: Notification.permission,
      })
      return
    }

    const messaging = firebaseMessaging
    if (!messaging) {
      logFcmDebug('Firebase messaging instance is unavailable')
      return
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_FCM_VAPID_KEY
    if (!vapidKey) {
      logFcmDebug('Missing VITE_FIREBASE_FCM_VAPID_KEY')
      return
    }

    const swRegistration =
      'serviceWorker' in navigator
        ? await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        : undefined

    logFcmDebug('Resolved messaging and service worker registration', {
      hasServiceWorkerRegistration: Boolean(swRegistration),
      permission: Notification.permission,
      vapidKeyLength: vapidKey.length,
    })

    let token: string

    try {
      token = await getTokenWithTimeout(messaging, {
        vapidKey,
        serviceWorkerRegistration: swRegistration,
      })
    } catch (error) {
      if (!shouldRetryAfterPushServiceError(error)) throw error

      logFcmDebug('Push subscription failed, clearing existing subscription and retrying once')
      await clearExistingPushSubscription(swRegistration)

      token = await getTokenWithTimeout(messaging, {
        vapidKey,
        serviceWorkerRegistration: swRegistration,
      })
    }

    if (!token) {
      logFcmDebug('getToken returned an empty token')
      return
    }

    const userRef = doc(firestoreDb, 'users', userId)
    await updateDoc(userRef, { fcmTokens: arrayUnion(token) })
    logFcmDebug('Successfully registered token to Firestore')
  } catch (error) {
    if (shouldRetryAfterPushServiceError(error)) {
      logFcmDebug(
        'Push service rejected subscription. Check VAPID/project alignment. In Brave, enable Use Google services for push messaging (brave://settings/privacy), then restart the browser.'
      )
    }

    if (import.meta.env.DEV) {
      console.error(`${FCM_DEBUG_PREFIX} Failed to register FCM token`, error)
    }
    // Fail silently — token registration is best-effort
  }
}
