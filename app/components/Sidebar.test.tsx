import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(() => false),
}))

vi.mock('~/contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      uid: 'u1',
      username: 'testuser',
      email: 'test@test.com',
      displayName: 'Test User',
    },
    setUser: vi.fn(),
  })),
}))

vi.mock('~/lib/usePlan', () => ({
  usePlan: vi.fn(() => ({ plan: 'free', isPro: false, isFree: true, isLoading: false })),
}))

vi.mock('~/contexts/globalState', () => ({
  useSidebarState: vi.fn(() => ({ isSidebarCollapsed: false, setIsSidebarCollapsed: vi.fn() })),
  useFeedbackModalState: vi.fn(() => ({ setIsFeedbackOpen: vi.fn() })),
}))

vi.mock('~/services/friends', () => ({
  usePendingFriendRequestsQuery: vi.fn(() => ({ data: [] })),
}))

vi.mock('~/firebase/config', () => ({
  firebaseAuth: { signOut: vi.fn() },
}))

vi.mock('~/lib/useBoop', () => ({
  default: vi.fn(() => [{}, vi.fn()]),
}))

vi.mock('react-spring', () => ({
  animated: {
    span: ({ children, ...rest }: any) => <span {...rest}>{children}</span>,
  },
}))

import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { usePlan } from '~/lib/usePlan'
import { Sidebar } from './Sidebar'

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  )
}

async function openDropdown() {
  const user = userEvent.setup()
  const trigger = screen.getByRole('img', { hidden: true }).closest('div[role]') ??
    document.querySelector('[data-radix-collection-item]') ??
    screen.getByText('Test User').closest('div')!
  await user.click(trigger)
}

describe('Sidebar — subscription entry points', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useIsAnonymous).mockReturnValue(false)
  })

  it('shows "Upgrade to Pro" in dropdown for free users', async () => {
    const user = userEvent.setup()
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: false })
    renderSidebar()
    await user.click(screen.getByText('Test User'))
    expect(screen.getByRole('menuitem', { name: /upgrade to pro/i })).toBeInTheDocument()
  })

  it('"Upgrade to Pro" menu item has correct href with uid', async () => {
    const user = userEvent.setup()
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: false })
    renderSidebar()
    await user.click(screen.getByText('Test User'))
    const item = screen.getByRole('menuitem', { name: /upgrade to pro/i })
    expect(item).toHaveAttribute('href', expect.stringContaining('uid=u1'))
  })

  it('shows "Manage Subscription" in dropdown for pro users', async () => {
    const user = userEvent.setup()
    vi.mocked(usePlan).mockReturnValue({ plan: 'pro', isPro: true, isFree: false, isLoading: false })
    renderSidebar()
    await user.click(screen.getByText('Test User'))
    expect(screen.getByRole('menuitem', { name: /manage subscription/i })).toBeInTheDocument()
  })

  it('does not show subscription items for anonymous users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: false })
    renderSidebar()
    expect(screen.queryByText(/upgrade to pro/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/manage subscription/i)).not.toBeInTheDocument()
  })
})
