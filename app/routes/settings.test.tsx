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
  usePlan: vi.fn(() => ({ plan: 'free', isPro: false, isFree: true, isLoading: false, cancelAtPeriodEnd: false, periodEnd: undefined })),
}))

vi.mock('~/lib/useCheckoutUpgradeStatus', () => ({
  useCheckoutUpgradeStatus: vi.fn(() => 'idle'),
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
import { useCheckoutUpgradeStatus } from '~/lib/useCheckoutUpgradeStatus'
import { usePlan } from '~/lib/usePlan'
import Settings from './settings'

const PRO_PLAN = { plan: 'pro' as const, isPro: true, isFree: false, isLoading: false, cancelAtPeriodEnd: false, periodEnd: undefined }
const FREE_PLAN = { plan: 'free' as const, isPro: false, isFree: true, isLoading: false, cancelAtPeriodEnd: false, periodEnd: undefined }

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
    vi.mocked(usePlan).mockReturnValue(FREE_PLAN)
    renderSettings()
    expect(screen.getByRole('link', { name: /upgrade to pro/i })).toBeInTheDocument()
  })

  it('"Upgrade to Pro" link includes uid query param', () => {
    vi.mocked(usePlan).mockReturnValue(FREE_PLAN)
    renderSettings()
    const link = screen.getByRole('link', { name: /upgrade to pro/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('uid=u1'))
  })

  it('shows "Manage Subscription" for pro users', () => {
    vi.mocked(usePlan).mockReturnValue(PRO_PLAN)
    renderSettings()
    expect(screen.getByRole('button', { name: /manage subscription/i })).toBeInTheDocument()
  })

  it('does not show "Upgrade to Pro" for pro users', () => {
    vi.mocked(usePlan).mockReturnValue(PRO_PLAN)
    renderSettings()
    expect(screen.queryByRole('link', { name: /upgrade to pro/i })).not.toBeInTheDocument()
  })

  it('does not show subscription section for anonymous users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    vi.mocked(usePlan).mockReturnValue(FREE_PLAN)
    renderSettings()
    expect(screen.queryByRole('link', { name: /upgrade to pro/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /manage subscription/i })).not.toBeInTheDocument()
  })

  it('shows upgrade processing state while checkout upgrade status is processing', () => {
    vi.mocked(usePlan).mockReturnValue(FREE_PLAN)
    vi.mocked(useCheckoutUpgradeStatus).mockReturnValue('processing')
    renderSettings('?checkout=success')
    expect(screen.getByText('Processing upgrade')).toBeInTheDocument()
  })

  it('does not show processing state when checkout upgrade status is idle', () => {
    vi.mocked(usePlan).mockReturnValue(FREE_PLAN)
    vi.mocked(useCheckoutUpgradeStatus).mockReturnValue('idle')
    renderSettings()
    expect(screen.queryByText(/processing/i)).not.toBeInTheDocument()
  })

  it('shows a fallback message when checkout upgrade status times out', () => {
    vi.mocked(usePlan).mockReturnValue(FREE_PLAN)
    vi.mocked(useCheckoutUpgradeStatus).mockReturnValue('timeout')
    renderSettings()
    expect(screen.getByText('Still processing')).toBeInTheDocument()
  })

  it('shows Pro Plan row even if checkout upgrade status is still processing once plan is pro', () => {
    vi.mocked(usePlan).mockReturnValue(PRO_PLAN)
    vi.mocked(useCheckoutUpgradeStatus).mockReturnValue('processing')
    renderSettings('?checkout=success')
    expect(screen.getByRole('button', { name: /manage subscription/i })).toBeInTheDocument()
    expect(screen.queryByText('Processing upgrade')).not.toBeInTheDocument()
  })

  it('shows cancellation date for pro user who has canceled', () => {
    // 2026-09-01 00:00:00 UTC
    vi.mocked(usePlan).mockReturnValue({ plan: 'pro', isPro: true, isFree: false, isLoading: false, cancelAtPeriodEnd: true, periodEnd: 1788220800 })
    renderSettings()
    expect(screen.getByText(/cancels on/i)).toBeInTheDocument()
    expect(screen.getByText(/september 1st, 2026/i)).toBeInTheDocument()
  })

  it('does not show cancellation date for pro user who has not canceled', () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'pro', isPro: true, isFree: false, isLoading: false, cancelAtPeriodEnd: false, periodEnd: 1788220800 })
    renderSettings()
    expect(screen.queryByText(/cancels on/i)).not.toBeInTheDocument()
  })
})
