import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { Checkbox } from '~/components/ui/checkbox'
import { ScrollArea } from '~/components/ui/scroll-area'
import useAuth from '~/contexts/auth/useAuth'
import {
  gearListAccommodations,
  gearListActivities,
  gearListCampKitchen,
  gearListOtherConsiderations,
} from '~/lib/gearListItemEnum'
import { useGearClosetQuery } from '~/services/gear'

import AnimatedContainer from '../../AnimatedContainer'
import { newTripFormSchema } from '.'

type TagsStepProps = {
  form: UseFormReturn<z.infer<typeof newTripFormSchema>>
}

const tagGroups = [
  { label: 'Activities', items: gearListActivities },
  { label: 'Accommodations', items: gearListAccommodations },
  { label: 'Camp Kitchen', items: gearListCampKitchen },
  { label: 'Other Considerations', items: gearListOtherConsiderations },
]

const TagsStep = ({ form }: TagsStepProps) => {
  const { user } = useAuth()
  const userId = user?.uid ?? ''
  const { data: closet } = useGearClosetQuery({ userId, queryOptions: { enabled: !!userId } })
  const customTags = closet?.customTags ?? []
  const tags = form.watch('tags') ?? []

  const toggleTag = (key: string) => {
    const current = form.getValues('tags') ?? []
    const next = current.includes(key) ? current.filter((t) => t !== key) : [...current, key]
    form.setValue('tags', next, { shouldDirty: true })
  }

  return (
    <AnimatedContainer key="tags" animation="scaleAndFadeIn">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">What are you doing on this trip?</h1>
        <p className="text-muted-foreground text-sm">
          Select tags to auto-generate a packing list from your gear closet.
        </p>
        <ScrollArea className="max-h-[350px] overflow-y-auto pr-3">
          <div className="space-y-6">
            {tagGroups.map((group) => (
              <div key={group.label}>
                <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                  {group.label}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => (
                    <label
                      key={item.name}
                      className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                    >
                      <Checkbox
                        checked={tags.includes(item.name)}
                        onCheckedChange={() => toggleTag(item.name)}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {customTags.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                  My Custom Tags
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {customTags.map((ct) => (
                    <label
                      key={ct.name}
                      className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                    >
                      <Checkbox
                        checked={tags.includes(ct.name)}
                        onCheckedChange={() => toggleTag(ct.name)}
                      />

                      {ct.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </AnimatedContainer>
  )
}

export default TagsStep
