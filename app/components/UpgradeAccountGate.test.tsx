import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { UpgradeAccountGate } from './UpgradeAccountGate'

const DEFAULT_MESSAGE = 'Plan on your computer, pack from your phone — and bring your whole crew.'

vi.mock('~/lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

import { useIsAnonymous } from '~/lib/useIsAnonymous'

function renderGate(props: { message?: string; children?: React.ReactNode }) {
  return render(
    <MemoryRouter>
      <UpgradeAccountGate {...props}>
        {props.children ?? <div data-testid="child-content">Protected</div>}
      </UpgradeAccountGate>
    </MemoryRouter>
  )
}

describe('UpgradeAccountGate', () => {
  it('shows default message when no message prop is passed', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderGate({})
    expect(screen.getByText(DEFAULT_MESSAGE)).toBeInTheDocument()
  })

  it('shows custom message when message prop is passed', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderGate({ message: 'Custom gate message' })
    expect(screen.getByText('Custom gate message')).toBeInTheDocument()
    expect(screen.queryByText(DEFAULT_MESSAGE)).not.toBeInTheDocument()
  })

  it('CTA button reads "Create account"', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(true)
    renderGate({})
    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('Create account')
  })

  it('renders children for registered users', () => {
    vi.mocked(useIsAnonymous).mockReturnValue(false)
    renderGate({})
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.queryByText(DEFAULT_MESSAGE)).not.toBeInTheDocument()
  })
})
