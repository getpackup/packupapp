import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(() => false),
}))

vi.mock('~/contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com' },
    setUser: vi.fn(),
  })),
}))

vi.mock('~/lib/usePlan', () => ({
  usePlan: vi.fn(() => ({ plan: 'free', isPro: false, isFree: true, isLoading: false })),
}))

vi.mock('~/firebase/config', () => ({
  firebaseAuth: { signOut: vi.fn() },
}))

vi.mock('~/components/ChatNotificationsToggle', () => ({
  ChatNotificationsToggle: () => null,
}))
vi.mock('~/components/EmergencyContacts', () => ({
  EmergencyContacts: () => null,
}))
vi.mock('~/components/FriendRequestEmailToggle', () => ({
  FriendRequestEmailToggle: () => null,
}))
vi.mock('~/components/SafetyItineraryToggle', () => ({
  SafetyItineraryToggle: () => null,
}))
vi.mock('~/components/SoundsToggle', () => ({
  SoundsToggle: () => null,
}))
vi.mock('~/components/ThemeToggle', () => ({
  ThemeToggle: () => null,
}))
vi.mock('~/components/WeightUnitPreference', () => ({
  default: () => null,
}))

import { useIsAnonymous } from '~/lib/useIsAnonymous'
import { useAuth } from '~/contexts/auth/useAuth'
import { usePlan } from '~/lib/usePlan'
import Settings from './settings'

function renderSettings(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/settings${search}`]}>
      <Settings />
    </MemoryRouter>
  )
}

describe('Settings — Subscription section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'u1', username: 'testuser', email: 'test@test.com' },
      setUser: vi.fn(),
    } as any)
  })

  it('shows "Upgrade to Pro" for free users', () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: false })
    renderSettings()
    expect(screen.getByRole('link', { name: /upgrade to pro/i })).toBeInTheDocument()
  })

  it('"Upgrade to Pro" link includes uid query param', () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: false })
    renderSettings()
    const link = screen.getByRole('link', { name: /upgrade to pro/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('uid=u1'))
  })

  it('shows "Manage Subscription" for pro users', () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'pro', isPro: true, isFree: false, isLoading: false })
    renderSettings()
    expect(screen.getByRole('button', { name: /manage subscription/i })).toBeInTheDocument()
  })

  it('does not show "Upgrade to Pro" for pro users', () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'pro', isPro: true, isFree: false, isLoading: false })
    renderSettings()
    expect(screen.queryByRole('link', { name: /upgrade to pro/i })).not.toBeInTheDocument()
  })

  it('does not show subscription section for anonymous users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: false })
    renderSettings()
    expect(screen.queryByRole('link', { name: /upgrade to pro/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /manage subscription/i })).not.toBeInTheDocument()
  })

  it('shows upgrade processing state after checkout deep-link when plan is loading', () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: true })
    renderSettings('?checkout=success')
    expect(screen.getByText('Processing upgrade')).toBeInTheDocument()
  })

  it('does not show processing state when not a checkout redirect', () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: true })
    renderSettings()
    expect(screen.queryByText(/processing/i)).not.toBeInTheDocument()
  })
})
