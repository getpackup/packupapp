import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetToken = vi.fn()
const mockGetMessaging = vi.fn()
const mockIsSupported = vi.fn()

vi.mock('firebase/messaging', () => ({
  getMessaging: () => mockGetMessaging(),
  getToken: (...args: any[]) => mockGetToken(...args),
  isSupported: () => mockIsSupported(),
}))

const mockUpdateDoc = vi.fn()
const mockArrayUnion = vi.fn((...args: any[]) => ({ __arrayUnion: args }))
const mockDoc = vi.fn((..._args: any[]) => 'mock-doc-ref')

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  arrayUnion: (...args: any[]) => mockArrayUnion(...args),
}))

vi.mock('~/firebase/config', () => ({
  firebaseMessaging: 'mock-messaging',
  firestoreDb: 'mock-db',
  firebaseMessaging: 'mock-messaging',
}))

import { registerFcmToken } from './fcmToken'

describe('registerFcmToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockGetToken.mockReset()
    mockGetMessaging.mockReset().mockReturnValue('mock-messaging')
    mockIsSupported.mockReset()
    mockUpdateDoc.mockReset()
    mockArrayUnion.mockReset().mockImplementation((...args: any[]) => ({ __arrayUnion: args }))
    mockDoc.mockReset().mockReturnValue('mock-doc-ref')

    vi.stubEnv('VITE_FIREBASE_FCM_VAPID_KEY', 'test-vapid-key')
    vi.stubGlobal('Notification', { permission: 'granted' })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('skips when messaging is not supported', async () => {
    mockIsSupported.mockResolvedValue(false)

    await registerFcmToken('user-1')

    expect(mockGetToken).not.toHaveBeenCalled()
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('skips when notification permission is not granted', async () => {
    mockIsSupported.mockResolvedValue(true)
    vi.stubGlobal('Notification', { permission: 'default' })

    await registerFcmToken('user-1')

    expect(mockGetToken).not.toHaveBeenCalled()
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('skips when Notification API is unavailable', async () => {
    mockIsSupported.mockResolvedValue(true)
    vi.stubGlobal('Notification', undefined)

    await registerFcmToken('user-1')

    expect(mockGetToken).not.toHaveBeenCalled()
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('upserts token via arrayUnion when permission is granted', async () => {
    mockIsSupported.mockResolvedValue(true)
    mockGetToken.mockResolvedValue('fcm-token-abc')

    await registerFcmToken('user-1')

    expect(mockGetToken).toHaveBeenCalledWith('mock-messaging', {
      vapidKey: 'test-vapid-key',
    })
    expect(mockDoc).toHaveBeenCalledWith('mock-db', 'users', 'user-1')
    expect(mockArrayUnion).toHaveBeenCalledWith('fcm-token-abc')
    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
      fcmTokens: { __arrayUnion: ['fcm-token-abc'] },
    })
  })

  it('skips when getToken returns empty string', async () => {
    mockIsSupported.mockResolvedValue(true)
    mockGetToken.mockResolvedValue('')

    await registerFcmToken('user-1')

    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('does not throw when getToken fails', async () => {
    mockIsSupported.mockResolvedValue(true)
    mockGetToken.mockRejectedValue(new Error('messaging/token-subscribe-failed'))

    await expect(registerFcmToken('user-1')).resolves.toBeUndefined()
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('does not throw when updateDoc fails', async () => {
    mockIsSupported.mockResolvedValue(true)
    mockGetToken.mockResolvedValue('fcm-token-abc')
    mockUpdateDoc.mockRejectedValue(new Error('firestore/unavailable'))

    await expect(registerFcmToken('user-1')).resolves.toBeUndefined()
  })
})
