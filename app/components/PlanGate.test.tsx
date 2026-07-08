import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/usePlan', () => ({
  usePlan: vi.fn(),
}))

vi.mock('~/contexts/auth/useAuth', () => {
  const fn = vi.fn(() => ({ user: { uid: 'u1', username: 'testuser', email: 'test@test.com' } }))
  return { useAuth: fn, default: fn }
})

import { usePlan } from '~/lib/usePlan'
import { PlanGate } from './PlanGate'

function renderGate(props: { featureDescription?: string; children?: React.ReactNode }) {
  return render(
    <MemoryRouter>
      <PlanGate featureDescription={props.featureDescription ?? 'Custom colored tags for gear.'}>
        {props.children ?? <button>Create Tag</button>}
      </PlanGate>
    </MemoryRouter>
  )
}

const PRO_PLAN = { plan: 'pro' as const, isPro: true, isFree: false, isLoading: false, cancelAtPeriodEnd: false, periodEnd: undefined }
const FREE_PLAN = { plan: 'free' as const, isPro: false, isFree: true, isLoading: false, cancelAtPeriodEnd: false, periodEnd: undefined }

describe('PlanGate', () => {
  it('renders children unchanged when user is on Pro Plan', () => {
    vi.mocked(usePlan).mockReturnValue(PRO_PLAN)
    renderGate({})
    expect(screen.getByRole('button', { name: 'Create Tag' })).not.toBeDisabled()
    expect(screen.queryByTestId('plan-gate-locked')).not.toBeInTheDocument()
  })

  it('shows a persistent upgrade alert and disables the content when user is on Free Plan', () => {
    vi.mocked(usePlan).mockReturnValue(FREE_PLAN)
    renderGate({ featureDescription: 'Custom colored tags for gear.' })

    expect(screen.getByTestId('plan-gate-locked')).toBeInTheDocument()
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument()
    expect(screen.getByText('Custom colored tags for gear.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Upgrade' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Tag' })).toBeDisabled()
  })

  it('locked state is visually disabled', () => {
    vi.mocked(usePlan).mockReturnValue(FREE_PLAN)
    renderGate({})
    expect(screen.getByTestId('plan-gate-locked')).toHaveAttribute('aria-disabled', 'true')
  })

  it('upgrade link includes the logged-in user uid', () => {
    vi.mocked(usePlan).mockReturnValue(FREE_PLAN)
    renderGate({})

    expect(screen.getByRole('link', { name: 'Upgrade' })).toHaveAttribute(
      'href',
      'https://getpackup.com/pricing?uid=u1'
    )
  })
})
