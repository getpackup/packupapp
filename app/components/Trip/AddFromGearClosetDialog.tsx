import { ListPlus, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { ScrollArea } from '~/components/ui/scroll-area'
import useAuth from '~/contexts/auth/useAuth'
import { activityLabelToKey } from '~/lib/gearFilterUtils'
import {
  gearListAccommodations,
  gearListActivities,
  gearListCampKitchen,
  gearListOtherConsiderations,
} from '~/lib/gearListItemEnum'
import { useGearClosetQuery } from '~/services/gear'
import { useGeneratePackingList } from '~/services/trips'
import type { ActivityTypes } from '~/types/GearItem'

import ResponsiveDialogContainer from '../ResponsiveDialogContainer'

type AddFromGearClosetDialogProps = {
  tripId: string
  existingTags?: string[]
  children: React.ReactNode
}

const activityGroups = [
  { label: 'Activities', items: gearListActivities },
  { label: 'Accommodations', items: gearListAccommodations },
  { label: 'Camp Kitchen', items: gearListCampKitchen },
  { label: 'Other Considerations', items: gearListOtherConsiderations },
]

function AddFromGearClosetDialog({
  tripId,
  existingTags = [],
  children,
}: AddFromGearClosetDialogProps) {
  const { user } = useAuth()
  const { mutateAsync: generatePackingList, isPending } = useGeneratePackingList()
  const { data: gearCloset } = useGearClosetQuery({
    userId: user?.uid ?? '',
    queryOptions: { enabled: !!user?.uid },
  })
  const [open, setOpen] = useState(false)

  const customTags = gearCloset?.customTags ?? []

  const preSelectedKeys = existingTags
    .map((label) => activityLabelToKey(label))
    .filter((key): key is keyof ActivityTypes => !!key)

  const preSelectedCustomTags = existingTags.filter((label) => !activityLabelToKey(label))

  const [selectedKeys, setSelectedKeys] = useState<Set<keyof ActivityTypes>>(
    new Set(preSelectedKeys)
  )
  const [selectedCustomTags, setSelectedCustomTags] = useState<Set<string>>(
    new Set(preSelectedCustomTags)
  )

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      const keys = existingTags
        .map((label) => activityLabelToKey(label))
        .filter((key): key is keyof ActivityTypes => !!key)
      setSelectedKeys(new Set(keys))
      setSelectedCustomTags(new Set(existingTags.filter((label) => !activityLabelToKey(label))))
    }
  }

  const toggleKey = (key: keyof ActivityTypes) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const toggleCustomTag = (tagName: string) => {
    setSelectedCustomTags((prev) => {
      const next = new Set(prev)
      if (next.has(tagName)) {
        next.delete(tagName)
      } else {
        next.add(tagName)
      }
      return next
    })
  }

  const handleGenerate = async () => {
    if (!user?.uid || (selectedKeys.size === 0 && selectedCustomTags.size === 0)) return

    const result = await generatePackingList({
      tripId,
      activityKeys: Array.from(selectedKeys),
      userId: user.uid,
      customTagNames: Array.from(selectedCustomTags),
    })

    if (result.length > 0) {
      toast.success(`Added ${result.length} items to your packing list`)
    } else {
      toast.info('No new items to add — everything is already on your list')
    }
    setOpen(false)
  }

  return (
    <ResponsiveDialogContainer
      open={open}
      onOpenChange={handleOpenChange}
      title="Add from Gear Closet"
      description="Select tags to add items from your Gear Closet. You can run this again at any time to add more items."
      footerAction={
        <Button
          onClick={handleGenerate}
          disabled={isPending || (selectedKeys.size === 0 && selectedCustomTags.size === 0)}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ListPlus className="h-4 w-4" />
          )}
          {isPending ? 'Adding items...' : 'Add to packing list'}
        </Button>
      }
      trigger={children}
    >
      <ScrollArea className="max-h-100 overflow-y-auto pr-3">
        <div className="space-y-6">
          {activityGroups.map((group) => (
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
                      checked={selectedKeys.has(item.name)}
                      onCheckedChange={() => toggleKey(item.name)}
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
                Custom Tags
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {customTags.map((tag) => (
                  <label
                    key={tag.name}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                  >
                    <Checkbox
                      checked={selectedCustomTags.has(tag.name)}
                      onCheckedChange={() => toggleCustomTag(tag.name)}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </ResponsiveDialogContainer>
  )
}

export default AddFromGearClosetDialog
