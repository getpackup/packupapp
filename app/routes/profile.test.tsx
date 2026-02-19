import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

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
const mockToastError = vi.fn()
const mockUploadBytes = vi.fn()
const mockGetDownloadURL = vi.fn()

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

vi.mock('firebase/storage', () => ({
  ref: vi.fn().mockReturnValue({}),
  uploadBytes: (...args: unknown[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: unknown[]) => mockGetDownloadURL(...args),
}))

vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}))

vi.mock('~/components/PageHeader', () => ({
  default: () => null,
}))

vi.mock('~/components/PageContent', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('~/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

beforeAll(() => {
  // jsdom doesn't implement these; stub them so upload code doesn't throw
  URL.createObjectURL = vi.fn().mockReturnValue('blob:fake-url')
  URL.revokeObjectURL = vi.fn()

  // jsdom Images never load; stub to fire load handlers with square dimensions
  // (width === height → skips crop dialog and goes straight to upload).
  // Must implement addEventListener/removeEventListener so Radix UI Avatar works.
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = 100
      naturalHeight = 100
      onload: (() => void) | null = null
      private _handlers: Record<string, Array<() => void>> = {}

      addEventListener(event: string, handler: () => void) {
        ;(this._handlers[event] ??= []).push(handler)
      }

      removeEventListener(event: string, handler: () => void) {
        this._handlers[event] = (this._handlers[event] ?? []).filter((h) => h !== handler)
      }

      set src(_: string) {
        setTimeout(() => {
          ;(this._handlers['load'] ?? []).forEach((h) => h())
          this.onload?.()
        }, 0)
      }
    }
  )
})

async function renderProfile() {
  const { default: Profile } = await import('./profile')
  return render(<Profile />)
}

describe('Profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMutateAsync.mockResolvedValue({})
    mockUploadBytes.mockResolvedValue({})
    mockGetDownloadURL.mockResolvedValue('https://storage.example.com/photo.jpg')
    ;(URL.createObjectURL as ReturnType<typeof vi.fn>).mockReturnValue('blob:fake-url')
  })

  // ---------------------------------------------------------------------------
  // Save / Cancel
  // ---------------------------------------------------------------------------

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

      expect(screen.queryByDisplayValue('Changed Value')).not.toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Image upload
  // ---------------------------------------------------------------------------

  describe('Image upload', () => {
    function triggerFileInput(container: HTMLElement, file: File) {
      const input = container.querySelector('input[type="file"]')!
      fireEvent.change(input, { target: { files: [file] } })
    }

    it('shows error toast for an invalid file type', async () => {
      const { container } = await renderProfile()
      fireEvent.click(screen.getByText('Edit'))

      triggerFileInput(container, new File([''], 'photo.gif', { type: 'image/gif' }))

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Please select a JPEG, PNG, or WebP image')
      })
      expect(mockUploadBytes).not.toHaveBeenCalled()
    })

    it('shows error toast for a file over 5 MB', async () => {
      const { container } = await renderProfile()
      fireEvent.click(screen.getByText('Edit'))

      const largeFile = new File([''], 'photo.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 })
      triggerFileInput(container, largeFile)

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Image must be under 5 MB')
      })
      expect(mockUploadBytes).not.toHaveBeenCalled()
    })

    it('uploads a valid image to Firebase Storage', async () => {
      const { container } = await renderProfile()
      fireEvent.click(screen.getByText('Edit'))

      triggerFileInput(container, new File([''], 'photo.jpg', { type: 'image/jpeg' }))

      await waitFor(() => {
        expect(mockUploadBytes).toHaveBeenCalled()
      })
    })

    it.todo('square image skips the crop dialog and uploads directly')
    it.todo('non-square image shows the crop dialog before uploading')
  })

  // ---------------------------------------------------------------------------
  // Crop dialog (requires crop implementation)
  // ---------------------------------------------------------------------------

  describe('Crop dialog', () => {
    it.todo('confirming crop uploads the canvas-extracted blob to Firebase Storage')
    it.todo('cancelling crop discards the selection without uploading')
  })

  // ---------------------------------------------------------------------------
  // Activities
  // ---------------------------------------------------------------------------

  describe('Activities', () => {
    it('toggling an unselected activity adds it to the saved selection', async () => {
      await renderProfile()
      fireEvent.click(screen.getByText('Edit'))

      fireEvent.click(screen.getByText('Paddling'))

      fireEvent.click(screen.getByText('Save'))

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          data: expect.objectContaining({
            favouriteActivities: expect.arrayContaining(['hiking', 'paddling']),
          }),
        })
      })
    })

    it('toggling a selected activity removes it from the saved selection', async () => {
      await renderProfile()
      fireEvent.click(screen.getByText('Edit'))

      fireEvent.click(screen.getByText('Hiking')) // deselect

      fireEvent.click(screen.getByText('Save'))

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          data: expect.objectContaining({
            favouriteActivities: [],
          }),
        })
      })
    })
  })

  // ---------------------------------------------------------------------------
  // Emergency contacts
  // ---------------------------------------------------------------------------

  describe('Emergency contacts', () => {
    it('Add contact button adds a new empty contact row', async () => {
      await renderProfile()
      fireEvent.click(screen.getByText('Edit'))

      fireEvent.click(screen.getByText('Add contact'))

      // Initial mockUser has 1 contact; after adding there should be 2 name inputs
      expect(screen.getAllByPlaceholderText('Name')).toHaveLength(2)
    })

    it('Remove button deletes the contact row', async () => {
      await renderProfile()
      fireEvent.click(screen.getByText('Edit'))

      fireEvent.click(screen.getByLabelText('Remove contact'))

      expect(screen.queryByPlaceholderText('Name')).not.toBeInTheDocument()
    })
  })
})
