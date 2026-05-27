import { cert, getApps, initializeApp } from 'firebase-admin/app'

export function getFirebaseAdmin() {
  const apps = getApps()
  if (apps.length > 0) return apps[0]

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return initializeApp({
      credential: cert({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
  }

  if (process.env.VITE_FIREBASE_ADMIN_CREDENTIAL) {
    const decodedCredential = Buffer.from(
      process.env.VITE_FIREBASE_ADMIN_CREDENTIAL,
      'base64'
    ).toString('utf-8')
    return initializeApp({ credential: cert(JSON.parse(decodedCredential)) })
  }

  throw new Error(
    'Firebase Admin credentials not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY, or VITE_FIREBASE_ADMIN_CREDENTIAL.'
  )
}
