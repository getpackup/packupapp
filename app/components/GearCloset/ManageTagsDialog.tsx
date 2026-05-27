import { Loader2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import {
  gearListAccommodations,
  gearListActivities,
  gearListCampKitchen,
  gearListOtherConsiderations,
} from '~/lib/gearListItemEnum'

const tagGroups = [
  { label: 'Activities', items: gearListActivities },
  { label: 'Accommodations', items: gearListAccommodations },
  { label: 'Camp Kitchen', items: gearListCampKitchen },
  { label: 'Other', items: gearListOtherConsiderations },
]
import { useUpdateGearClosetCategories } from '~/services/gear'

type ManageTagsDialogProps = {
  userId: string
  currentTags: string[]
  children: React.ReactNode
}

function ManageTagsDialog({ userId, currentTags, children }: ManageTagsDialogProps) {
  const [selected, setSelected] = useState<string[]>(currentTags)
  const { mutateAsync: updateCategories, isPending } = useUpdateGearClosetCategories(userId)

  const toggleTag = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]))
  }

  const handleSave = async () => {
    await updateCategories({ categories: selected })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setSelected(currentTags)
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Manage tags</DialogTitle>
          <DialogDescription>
            Choose which activity types appear in your gear closet. Items matching selected
            activities will be shown.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-4 overflow-y-auto py-2">
          {tagGroups.map((group) => (
            <div key={group.label}>
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {group.items.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <Checkbox
                      id={item.name}
                      checked={selected.includes(item.name)}
                      onCheckedChange={() => toggleTag(item.name)}
                    />
                    <Label htmlFor={item.name} className="cursor-pointer text-sm">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ManageTagsDialog
