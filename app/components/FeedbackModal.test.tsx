import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSetIsFeedbackOpen = vi.fn()

vi.mock('../contexts/globalState', () => ({
  useFeedbackModalState: vi.fn(() => ({
    isFeedbackOpen: false,
    setIsFeedbackOpen: mockSetIsFeedbackOpen,
  })),
}))

vi.mock('../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(() => false),
}))

vi.mock('../contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      uid: 'u1',
      username: 'testuser',
      email: 'test@test.com',
      displayName: 'Test User',
      isAnonymous: false,
    },
  })),
}))

const mockFetcherSubmit = vi.fn()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useFetcher: vi.fn(() => ({
      submit: mockFetcherSubmit,
      state: 'idle',
      data: null,
    })),
  }
})

import { useFetcher } from 'react-router'
import { useFeedbackModalState } from '../contexts/globalState'
import { useIsAnonymous } from '../lib/useIsAnonymous'
import { FeedbackModal } from './FeedbackModal'

function renderComponent() {
  return render(
    <MemoryRouter>
      <FeedbackModal />
    </MemoryRouter>
  )
}

describe('FeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('visibility', () => {
    it('does not render the dialog when isFeedbackOpen is false', () => {
      vi.mocked(useFeedbackModalState).mockReturnValue({
        isFeedbackOpen: false,
        setIsFeedbackOpen: mockSetIsFeedbackOpen,
      })
      renderComponent()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders the dialog when isFeedbackOpen is true', () => {
      vi.mocked(useFeedbackModalState).mockReturnValue({
        isFeedbackOpen: true,
        setIsFeedbackOpen: mockSetIsFeedbackOpen,
      })
      renderComponent()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('form fields', () => {
    beforeEach(() => {
      vi.mocked(useFeedbackModalState).mockReturnValue({
        isFeedbackOpen: true,
        setIsFeedbackOpen: mockSetIsFeedbackOpen,
      })
    })

    it('renders a textarea for the message', () => {
      renderComponent()
      expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument()
    })

    it('renders emotion toggle buttons', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /😍/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /👋/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /😭/ })).toBeInTheDocument()
    })

    it('renders category toggle buttons', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /bug/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /idea/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /other/i })).toBeInTheDocument()
    })

    it('does not render email field for registered users', () => {
      vi.mocked(useIsAnonymous).mockReturnValue(false)
      renderComponent()
      expect(screen.queryByPlaceholderText(/email/i)).not.toBeInTheDocument()
    })

    it('renders optional email field for anonymous users', () => {
      vi.mocked(useIsAnonymous).mockReturnValue(true)
      renderComponent()
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    })
  })

  describe('submit button state', () => {
    beforeEach(() => {
      vi.mocked(useFeedbackModalState).mockReturnValue({
        isFeedbackOpen: true,
        setIsFeedbackOpen: mockSetIsFeedbackOpen,
      })
    })

    it('is always enabled (errors shown on submit instead)', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /send feedback/i })).toBeEnabled()
    })
  })

  describe('validation errors', () => {
    beforeEach(() => {
      vi.mocked(useFeedbackModalState).mockReturnValue({
        isFeedbackOpen: true,
        setIsFeedbackOpen: mockSetIsFeedbackOpen,
      })
    })

    it('shows message error when submitting with an empty message', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.click(screen.getByRole('button', { name: /send feedback/i }))
      expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument()
    })

    it('shows message error when message is too short', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.type(screen.getByRole('textbox', { name: /message/i }), 'hello')
      await user.click(screen.getByRole('button', { name: /send feedback/i }))
      expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument()
    })

    it('does not show an error when the message is long enough', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.type(screen.getByRole('textbox', { name: /message/i }), 'long enough message')
      await user.click(screen.getByRole('button', { name: /send feedback/i }))
      expect(screen.queryByText(/at least 10 characters/i)).not.toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    beforeEach(() => {
      vi.mocked(useFeedbackModalState).mockReturnValue({
        isFeedbackOpen: true,
        setIsFeedbackOpen: mockSetIsFeedbackOpen,
      })
    })

    it('submits form data to /resource/send-feedback', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.type(screen.getByRole('textbox', { name: /message/i }), 'this is my test feedback')
      await user.click(screen.getByRole('button', { name: /👋/ }))
      await user.click(screen.getByRole('button', { name: /idea/i }))
      await user.click(screen.getByRole('button', { name: /send feedback/i }))

      expect(mockFetcherSubmit).toHaveBeenCalledWith(
        expect.any(FormData),
        { method: 'POST', action: '/resource/send-feedback' }
      )
    })
  })

  describe('success state', () => {
    it('shows thank-you message after successful submission', () => {
      vi.mocked(useFeedbackModalState).mockReturnValue({
        isFeedbackOpen: true,
        setIsFeedbackOpen: mockSetIsFeedbackOpen,
      })
      vi.mocked(useFetcher).mockReturnValue({
        submit: mockFetcherSubmit,
        state: 'idle',
        data: { success: true },
      } as any)
      renderComponent()
      expect(screen.getByText(/thank/i)).toBeInTheDocument()
    })

    it('shows a close button on success state that calls setIsFeedbackOpen(false)', async () => {
      const user = userEvent.setup()
      vi.mocked(useFeedbackModalState).mockReturnValue({
        isFeedbackOpen: true,
        setIsFeedbackOpen: mockSetIsFeedbackOpen,
      })
      vi.mocked(useFetcher).mockReturnValue({
        submit: mockFetcherSubmit,
        state: 'idle',
        data: { success: true },
      } as any)
      renderComponent()
      await user.click(screen.getByRole('button', { name: /close/i }))
      expect(mockSetIsFeedbackOpen).toHaveBeenCalledWith(false)
    })
  })
})
