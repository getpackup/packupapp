import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { allPredefinedTags } from '~/lib/gearListItemEnum'
import { TAG_COLOR_KEYS, type TagColorKey } from '~/lib/tagColors'
import { cn } from '~/lib/utils'
import {
  useCreateCustomTag,
  useDeleteCustomTag,
  useGearClosetQuery,
  useUpdateCustomTag,
} from '~/services/gear'

type ManageCustomTagsDialogProps = {
  userId: string
  children: React.ReactNode
}

function ColorPickerDropdown({
  value,
  onChange,
}: {
  value: TagColorKey
  onChange: (color: TagColorKey) => void
}) {
  const [open, setOpen] = useState(false)
  const colorClasses: Record<TagColorKey, string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    lime: 'bg-lime-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    fuchsia: 'bg-fuchsia-500',
    pink: 'bg-pink-500',
    rose: 'bg-rose-500',
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'h-9 shrink-0 rounded-md border px-1.5 transition-colors hover:opacity-80',
            'flex items-center justify-center gap-0.5'
          )}
        >
          <span className={cn('h-4 w-4 rounded-full', colorClasses[value])} />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-6 gap-1.5">
          {TAG_COLOR_KEYS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => { onChange(color); setOpen(false) }}
              className={cn(
                'h-6 w-6 rounded-full transition-all',
                colorClasses[color],
                value === color ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : 'hover:scale-110'
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ManageCustomTagsDialog({ userId, children }: ManageCustomTagsDialogProps) {
  const { data: closet } = useGearClosetQuery({ userId, queryOptions: { enabled: !!userId } })
  const customTags = closet?.customTags ?? []

  const { mutateAsync: createTag } = useCreateCustomTag(userId)
  const { mutateAsync: updateTag } = useUpdateCustomTag(userId)
  const { mutateAsync: deleteTag } = useDeleteCustomTag(userId)

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState<TagColorKey>('blue')
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState<TagColorKey>('blue')
  const [error, setError] = useState('')

  const validateName = (name: string, excludeName?: string): string | null => {
    const trimmed = name.trim()
    if (!trimmed) return 'Tag name is required'
    if (allPredefinedTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      return 'This name matches a predefined tag'
    }
    if (
      customTags.some(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase() && t.name !== excludeName
      )
    ) {
      return 'A custom tag with this name already exists'
    }
    return null
  }

  const handleCreate = async () => {
    const validationError = validateName(newName)
    if (validationError) {
      setError(validationError)
      return
    }
    await createTag({ tag: { name: newName.trim(), color: newColor } })
    setNewName('')
    setNewColor('blue')
    setError('')
  }

  const startEditing = (tagName: string, tagColor: TagColorKey) => {
    setEditingTag(tagName)
    setEditName(tagName)
    setEditColor(tagColor)
    setError('')
  }

  const handleUpdate = async () => {
    if (!editingTag) return
    const validationError = validateName(editName, editingTag)
    if (validationError) {
      setError(validationError)
      return
    }
    await updateTag({ oldName: editingTag, newTag: { name: editName.trim(), color: editColor } })
    setEditingTag(null)
    setError('')
  }

  const handleDelete = async (tagName: string) => {
    await deleteTag({ tagName })
  }

  const colorClasses: Record<TagColorKey, string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    yellow: 'bg-yellow-500',
    lime: 'bg-lime-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    sky: 'bg-sky-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    purple: 'bg-purple-500',
    fuchsia: 'bg-fuchsia-500',
    pink: 'bg-pink-500',
    rose: 'bg-rose-500',
  }

  return (
    <Dialog onOpenChange={() => { setEditingTag(null); setError('') }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Custom tags</DialogTitle>
          <DialogDescription>
            Create your own tags with custom colors. These appear alongside predefined tags in tag pickers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {customTags.length > 0 && (
            <div className="space-y-2">
              {customTags.map((tag) =>
                editingTag === tag.name ? (
                  <div key={tag.name} className="space-y-2 rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <ColorPickerDropdown value={editColor} onChange={setEditColor} />
                      <Input
                        value={editName}
                        onChange={(e) => { setEditName(e.target.value); setError('') }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUpdate() } }}
                        placeholder="Tag name"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      {error && <p className="text-destructive text-xs">{error}</p>}
                      <div className="ml-auto flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingTag(null); setError('') }}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleUpdate}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    key={tag.name}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn('h-3 w-3 rounded-full', colorClasses[tag.color])} />
                      <span className="text-sm font-medium">{tag.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => startEditing(tag.name, tag.color)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-7 w-7"
                        onClick={() => handleDelete(tag.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {!editingTag && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <ColorPickerDropdown value={newColor} onChange={setNewColor} />
                <Input
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate() } }}
                  placeholder="New tag name..."
                />
              </div>
              <div className="flex items-center justify-between">
                {error && <p className="text-destructive text-xs">{error}</p>}
                <Button size="sm" className="ml-auto" onClick={handleCreate} disabled={!newName.trim()}>
                  Add tag
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ManageCustomTagsDialog
