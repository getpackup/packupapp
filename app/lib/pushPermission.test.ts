import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetToken = vi.fn()
const mockIsSupported = vi.fn()

vi.mock('firebase/messaging', () => ({
  getToken: (...args: any[]) => mockGetToken(...args),
  isSupported: () => mockIsSupported(),
}))

const mockRegisterFcmToken = vi.fn()

vi.mock('./fcmToken', () => ({
  registerFcmToken: (...args: any[]) => mockRegisterFcmToken(...args),
}))

vi.mock('~/firebase/config', () => ({
  getFirebaseMessaging: async () => 'mock-messaging',
  firestoreDb: 'mock-db',
}))

import { requestPushPermission } from './pushPermission'

describe('requestPushPermission', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockGetToken.mockReset()
    mockIsSupported.mockReset()
    mockRegisterFcmToken.mockReset()
    localStorage.clear()
    vi.stubEnv('VITE_FIREBASE_FCM_VAPID_KEY', 'test-vapid-key')
    Object.defineProperty(document, 'cookie', { value: '', writable: true })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('skips if already prompted (localStorage flag set)', async () => {
    localStorage.setItem('push-permission-prompted', 'true')

    await requestPushPermission('user-1')

    expect(mockIsSupported).not.toHaveBeenCalled()
    expect(mockGetToken).not.toHaveBeenCalled()
  })

  it('sets localStorage flag before requesting permission', async () => {
    mockIsSupported.mockResolvedValue(true)
    mockGetToken.mockResolvedValue('fcm-token-abc')
    mockRegisterFcmToken.mockResolvedValue(undefined)

    await requestPushPermission('user-1')

    expect(localStorage.getItem('push-permission-prompted')).toBe('true')
  })

  it('calls getToken to trigger browser permission prompt', async () => {
    mockIsSupported.mockResolvedValue(true)
    mockGetToken.mockResolvedValue('fcm-token-abc')
    mockRegisterFcmToken.mockResolvedValue(undefined)

    await requestPushPermission('user-1')

    expect(mockGetToken).toHaveBeenCalledWith('mock-messaging', {
      vapidKey: 'test-vapid-key',
    })
  })

  it('registers FCM token after successful getToken', async () => {
    mockIsSupported.mockResolvedValue(true)
    mockGetToken.mockResolvedValue('fcm-token-abc')
    mockRegisterFcmToken.mockResolvedValue(undefined)

    await requestPushPermission('user-1')

    expect(mockRegisterFcmToken).toHaveBeenCalledWith('user-1')
  })

  it('does not register token when getToken returns empty string', async () => {
    mockIsSupported.mockResolvedValue(true)
    mockGetToken.mockResolvedValue('')
    mockRegisterFcmToken.mockResolvedValue(undefined)

    await requestPushPermission('user-1')

    expect(mockRegisterFcmToken).not.toHaveBeenCalled()
  })

  it('fails silently when getToken throws (permission denied)', async () => {
    mockIsSupported.mockResolvedValue(true)
    mockGetToken.mockRejectedValue(new Error('messaging/permission-blocked'))

    await expect(requestPushPermission('user-1')).resolves.toBeUndefined()
    expect(localStorage.getItem('push-permission-prompted')).toBe('true')
  })

  it('skips getToken if messaging is not supported', async () => {
    mockIsSupported.mockResolvedValue(false)

    await requestPushPermission('user-1')

    expect(mockGetToken).not.toHaveBeenCalled()
    expect(localStorage.getItem('push-permission-prompted')).toBe('true')
  })

  it('skips getToken when getFirebaseMessaging returns null', async () => {
    const configModule = await import('~/firebase/config')
    const original = configModule.getFirebaseMessaging
    Object.defineProperty(configModule, 'getFirebaseMessaging', {
      value: async () => null,
      writable: true,
      configurable: true,
    })

    mockIsSupported.mockResolvedValue(true)

    await requestPushPermission('user-1')

    expect(mockGetToken).not.toHaveBeenCalled()

    Object.defineProperty(configModule, 'getFirebaseMessaging', {
      value: original,
      writable: true,
      configurable: true,
    })
  })

  describe('iOS App Store bridge', () => {
    it('uses webkit bridge when app-platform cookie is set', async () => {
      Object.defineProperty(document, 'cookie', {
        value: 'app-platform=iOS App Store',
        writable: true,
      })
      const mockPostMessage = vi.fn()
      vi.stubGlobal('webkit', {
        messageHandlers: {
          'push-permission-request': { postMessage: mockPostMessage },
        },
      })

      const promise = requestPushPermission('user-1')
      await Promise.resolve()

      expect(mockPostMessage).toHaveBeenCalledWith({})
      // Dispatch event to resolve the promise and avoid timeout leak
      window.dispatchEvent(new CustomEvent('push-permission-request'))
      await promise
      expect(mockGetToken).not.toHaveBeenCalled()
      expect(localStorage.getItem('push-permission-prompted')).toBe('true')

      vi.unstubAllGlobals()
      vi.stubEnv('VITE_FIREBASE_FCM_VAPID_KEY', 'test-vapid-key')
    })

    it('registers token when native layer dispatches custom event', async () => {
      Object.defineProperty(document, 'cookie', {
        value: 'app-platform=iOS App Store',
        writable: true,
      })
      const mockPostMessage = vi.fn()
      vi.stubGlobal('webkit', {
        messageHandlers: {
          'push-permission-request': { postMessage: mockPostMessage },
        },
      })
      mockRegisterFcmToken.mockResolvedValue(undefined)

      const promise = requestPushPermission('user-1')

      window.dispatchEvent(new CustomEvent('push-permission-request'))

      await promise

      expect(mockRegisterFcmToken).toHaveBeenCalledWith('user-1')

      vi.unstubAllGlobals()
      vi.stubEnv('VITE_FIREBASE_FCM_VAPID_KEY', 'test-vapid-key')
    })
  })
})
