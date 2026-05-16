import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
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
  toast: { success: vi.fn() },
}))

import { useAuth } from '../contexts/auth/useAuth'
import { useIsAnonymous } from '../lib/useIsAnonymous'
import { FriendRequestEmailToggle } from './FriendRequestEmailToggle'

function renderComponent() {
  return render(
    <MemoryRouter>
      <FriendRequestEmailToggle />
    </MemoryRouter>
  )
}

describe('FriendRequestEmailToggle', () => {
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
    })

    it('renders the switch', () => {
      renderComponent()
      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('defaults to on (opted in) when friendRequestEmailEnabled is absent', () => {
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

    it('shows off state when friendRequestEmailEnabled is false', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { friendRequestEmailEnabled: false },
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      const toggle = screen.getByRole('switch')
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    })

    it('writes friendRequestEmailEnabled = false when toggling off', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { friendRequestEmailEnabled: true },
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      await user.click(screen.getByRole('switch'))
      expect(mockUpdateUserAsync).toHaveBeenCalledWith({
        data: { preferences: { friendRequestEmailEnabled: false } },
      })
    })

    it('writes friendRequestEmailEnabled = true when toggling on', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { friendRequestEmailEnabled: false },
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      await user.click(screen.getByRole('switch'))
      expect(mockUpdateUserAsync).toHaveBeenCalledWith({
        data: { preferences: { friendRequestEmailEnabled: true } },
      })
    })

    it('shows success toast when toggling off', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { friendRequestEmailEnabled: true },
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      await user.click(screen.getByRole('switch'))
      expect(toast.success).toHaveBeenCalledWith(
        'You will no longer receive friend request emails'
      )
    })

    it('shows success toast when toggling on', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          preferences: { friendRequestEmailEnabled: false },
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      await user.click(screen.getByRole('switch'))
      expect(toast.success).toHaveBeenCalledWith(
        'You will now receive friend request emails'
      )
    })
  })
})
