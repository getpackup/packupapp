import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { AnonymousUserBanner } from './AnonymousUserBanner'

function renderWithRouter(ui: React.ReactElement) {
  // Minimal MemoryRouter wrapper
  const { MemoryRouter } = require('react-router')
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

afterEach(cleanup)

describe('AnonymousUserBanner', () => {
  const defaultProps = {
    primary: 'Primary text here',
    secondary: 'Secondary text here',
  }

  it('renders primary and secondary text', () => {
    renderWithRouter(<AnonymousUserBanner {...defaultProps} />)
    expect(screen.getByText('Primary text here')).toBeInTheDocument()
    expect(screen.getByText('Secondary text here')).toBeInTheDocument()
  })

  it('renders a "Sign up free" CTA linking to /signup', () => {
    renderWithRouter(<AnonymousUserBanner {...defaultProps} />)
    const link = screen.getByRole('link', { name: /sign up free/i })
    expect(link).toHaveAttribute('href', '/signup')
  })

  it('hides the banner when the dismiss button is clicked', async () => {
    const user = userEvent.setup()
    renderWithRouter(<AnonymousUserBanner {...defaultProps} />)

    expect(screen.getByText('Primary text here')).toBeInTheDocument()

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    await user.click(dismissButton)

    expect(screen.queryByText('Primary text here')).not.toBeInTheDocument()
  })

  it('renders nothing when already dismissed', async () => {
    const user = userEvent.setup()
    const { container } = renderWithRouter(<AnonymousUserBanner {...defaultProps} />)

    const dismissButton = screen.getByRole('button', { name: /dismiss/i })
    await user.click(dismissButton)

    expect(container.innerHTML).toBe('')
  })
})
