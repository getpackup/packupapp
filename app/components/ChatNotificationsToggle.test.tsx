import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

const mockRegisterFcmToken = vi.fn()
const mockRequestNotificationPermissionForFcm = vi.fn()

vi.mock('../lib/fcmToken', () => ({
  registerFcmToken: (...args: any[]) => mockRegisterFcmToken(...args),
  requestNotificationPermissionForFcm: (...args: any[]) =>
    mockRequestNotificationPermissionForFcm(...args),
}))

const mockUpdateUserAsync = vi.fn()

vi.mock('../contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com', preferences: {} },
  })),
}))

vi.mock('../services/users', () => ({
  useUpdateUser: vi.fn(() => ({
    mutateAsync: mockUpdateUserAsync,
  })),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { useAuth } from '../contexts/auth/useAuth'
import { useIsAnonymous } from '../lib/useIsAnonymous'
import { ChatNotificationsToggle } from './ChatNotificationsToggle'

function renderComponent() {
  return render(
    <MemoryRouter>
      <ChatNotificationsToggle />
    </MemoryRouter>
  )
}

describe('ChatNotificationsToggle', () => {
  describe('anonymous users', () => {
    it('does not render for anonymous users', () => {
      vi.mocked(useIsAnonymous).mockReturnValue(true)
      const { container } = renderComponent()
      expect(container.innerHTML).toBe('')
    })
  })

  describe('registered users', () => {
    beforeEach(() => {
      vi.mocked(useIsAnonymous).mockReturnValue(false)
      mockUpdateUserAsync.mockReset()
      mockRegisterFcmToken.mockReset().mockResolvedValue(undefined)
      mockRequestNotificationPermissionForFcm.mockReset().mockResolvedValue('granted')
    })

    it('renders the switch', () => {
      renderComponent()
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('defaults to on (opted in) when chatNotificationsEnabled is absent', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { uid: 'u1', username: 'testuser', email: 'test@test.com', preferences: {} },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    })

    it('defaults to on when preferences is undefined', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { uid: 'u1', username: 'testuser', email: 'test@test.com' },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'true')
    })

    it('shows off state when chatNotificationsEnabled is false', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { chatNotificationsEnabled: false },
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })

    it('writes chatNotificationsEnabled = false when toggling off', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { chatNotificationsEnabled: true },
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      await user.click(screen.getByRole('switch'))
      expect(mockUpdateUserAsync).toHaveBeenCalledWith({
        data: { preferences: { chatNotificationsEnabled: false } },
      })
      expect(mockRequestNotificationPermissionForFcm).not.toHaveBeenCalled()
    })

    it('writes chatNotificationsEnabled = true when toggling on', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { chatNotificationsEnabled: false },
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      await user.click(screen.getByRole('switch'))
      expect(mockRequestNotificationPermissionForFcm).toHaveBeenCalledTimes(1)
      expect(mockUpdateUserAsync).toHaveBeenCalledWith({
        data: { preferences: { chatNotificationsEnabled: true } },
      })
      expect(mockRegisterFcmToken).toHaveBeenCalledWith('u1')
    })

    it('shows success toast when toggling off', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { chatNotificationsEnabled: true },
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      await user.click(screen.getByRole('switch'))
      expect(toast.success).toHaveBeenCalledWith('Chat notifications disabled')
    })

    it('shows success toast when toggling on', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { chatNotificationsEnabled: false },
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      await user.click(screen.getByRole('switch'))
      expect(toast.success).toHaveBeenCalledWith('Chat notifications enabled')
    })

    it('shows error toast and skips updates when notification permission is denied', async () => {
      const user = userEvent.setup()
      mockRequestNotificationPermissionForFcm.mockResolvedValue('denied')

      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { chatNotificationsEnabled: false },
        },
        setUser: vi.fn(),
      } as any)

      renderComponent()
      await user.click(screen.getByRole('switch'))

      expect(mockUpdateUserAsync).not.toHaveBeenCalled()
      expect(mockRegisterFcmToken).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith(
        'Please allow notifications in your browser to enable chat alerts'
      )
    })
  })
})
