import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('~/contexts/auth/useAuth', () => ({
  default: vi.fn(() => ({ user: { uid: 'u1' } })),
  useAuth: vi.fn(() => ({ user: { uid: 'u1' } })),
}))

vi.mock('~/services/gear', () => ({
  useGearClosetQuery: vi.fn(() => ({ data: { customTags: [] } })),
}))

vi.mock('~/services/users', () => ({
  useUserByIdQuery: vi.fn(() => ({ data: undefined })),
}))

vi.mock('~/services/trips', () => ({
  useCreateTrip: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useGeneratePackingList: vi.fn(() => ({ mutateAsync: vi.fn() })),
}))

import useAuth from '~/contexts/auth/useAuth'
import { useGearClosetQuery } from '~/services/gear'
import { useUserByIdQuery } from '~/services/users'
import TagsStep from './TagsStep'

function Wrapper({ defaultTags = [], defaultPersonalTags = [] }: { defaultTags?: string[]; defaultPersonalTags?: string[] }) {
  const form = useForm({ defaultValues: { tags: defaultTags, personalTags: defaultPersonalTags } })
  return (
    <MemoryRouter>
      <FormProvider {...form}>
        <TagsStep form={form as any} />
      </FormProvider>
    </MemoryRouter>
  )
}

function WrapperWithValues({ defaultTags = [], defaultPersonalTags = [] }: { defaultTags?: string[]; defaultPersonalTags?: string[] }) {
  const form = useForm({ defaultValues: { tags: defaultTags, personalTags: defaultPersonalTags } })
  const tags = form.watch('tags') ?? []
  const personalTags = form.watch('personalTags') ?? []
  return (
    <MemoryRouter>
      <FormProvider {...form}>
        <TagsStep form={form as any} />
        <div data-testid="tags-value">{JSON.stringify(tags)}</div>
        <div data-testid="personal-tags-value">{JSON.stringify(personalTags)}</div>
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

      await user.click(screen.getByText(/see all tags/i))

      const fishingCheckbox = screen.getByRole('checkbox', { name: /fishing/i })
      await user.click(fishingCheckbox)

      await user.click(screen.getByText(/see less/i))

      expect(screen.getByText(/see all tags.*1 selected/i)).toBeInTheDocument()
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

  describe('tag field routing', () => {
    it('selecting an Other Considerations checkbox updates personalTags, not tags', async () => {
      const user = userEvent.setup()
      render(<WrapperWithValues />)
      await user.click(screen.getByRole('checkbox', { name: /photography/i }))
      expect(screen.getByTestId('personal-tags-value').textContent).toContain('photography')
      expect(screen.getByTestId('tags-value').textContent).not.toContain('photography')
    })

    it('selecting an Activity checkbox updates tags, not personalTags', async () => {
      const user = userEvent.setup()
      render(<WrapperWithValues />)
      await user.click(screen.getByRole('checkbox', { name: /^hiking$/i }))
      expect(screen.getByTestId('tags-value').textContent).toContain('hiking')
      expect(screen.getByTestId('personal-tags-value').textContent).not.toContain('hiking')
    })

    it('custom gear closet tag checkbox updates personalTags, not tags', async () => {
      vi.mocked(useGearClosetQuery).mockReturnValue({
        data: { customTags: [{ name: 'work' }] },
      } as any)
      const user = userEvent.setup()
      render(<WrapperWithValues />)
      await user.click(screen.getByRole('checkbox', { name: /^work$/i }))
      expect(screen.getByTestId('personal-tags-value').textContent).toContain('work')
      expect(screen.getByTestId('tags-value').textContent).not.toContain('work')
    })
  })
})
