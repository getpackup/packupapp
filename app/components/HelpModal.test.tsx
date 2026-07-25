import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSetIsHelpOpen = vi.fn()

vi.mock('../contexts/globalState', () => ({
  useHelpModalState: vi.fn(() => ({
    isHelpOpen: false,
    setIsHelpOpen: mockSetIsHelpOpen,
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
import { useHelpModalState } from '../contexts/globalState'
import { useIsAnonymous } from '../lib/useIsAnonymous'
import { HelpModal } from './HelpModal'

function renderComponent() {
  return render(
    <MemoryRouter>
      <HelpModal />
    </MemoryRouter>
  )
}

describe('HelpModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('visibility', () => {
    it('does not render the dialog when isHelpOpen is false', () => {
      vi.mocked(useHelpModalState).mockReturnValue({
        isHelpOpen: false,
        setIsHelpOpen: mockSetIsHelpOpen,
      })
      renderComponent()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders the dialog when isHelpOpen is true', () => {
      vi.mocked(useHelpModalState).mockReturnValue({
        isHelpOpen: true,
        setIsHelpOpen: mockSetIsHelpOpen,
      })
      renderComponent()
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('form fields', () => {
    beforeEach(() => {
      vi.mocked(useHelpModalState).mockReturnValue({
        isHelpOpen: true,
        setIsHelpOpen: mockSetIsHelpOpen,
      })
    })

    it('renders a textarea for the message', () => {
      renderComponent()
      expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument()
    })

    it('does not render emotion or category toggles', () => {
      renderComponent()
      expect(screen.queryByRole('button', { name: /😍/ })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^bug$/i })).not.toBeInTheDocument()
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

  describe('validation errors', () => {
    beforeEach(() => {
      vi.mocked(useHelpModalState).mockReturnValue({
        isHelpOpen: true,
        setIsHelpOpen: mockSetIsHelpOpen,
      })
    })

    it('shows message error when submitting with an empty message', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.click(screen.getByRole('button', { name: /send message/i }))
      expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument()
    })

    it('does not show an error when the message is long enough', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.type(screen.getByRole('textbox', { name: /message/i }), 'long enough message')
      await user.click(screen.getByRole('button', { name: /send message/i }))
      expect(screen.queryByText(/at least 10 characters/i)).not.toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    beforeEach(() => {
      vi.mocked(useHelpModalState).mockReturnValue({
        isHelpOpen: true,
        setIsHelpOpen: mockSetIsHelpOpen,
      })
    })

    it('submits form data to /resource/send-help', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.type(screen.getByRole('textbox', { name: /message/i }), 'this is my help request')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      expect(mockFetcherSubmit).toHaveBeenCalledWith(expect.any(FormData), {
        method: 'POST',
        action: '/resource/send-help',
      })
    })
  })

  describe('success state', () => {
    it('shows thank-you message after successful submission', () => {
      vi.mocked(useHelpModalState).mockReturnValue({
        isHelpOpen: true,
        setIsHelpOpen: mockSetIsHelpOpen,
      })
      vi.mocked(useFetcher).mockReturnValue({
        submit: mockFetcherSubmit,
        state: 'idle',
        data: { success: true },
      } as any)
      renderComponent()
      expect(screen.getByText(/thanks for reaching out/i)).toBeInTheDocument()
    })

    it('shows a close button on success state that calls setIsHelpOpen(false)', async () => {
      const user = userEvent.setup()
      vi.mocked(useHelpModalState).mockReturnValue({
        isHelpOpen: true,
        setIsHelpOpen: mockSetIsHelpOpen,
      })
      vi.mocked(useFetcher).mockReturnValue({
        submit: mockFetcherSubmit,
        state: 'idle',
        data: { success: true },
      } as any)
      renderComponent()
      await user.click(screen.getByRole('button', { name: /close/i }))
      expect(mockSetIsHelpOpen).toHaveBeenCalledWith(false)
    })
  })
})
