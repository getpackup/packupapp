import type { Firestore } from 'firebase-admin/firestore'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 5

export interface RateLimitStore {
  isRateLimited(key: string): boolean
  recordRequest(key: string): void
}

export interface EmailToUidDeps {
  lookupUserByEmail: (email: string) => Promise<string | null>
  rateLimitStore: RateLimitStore
}

export function createInMemoryRateLimitStore({
  maxRequests = RATE_LIMIT_MAX_REQUESTS,
  windowMs = RATE_LIMIT_WINDOW_MS,
}: {
  maxRequests?: number
  windowMs?: number
} = {}): RateLimitStore {
  const store = new Map<string, { count: number; windowStart: number }>()

  return {
    isRateLimited(key: string): boolean {
      const now = Date.now()
      const entry = store.get(key)
      if (!entry) return false
      if (now - entry.windowStart >= windowMs) return false
      return entry.count >= maxRequests
    },
    recordRequest(key: string): void {
      const now = Date.now()
      const entry = store.get(key)
      if (!entry || now - entry.windowStart >= windowMs) {
        store.set(key, { count: 1, windowStart: now })
      } else {
        entry.count++
      }
    },
  }
}

export async function processEmailToUidRequest({
  email,
  ip,
  deps,
}: {
  email: string
  ip: string
  deps: EmailToUidDeps
}): Promise<{ status: number; body: object }> {
  if (deps.rateLimitStore.isRateLimited(ip)) {
    return { status: 429, body: { error: 'Too many requests' } }
  }

  deps.rateLimitStore.recordRequest(ip)

  const uid = await deps.lookupUserByEmail(email)

  if (!uid) {
    return {
      status: 404,
      body: { message: 'If an account exists, you will receive further instructions.' },
    }
  }

  return { status: 200, body: { uid } }
}

export function buildEmailToUidDeps(db: Firestore, rateLimitStore: RateLimitStore): EmailToUidDeps {
  return {
    lookupUserByEmail: async (email: string) => {
      const snapshot = await db
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get()

      if (snapshot.empty) return null
      return snapshot.docs[0].id
    },
    rateLimitStore,
  }
}
