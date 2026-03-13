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
import { allGearListItems } from '~/lib/gearListItemEnum'
import { useUpdateGearClosetCategories } from '~/services/gear'

type ManageCategoriesDialogProps = {
  userId: string
  currentCategories: string[]
  children: React.ReactNode
}

function ManageCategoriesDialog({
  userId,
  currentCategories,
  children,
}: ManageCategoriesDialogProps) {
  const [selected, setSelected] = useState<string[]>(currentCategories)
  const { mutateAsync: updateCategories, isPending } = useUpdateGearClosetCategories(userId)

  const toggleCategory = (name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]))
  }

  const handleSave = async () => {
    await updateCategories({ categories: selected })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setSelected(currentCategories)
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
          <DialogDescription>
            Choose which activity types appear in your gear closet. Items matching selected
            activities will be shown.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto py-2">
          {allGearListItems.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <Checkbox
                id={item.name}
                checked={selected.includes(item.name)}
                onCheckedChange={() => toggleCategory(item.name)}
              />
              <Label htmlFor={item.name} className="cursor-pointer text-sm">
                {item.label}
              </Label>
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

export default ManageCategoriesDialog
