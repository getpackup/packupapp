import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { getToken, isSupported } from 'firebase/messaging'

import { firebaseMessaging, firestoreDb } from '~/firebase/config'

export async function registerFcmToken(userId: string): Promise<void> {
  try {
    const supported = await isSupported()
    if (!supported) return

    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    const messaging = firebaseMessaging

    if (!messaging) return

    const vapidKey = import.meta.env.VITE_FIREBASE_FCM_VAPID_KEY
    if (!vapidKey) return

    const swRegistration =
      'serviceWorker' in navigator
        ? await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        : undefined

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    })

    if (!token) return

    const userRef = doc(firestoreDb, 'users', userId)
    await updateDoc(userRef, { fcmTokens: arrayUnion(token) })
  } catch {
    // Fail silently — token registration is best-effort
  }
}
