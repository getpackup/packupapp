import { renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockSetIsHelpOpen } = vi.hoisted(() => ({ mockSetIsHelpOpen: vi.fn() }))

vi.mock('~/contexts/globalState', () => ({
  useHelpModalState: () => ({ setIsHelpOpen: mockSetIsHelpOpen }),
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

import { toast } from 'sonner'
import { useSubscriptionErrorToast } from './useSubscriptionErrorToast'

function renderWithRouter(search = '') {
  return renderHook(() => useSubscriptionErrorToast(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[`/settings${search}`]}>{children}</MemoryRouter>
    ),
  })
}

describe('useSubscriptionErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when there is no subscription_error param', () => {
    renderWithRouter()

    expect(toast.error).not.toHaveBeenCalled()
    expect(mockSetIsHelpOpen).not.toHaveBeenCalled()
  })

  it('shows a specific error toast and opens the help dialog for a known error code', () => {
    renderWithRouter('?subscription_error=no_customer')

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith(
      "We couldn't find a billing account for you. Please contact support."
    )
    expect(mockSetIsHelpOpen).toHaveBeenCalledWith(true)
  })

  it('falls back to a generic message for an unrecognized error code', () => {
    renderWithRouter('?subscription_error=something_unexpected')

    expect(toast.error).toHaveBeenCalledWith(
      "We couldn't open the billing portal. Please try again later or contact support."
    )
    expect(mockSetIsHelpOpen).toHaveBeenCalledWith(true)
  })

  it('only fires once even if re-rendered', () => {
    const { rerender } = renderWithRouter('?subscription_error=missing_uid')

    expect(toast.error).toHaveBeenCalledTimes(1)

    rerender()
    rerender()

    expect(toast.error).toHaveBeenCalledTimes(1)
  })
})
