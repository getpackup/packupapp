import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { ScrollArea } from '~/components/ui/scroll-area'
import useAuth from '~/contexts/auth/useAuth'
import {
  allGearListItems,
  gearListAccommodations,
  gearListActivities,
  gearListCampKitchen,
  gearListOtherConsiderations,
} from '~/lib/gearListItemEnum'
import { FREQUENT_TAGS_CAP, getFrequentTags } from '~/lib/getFrequentTags'
import { useGearClosetQuery } from '~/services/gear'
import { useUserByIdQuery } from '~/services/users'

import AnimatedContainer from '../../AnimatedContainer'
import { newTripFormSchema } from './schema'

type TagsStepProps = {
  form: UseFormReturn<z.infer<typeof newTripFormSchema>>
}

const tagGroups = [
  { label: 'Activities', items: gearListActivities, field: 'tags' as const },
  { label: 'Accommodations', items: gearListAccommodations, field: 'tags' as const },
  { label: 'Camp Kitchen', items: gearListCampKitchen, field: 'tags' as const },
  { label: 'Other Considerations', items: gearListOtherConsiderations, field: 'personalTags' as const },
]

const predefinedLabelMap = new Map<string, string>(allGearListItems.map((i) => [i.name, i.label]))
const ocKeySet = new Set<string>(gearListOtherConsiderations.map((i) => i.name))

const TagCheckbox = ({
  tagKey,
  label,
  checked,
  onToggle,
}: {
  tagKey: string
  label: string
  checked: boolean
  onToggle: (key: string) => void
}) => (
  <label className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm">
    <Checkbox checked={checked} onCheckedChange={() => onToggle(tagKey)} />
    {label}
  </label>
)

const TagsStep = ({ form }: TagsStepProps) => {
  const { user } = useAuth()
  const userId = user?.uid ?? ''
  const { data: closet } = useGearClosetQuery({ userId, queryOptions: { enabled: !!userId } })
  const { data: userData } = useUserByIdQuery({ userId })
  const customTags = closet?.customTags ?? []
  const tags = form.watch('tags') ?? []
  const personalTags = form.watch('personalTags') ?? []
  const [showAll, setShowAll] = useState(false)

  const frequentTagKeys = getFrequentTags(userData?.tagCounts, customTags, FREQUENT_TAGS_CAP)
  const hasFrequentTags = frequentTagKeys.length > 0

  const toggleSharedTag = (key: string) => {
    const current = form.getValues('tags') ?? []
    const next = current.includes(key) ? current.filter((t) => t !== key) : [...current, key]
    form.setValue('tags', next, { shouldDirty: true })
  }

  const togglePersonalTag = (key: string) => {
    const current = form.getValues('personalTags') ?? []
    const next = current.includes(key) ? current.filter((t) => t !== key) : [...current, key]
    form.setValue('personalTags', next, { shouldDirty: true })
  }

  const toggleFrequentTag = (key: string) => {
    const isPersonal = ocKeySet.has(key) || !predefinedLabelMap.has(key)
    if (isPersonal) togglePersonalTag(key)
    else toggleSharedTag(key)
  }

  const allSelectedTags = [...tags, ...personalTags]

  const allFullListKeys = new Set([
    ...tagGroups.flatMap((g) => g.items.map((i) => i.name)),
    ...customTags.map((ct) => ct.name),
  ])
  const selectedInFullList = allSelectedTags.filter(
    (t) => allFullListKeys.has(t) && !frequentTagKeys.includes(t)
  ).length

  const fullList = (
    <div className="space-y-6">
      {tagGroups.map((group) => (
        <div key={group.label}>
          <h4 className="mb-1 text-sm font-bold tracking-wider uppercase">{group.label}</h4>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((item) => (
              <TagCheckbox
                key={item.name}
                tagKey={item.name}
                label={item.label}
                checked={
                  group.field === 'tags'
                    ? tags.includes(item.name)
                    : personalTags.includes(item.name)
                }
                onToggle={group.field === 'tags' ? toggleSharedTag : togglePersonalTag}
              />
            ))}
          </div>
        </div>
      ))}
      {customTags.length > 0 && (
        <div>
          <h4 className="mb-1 text-sm font-bold tracking-wider uppercase">My Custom Tags</h4>
          <div className="grid grid-cols-2 gap-2">
            {customTags.map((ct) => (
              <TagCheckbox
                key={ct.name}
                tagKey={ct.name}
                label={ct.name}
                checked={personalTags.includes(ct.name)}
                onToggle={togglePersonalTag}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <AnimatedContainer key="tags" animation="scaleAndFadeIn">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">What are you doing on this trip?</h1>
        <p className="text-muted-foreground text-sm">
          Select tags to auto-generate a packing list from your gear closet.
        </p>
        <ScrollArea className="max-h-87.5 overflow-y-auto pr-3">
          {hasFrequentTags ? (
            <div className="space-y-4">
              <div>
                <h4 className="mb-1 text-sm font-bold tracking-wider uppercase">Frequently Used</h4>
                <p className="text-muted-foreground mb-2 text-xs">Based on your previous trips</p>
                <div className="grid grid-cols-2 gap-2">
                  {frequentTagKeys.map((key) => (
                    <TagCheckbox
                      key={key}
                      tagKey={key}
                      label={predefinedLabelMap.get(key) ?? key}
                      checked={allSelectedTags.includes(key)}
                      onToggle={toggleFrequentTag}
                    />
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                type="button"
                className="w-full"
                // className="text-muted-foreground hover:text-foreground text-sm font-medium"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? 'See Less'
                  : selectedInFullList > 0
                    ? `See All Tags (${selectedInFullList} selected)`
                    : 'See All Tags'}
                {showAll ? <ChevronUp /> : <ChevronDown />}
              </Button>
              {showAll && fullList}
            </div>
          ) : (
            fullList
          )}
        </ScrollArea>
      </div>
    </AnimatedContainer>
  )
}

export default TagsStep
