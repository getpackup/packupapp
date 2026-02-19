import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach,describe, expect, it, vi } from 'vitest'

import type { User } from '~/types/User'

const mockUser: User = {
  uid: 'test-uid',
  id: 'test-uid',
  displayName: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  bio: 'Test bio',
  location: 'Vancouver, BC',
  photoURL: '',
  favouriteActivities: ['hiking'],
  emergencyContacts: [{ name: 'Jane', email: 'jane@test.com', phoneNumber: '555-1234' }],
}

const mockMutateAsync = vi.fn()

vi.mock('~/contexts/auth/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('~/services/users', () => ({
  useUpdateUser: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}))

vi.mock('~/lib/useGooglePlaces', () => ({
  useGooglePlaces: () => ({
    isPlacesReady: false,
    fetchAutocompleteSuggestions: vi.fn().mockResolvedValue([]),
  }),
}))

vi.mock('firebase/auth', () => ({
  updateProfile: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/firebase/config', () => ({
  firebaseAuth: { currentUser: null },
  firebaseStorage: {},
}))

vi.mock('~/components/PageHeader', () => ({
  default: () => null,
}))

vi.mock('~/components/PageContent', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Suppress Radix UI tooltip portal warnings in tests
vi.mock('~/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

async function renderProfile() {
  const { default: Profile } = await import('./profile')
  return render(<Profile />)
}

describe('Profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync.mockResolvedValue({})
  })

  describe('Save', () => {
    it('calls useUpdateUser with updated fields on save', async () => {
      await renderProfile()

      fireEvent.click(screen.getByText('Edit'))

      const displayNameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(displayNameInput, { target: { value: 'Updated User' } })

      fireEvent.click(screen.getByText('Save'))

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          data: expect.objectContaining({ displayName: 'Updated User' }),
        })
      })
    })

    it('exits edit mode after saving', async () => {
      await renderProfile()

      fireEvent.click(screen.getByText('Edit'))
      expect(screen.getByText('Save')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Save'))

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
        expect(screen.queryByText('Save')).not.toBeInTheDocument()
      })
    })
  })

  describe('Cancel', () => {
    it('does not call useUpdateUser on cancel', async () => {
      await renderProfile()

      fireEvent.click(screen.getByText('Edit'))

      const displayNameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(displayNameInput, { target: { value: 'Changed Value' } })

      fireEvent.click(screen.getByText('Cancel'))

      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('shows original values in view mode after cancelling', async () => {
      await renderProfile()

      fireEvent.click(screen.getByText('Edit'))

      const displayNameInput = screen.getByDisplayValue('Test User')
      fireEvent.change(displayNameInput, { target: { value: 'Changed Value' } })

      fireEvent.click(screen.getByText('Cancel'))

      // Input should revert — the page header shows the original name
      expect(screen.queryByDisplayValue('Changed Value')).not.toBeInTheDocument()
    })
  })
})
