import { arrayUnion, doc, updateDoc } from 'firebase/firestore'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'

import { firestoreDb } from '~/firebase/config'

export async function registerFcmToken(userId: string): Promise<void> {
  try {
    const supported = await isSupported()
    if (!supported) return

    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    const messaging = getMessaging()
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_FCM_VAPID_KEY,
    })

    if (!token) return

    const userRef = doc(firestoreDb, 'users', userId)
    await updateDoc(userRef, { fcmTokens: arrayUnion(token) })
  } catch {
    // Fail silently — token registration is best-effort
  }
}
