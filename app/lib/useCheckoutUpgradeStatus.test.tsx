import { act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUsePlan } = vi.hoisted(() => ({ mockUsePlan: vi.fn() }))

vi.mock('~/lib/usePlan', () => ({
  usePlan: mockUsePlan,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}))

import { toast } from 'sonner'
import { useCheckoutUpgradeStatus } from './useCheckoutUpgradeStatus'

function renderWithRouter(search = '') {
  return renderHook(() => useCheckoutUpgradeStatus(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[`/settings${search}`]}>{children}</MemoryRouter>
    ),
  })
}

describe('useCheckoutUpgradeStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns idle when there is no checkout param', () => {
    mockUsePlan.mockReturnValue({ isPro: false })

    const { result } = renderWithRouter()

    expect(result.current).toBe('idle')
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('returns processing when returning from checkout and plan is not yet pro', () => {
    mockUsePlan.mockReturnValue({ isPro: false })

    const { result } = renderWithRouter('?checkout=success')

    expect(result.current).toBe('processing')
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('fires the success toast once and resolves to idle when plan becomes pro', () => {
    mockUsePlan.mockReturnValue({ isPro: false })

    const { result, rerender } = renderWithRouter('?checkout=success')
    expect(result.current).toBe('processing')

    mockUsePlan.mockReturnValue({ isPro: true })
    rerender()

    expect(result.current).toBe('idle')
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith(
      "You're now on the Pro plan!",
      expect.objectContaining({ icon: expect.anything() })
    )

    rerender()
    rerender()
    expect(toast.success).toHaveBeenCalledTimes(1)
  })

  it('does not fire the toast when plan is already pro on mount without a checkout param', () => {
    mockUsePlan.mockReturnValue({ isPro: true })

    const { result } = renderWithRouter()

    expect(result.current).toBe('idle')
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('moves to timeout after 20s if plan never becomes pro, without firing the toast', async () => {
    mockUsePlan.mockReturnValue({ isPro: false })

    const { result } = renderWithRouter('?checkout=success')
    expect(result.current).toBe('processing')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000)
    })

    expect(result.current).toBe('timeout')
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('lets the toast opportunity lapse after timeout, even if plan later becomes pro', async () => {
    mockUsePlan.mockReturnValue({ isPro: false })

    const { result, rerender } = renderWithRouter('?checkout=success')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000)
    })
    expect(result.current).toBe('timeout')

    mockUsePlan.mockReturnValue({ isPro: true })
    rerender()

    expect(toast.success).not.toHaveBeenCalled()
  })
})
