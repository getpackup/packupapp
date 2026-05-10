import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/useIsAnonymous', () => ({
  useIsAnonymous: vi.fn(),
}))

const mockUpdateUserAsync = vi.fn()

vi.mock('../contexts/auth/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'u1', username: 'testuser', email: 'test@test.com', emergencyContacts: [] },
  })),
}))

vi.mock('../services/users', () => ({
  useUpdateUser: vi.fn(() => ({
    mutateAsync: mockUpdateUserAsync,
  })),
}))

import { useAuth } from '../contexts/auth/useAuth'
import { useIsAnonymous } from '../lib/useIsAnonymous'
import { EmergencyContacts } from './EmergencyContacts'

function renderComponent() {
  return render(
    <MemoryRouter>
      <EmergencyContacts />
    </MemoryRouter>
  )
}

describe('EmergencyContacts', () => {
  describe('anonymous users', () => {
    it('shows account gate instead of contacts form', () => {
      vi.mocked(useIsAnonymous).mockReturnValue(true)
      renderComponent()
      expect(
        screen.getByText('Create an account to manage your emergency contacts.')
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /add emergency contact/i })).not.toBeInTheDocument()
    })

    it('shows "Create account" CTA linking to /signup', () => {
      vi.mocked(useIsAnonymous).mockReturnValue(true)
      renderComponent()
      const link = screen.getByRole('link', { name: /create account/i })
      expect(link).toHaveAttribute('href', '/signup')
    })
  })

  describe('registered users', () => {
    beforeEach(() => {
      vi.mocked(useIsAnonymous).mockReturnValue(false)
      mockUpdateUserAsync.mockReset()
    })

    it('shows the Emergency Contacts heading', () => {
      renderComponent()
      expect(screen.getByText('Emergency Contacts')).toBeInTheDocument()
    })

    it('shows add button when no contacts exist', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /add emergency contact/i })).toBeInTheDocument()
    })

    it('shows validation error when submitting without name', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.click(screen.getByRole('button', { name: /add emergency contact/i }))
      await user.type(screen.getByLabelText(/phone number/i), '555-1234')
      await user.click(screen.getByRole('button', { name: /^save$/i }))
      expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
    })

    it('shows validation error when submitting without phone number', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.click(screen.getByRole('button', { name: /add emergency contact/i }))
      await user.type(screen.getByLabelText(/^name$/i), 'Jane Doe')
      await user.click(screen.getByRole('button', { name: /^save$/i }))
      expect(await screen.findByText(/phone number is required/i)).toBeInTheDocument()
    })

    it('shows validation error for invalid email format', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.click(screen.getByRole('button', { name: /add emergency contact/i }))
      await user.type(screen.getByLabelText(/^name$/i), 'Jane Doe')
      await user.type(screen.getByLabelText(/phone number/i), '555-1234')
      await user.type(screen.getByLabelText(/email/i), 'not-an-email')
      await user.click(screen.getByRole('button', { name: /^save$/i }))
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
      })
    })

    it('saves a new contact with name and phone number', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.click(screen.getByRole('button', { name: /add emergency contact/i }))
      await user.type(screen.getByLabelText(/^name$/i), 'Jane Doe')
      await user.type(screen.getByLabelText(/phone number/i), '555-1234')
      await user.click(screen.getByRole('button', { name: /^save$/i }))
      expect(mockUpdateUserAsync).toHaveBeenCalledWith({
        data: {
          emergencyContacts: [{ name: 'Jane Doe', phoneNumber: '555-1234', email: '' }],
        },
      })
    })

    it('saves a new contact with optional email', async () => {
      const user = userEvent.setup()
      renderComponent()
      await user.click(screen.getByRole('button', { name: /add emergency contact/i }))
      await user.type(screen.getByLabelText(/^name$/i), 'Jane Doe')
      await user.type(screen.getByLabelText(/phone number/i), '555-1234')
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com')
      await user.click(screen.getByRole('button', { name: /^save$/i }))
      expect(mockUpdateUserAsync).toHaveBeenCalledWith({
        data: {
          emergencyContacts: [
            { name: 'Jane Doe', phoneNumber: '555-1234', email: 'jane@example.com' },
          ],
        },
      })
    })

    it('displays existing contacts', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          emergencyContacts: [
            { name: 'Alice', phoneNumber: '111-1111', email: 'alice@example.com' },
            { name: 'Bob', phoneNumber: '222-2222', email: '' },
          ],
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('111-1111')).toBeInTheDocument()
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('222-2222')).toBeInTheDocument()
    })

    it('hides add button when 3 contacts exist', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          emergencyContacts: [
            { name: 'A', phoneNumber: '1', email: '' },
            { name: 'B', phoneNumber: '2', email: '' },
            { name: 'C', phoneNumber: '3', email: '' },
          ],
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      expect(screen.queryByRole('button', { name: /add emergency contact/i })).not.toBeInTheDocument()
    })

    it('can delete an existing contact', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          emergencyContacts: [
            { name: 'Alice', phoneNumber: '111-1111', email: '' },
            { name: 'Bob', phoneNumber: '222-2222', email: '' },
          ],
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      const aliceRow = screen.getByText('Alice').closest('[data-testid="emergency-contact"]')!
      await user.click(within(aliceRow).getByRole('button', { name: /delete/i }))
      expect(mockUpdateUserAsync).toHaveBeenCalledWith({
        data: {
          emergencyContacts: [{ name: 'Bob', phoneNumber: '222-2222', email: '' }],
        },
      })
    })

    it('can edit an existing contact', async () => {
      const user = userEvent.setup()
      vi.mocked(useAuth).mockReturnValue({
        user: {
          uid: 'u1',
          username: 'testuser',
          email: 'test@test.com',
          emergencyContacts: [{ name: 'Alice', phoneNumber: '111-1111', email: '' }],
        },
        setUser: vi.fn(),
      } as any)
      renderComponent()
      const aliceRow = screen.getByText('Alice').closest('[data-testid="emergency-contact"]')!
      await user.click(within(aliceRow).getByRole('button', { name: /edit/i }))
      const nameInput = screen.getByLabelText(/^name$/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'Alice Updated')
      await user.click(screen.getByRole('button', { name: /^save$/i }))
      expect(mockUpdateUserAsync).toHaveBeenCalledWith({
        data: {
          emergencyContacts: [{ name: 'Alice Updated', phoneNumber: '111-1111', email: '' }],
        },
      })
    })
  })
})
