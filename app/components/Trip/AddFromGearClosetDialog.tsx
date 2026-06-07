import { ChevronDown, ChevronUp, ListPlus, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { ScrollArea } from '~/components/ui/scroll-area'
import useAuth from '~/contexts/auth/useAuth'
import { AnalyticsEvent, getPlatform, trackBrowserEvent } from '~/lib/analytics'
import { activityLabelToKey } from '~/lib/gearFilterUtils'
import {
  allGearListItems,
  gearListAccommodations,
  gearListActivities,
  gearListCampKitchen,
  gearListKeys,
  gearListOtherConsiderations,
} from '~/lib/gearListItemEnum'
import { FREQUENT_TAGS_CAP, getFrequentTags } from '~/lib/getFrequentTags'
import { useGearClosetQuery } from '~/services/gear'
import { useGeneratePackingList } from '~/services/trips'
import { useUserByIdQuery } from '~/services/users'
import type { ActivityTypes } from '~/types/GearItem'

import ResponsiveDialogContainer from '../ResponsiveDialogContainer'

type AddFromGearClosetDialogProps = {
  tripId: string
  existingTags?: string[]
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const activityGroups = [
  { label: 'Activities', items: gearListActivities },
  { label: 'Accommodations', items: gearListAccommodations },
  { label: 'Camp Kitchen', items: gearListCampKitchen },
  { label: 'Other Considerations', items: gearListOtherConsiderations },
]

const predefinedLabelMap = new Map<string, string>(allGearListItems.map((i) => [i.name, i.label]))
const predefinedKeySet = new Set<string>(gearListKeys)

function buildSelections(existingTags: string[]) {
  const keys: (keyof ActivityTypes)[] = []
  const customTagNames: string[] = []
  for (const label of existingTags) {
    const key = activityLabelToKey(label)
    if (key) {
      keys.push(key)
    } else {
      customTagNames.push(label)
    }
  }
  return { keys, customTagNames }
}

function AddFromGearClosetDialog({
  tripId,
  existingTags = [],
  children,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
}: AddFromGearClosetDialogProps) {
  const { user } = useAuth()
  const { mutateAsync: generatePackingList, isPending } = useGeneratePackingList()
  const { data: gearCloset } = useGearClosetQuery({
    userId: user?.uid ?? '',
    queryOptions: { enabled: !!user?.uid },
  })
  const { data: userData } = useUserByIdQuery({ userId: user?.uid ?? '' })
  const [internalOpen, setInternalOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen

  const customTags = gearCloset?.customTags ?? []

  const [selectedKeys, setSelectedKeys] = useState<Set<keyof ActivityTypes>>(new Set())
  const [selectedCustomTags, setSelectedCustomTags] = useState<Set<string>>(new Set())

  // Reset selections when controlled open transitions to true
  useEffect(() => {
    if (controlledOpen === true) {
      const { keys, customTagNames } = buildSelections(existingTags)
      setSelectedKeys(new Set(keys))
      setSelectedCustomTags(new Set(customTagNames))
      setShowAll(false)
    }
    // intentionally omit existingTags — we snapshot on open, not on every tag change
  }, [controlledOpen])

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
      if (newOpen) {
        const { keys, customTagNames } = buildSelections(existingTags)
        setSelectedKeys(new Set(keys))
        setSelectedCustomTags(new Set(customTagNames))
        setShowAll(false)
      }
    }
    onControlledOpenChange?.(newOpen)
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

  const toggleSuggestedTag = (key: string) => {
    if (predefinedKeySet.has(key)) {
      toggleKey(key as keyof ActivityTypes)
    } else {
      toggleCustomTag(key)
    }
  }

  // Snapshot existing tag keys once; stable as long as existingTags prop is stable
  const existingTagKeySet = useMemo(() => {
    const { keys, customTagNames } = buildSelections(existingTags)
    return new Set<string>([...keys, ...customTagNames])
  }, [existingTags])

  const frequentTagKeys = getFrequentTags(userData?.tagCounts, customTags, FREQUENT_TAGS_CAP)

  const suggestedKeys = useMemo(() => {
    const existing = Array.from(existingTagKeySet)
    const frequentNotExisting = frequentTagKeys
      .filter((k) => !existingTagKeySet.has(k))
      .slice(0, FREQUENT_TAGS_CAP)
    return [...existing, ...frequentNotExisting]
  }, [existingTagKeySet, frequentTagKeys])

  const hasSuggested = suggestedKeys.length > 0

  const allSelected = useMemo(
    () => new Set<string>([...selectedKeys, ...selectedCustomTags]),
    [selectedKeys, selectedCustomTags]
  )

  const allFullListKeys = useMemo(
    () =>
      new Set<string>([
        ...activityGroups.flatMap((g) => g.items.map((i) => i.name)),
        ...customTags.map((ct) => ct.name),
      ]),
    [customTags]
  )

  const selectedInFullList = useMemo(
    () => [...allSelected].filter((k) => allFullListKeys.has(k) && !suggestedKeys.includes(k)).length,
    [allSelected, allFullListKeys, suggestedKeys]
  )

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

    if (user?.uid) {
      trackBrowserEvent(AnalyticsEvent.AddFromGearClosetCompleted, user.uid, {
        source: 'browser',
        platform: getPlatform(),
        trip_id: tripId,
        items_added: result.length,
        tag_count: selectedKeys.size + selectedCustomTags.size,
      })
    }

    handleOpenChange(false)
  }

  const fullList = (
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
  )

  return (
    <ResponsiveDialogContainer
      open={isOpen}
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
        {hasSuggested ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                Suggested
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {suggestedKeys.map((key) => (
                  <label
                    key={key}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                  >
                    <Checkbox
                      checked={allSelected.has(key)}
                      onCheckedChange={() => toggleSuggestedTag(key)}
                    />
                    {predefinedLabelMap.get(key) ?? key}
                  </label>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? 'See Less'
                : selectedInFullList > 0
                  ? `See All Tags (${selectedInFullList} selected)`
                  : 'See All Tags'}
              {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {showAll && fullList}
          </div>
        ) : (
          fullList
        )}
      </ScrollArea>
    </ResponsiveDialogContainer>
  )
}

export default AddFromGearClosetDialog
