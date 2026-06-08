import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('~/lib/usePlan', () => ({
  usePlan: vi.fn(),
}))

import { usePlan } from '~/lib/usePlan'
import { PlanGate } from './PlanGate'

function renderGate(props: { feature?: string; children?: React.ReactNode }) {
  return render(
    <MemoryRouter>
      <PlanGate feature={props.feature ?? 'Custom Tags'}>
        {props.children ?? <button>Create Tag</button>}
      </PlanGate>
    </MemoryRouter>
  )
}

describe('PlanGate', () => {
  it('renders children unchanged when user is on Pro Plan', () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'pro', isPro: true, isFree: false, isLoading: false })
    renderGate({})
    expect(screen.getByRole('button', { name: 'Create Tag' })).toBeInTheDocument()
    expect(screen.queryByTestId('plan-gate-locked')).not.toBeInTheDocument()
  })

  it('renders locked state with padlock icon when user is on Free Plan', () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: false })
    renderGate({})
    expect(screen.getByTestId('plan-gate-locked')).toBeInTheDocument()
    expect(screen.getByTestId('plan-gate-lock-icon')).toBeInTheDocument()
  })

  it('locked state is visually disabled', () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: false })
    renderGate({})
    expect(screen.getByTestId('plan-gate-locked')).toHaveAttribute('aria-disabled', 'true')
  })

  it('tooltip names the gated feature and includes upgrade call-to-action', async () => {
    vi.mocked(usePlan).mockReturnValue({ plan: 'free', isPro: false, isFree: true, isLoading: false })
    const user = userEvent.setup()
    renderGate({ feature: 'Custom Tags' })

    await user.hover(screen.getByTestId('plan-gate-locked'))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('Custom Tags')
    expect(tooltip).toHaveTextContent('Upgrade to Pro')
  })
})
