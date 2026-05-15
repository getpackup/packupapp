import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../contexts/auth/useAuth', () => ({
  default: vi.fn(() => ({ user: { uid: 'u1' } })),
  useAuth: vi.fn(() => ({ user: { uid: 'u1' } })),
}))

vi.mock('../../../services/gear', () => ({
  useGearClosetQuery: vi.fn(() => ({ data: { customTags: [] } })),
}))

vi.mock('../../../services/users', () => ({
  useUserByIdQuery: vi.fn(() => ({ data: undefined })),
}))

vi.mock('../../../services/trips', () => ({
  useCreateTrip: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useGeneratePackingList: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

import useAuth from '../../../contexts/auth/useAuth'
import { useGearClosetQuery } from '../../../services/gear'
import { useUserByIdQuery } from '../../../services/users'
import TagsStep from './TagsStep'

function Wrapper({ defaultTags = [] }: { defaultTags?: string[] }) {
  const form = useForm({ defaultValues: { tags: defaultTags } })
  return (
    <MemoryRouter>
      <FormProvider {...form}>
        <TagsStep form={form as any} />
      </FormProvider>
    </MemoryRouter>
  )
}

describe('TagsStep', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: 'u1' } } as any)
    vi.mocked(useGearClosetQuery).mockReturnValue({ data: { customTags: [] } } as any)
    vi.mocked(useUserByIdQuery).mockReturnValue({ data: undefined } as any)
  })

  describe('no tagCounts (new user)', () => {
    it('shows full grouped list with no Frequently Used heading', () => {
      render(<Wrapper />)
      expect(screen.getByText('Activities')).toBeInTheDocument()
      expect(screen.getByText('Accommodations')).toBeInTheDocument()
      expect(screen.queryByText('Frequently Used')).not.toBeInTheDocument()
    })

    it('does not show See All toggle', () => {
      render(<Wrapper />)
      expect(screen.queryByText(/see all/i)).not.toBeInTheDocument()
    })
  })

  describe('has tagCounts (returning user)', () => {
    beforeEach(() => {
      vi.mocked(useUserByIdQuery).mockReturnValue({
        data: { tagCounts: { hiking: 5, tent: 3, paddling: 1 } },
      } as any)
    })

    it('renders Frequently Used heading', () => {
      render(<Wrapper />)
      expect(screen.getByText('Frequently Used')).toBeInTheDocument()
    })

    it('renders frequent tags unchecked by default', () => {
      render(<Wrapper />)
      const hikingCheckboxes = screen.getAllByRole('checkbox', { name: /hiking/i })
      hikingCheckboxes.forEach((cb) => {
        expect(cb).not.toBeChecked()
      })
    })

    it('shows See All toggle', () => {
      render(<Wrapper />)
      expect(screen.getByText(/see all/i)).toBeInTheDocument()
    })

    it('selecting a tag in Frequently Used section checks it in both sections', async () => {
      const user = userEvent.setup()
      render(<Wrapper />)
      const hikingCheckboxes = screen.getAllByRole('checkbox', { name: /hiking/i })
      await user.click(hikingCheckboxes[0])
      hikingCheckboxes.forEach((cb) => {
        expect(cb).toBeChecked()
      })
    })

    it('shows selected count in See All toggle when tags selected inside collapsed section', async () => {
      const user = userEvent.setup()
      render(<Wrapper />)

      await user.click(screen.getByText(/see all/i))

      const allActivitiesHeadings = screen.getAllByText('Activities')
      const fullListActivities = allActivitiesHeadings[allActivitiesHeadings.length - 1]
      const fullListSection = fullListActivities.closest('div')!
      const fishingCheckbox = screen.getByRole('checkbox', { name: /fishing/i })
      await user.click(fishingCheckbox)

      await user.click(screen.getByText(/see less/i))

      expect(screen.getByText(/see all.*1 selected/i)).toBeInTheDocument()
    })
  })

  describe('ghost custom tag filtering', () => {
    it('excludes custom tag from Frequently Used when deleted from Gear Closet', () => {
      vi.mocked(useUserByIdQuery).mockReturnValue({
        data: { tagCounts: { hiking: 3, 'deleted-custom': 5 } },
      } as any)
      vi.mocked(useGearClosetQuery).mockReturnValue({
        data: { customTags: [] },
      } as any)

      render(<Wrapper />)
      expect(screen.getByText('Frequently Used')).toBeInTheDocument()
      expect(screen.queryByText('deleted-custom')).not.toBeInTheDocument()
    })
  })
})
