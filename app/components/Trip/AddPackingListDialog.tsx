import { zodResolver } from '@hookform/resolvers/zod'
import { Timestamp } from 'firebase/firestore'
import { Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import z from 'zod'

import { Button } from '~/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import useAuth from '~/contexts/auth/useAuth'
import { AnalyticsEvent, trackBrowserEvent } from '~/lib/analytics'
import type { ClosetBrowseItem } from '~/lib/gearFilterUtils'
import { useUserGearClosetItems } from '~/services/gear'
import { useCreatePackingListItem } from '~/services/trips'
import type { PackingListItem } from '~/types/PackingListItem'

import ResponsiveDialogContainer from '../ResponsiveDialogContainer'
import { Badge } from '../ui/badge'
import { Checkbox } from '../ui/checkbox'

type AddPackingListDialogProps = {
  categoryName: string
  onItemCreated?: (itemId: string) => void
  children: React.ReactNode
  tripTags?: string[]
}

function AddPackingListDialog({
  categoryName,
  onItemCreated,
  children,
  tripTags,
}: AddPackingListDialogProps) {
  const { id } = useParams()
  const { user } = useAuth()
  const [selectedGearItem, setSelectedGearItem] = useState<ClosetBrowseItem | null>(null)
  const [showClosetSearch, setShowClosetSearch] = useState(false)

  const { data: closetItems } = useUserGearClosetItems({
    userId: user?.uid ?? '',
  })

  const { mutateAsync: createPackingListItem, isPending } = useCreatePackingListItem()

  const formSchema = z.object({
    name: z.string().min(3, 'Item name must be at least 3 characters'),
    saveToGearCloset: z.boolean(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      saveToGearCloset: true,
    },
  })

  const handleSelectGearItem = (item: ClosetBrowseItem) => {
    setSelectedGearItem(item)
    form.setValue('name', item.name)
    setShowClosetSearch(false)
  }

  const handleClearSelection = () => {
    setSelectedGearItem(null)
    form.setValue('name', '')
    setShowClosetSearch(false)
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id) return

    const itemData: Record<string, unknown> = {
      created: Timestamp.now(),
      category: selectedGearItem?.category ?? categoryName,
      description: selectedGearItem?.description ?? '',
      isEssential: selectedGearItem?.essential ?? false,
      isPacked: false,
      name: values.name,
      packedBy: [
        {
          uid: user?.uid ?? '',
          quantity: 1,
          isShared: false,
        },
      ],
      quantity: 1,
    }
    if (selectedGearItem) {
      itemData.gearItemId = selectedGearItem.id
      itemData.gearSource = selectedGearItem.source
      const tripTagSet = new Set(tripTags ?? [])
      const itemTags =
        tripTags !== undefined
          ? selectedGearItem.tags.filter((t) => tripTagSet.has(t))
          : selectedGearItem.tags
      if (itemTags.length > 0) itemData.tags = itemTags
      if (selectedGearItem.weight) itemData.weight = selectedGearItem.weight
      if (selectedGearItem.weightUnit) itemData.weightUnit = selectedGearItem.weightUnit
      if (selectedGearItem.source === 'custom') itemData.gearOwnerId = user?.uid
    }

    const result = await createPackingListItem({
      tripId: id,
      data: itemData as Omit<PackingListItem, 'id'>,
    })

    if (result?.id && onItemCreated) {
      onItemCreated(result.id)
    }

    if (user?.uid) {
      trackBrowserEvent(AnalyticsEvent.PackingListItemAdded, user.uid, {
        source: 'browser',
        trip_id: id,
        is_group_item: false,
      })
    }

    form.reset()
    setSelectedGearItem(null)
    setShowClosetSearch(false)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  }

  const handleOpenChange = () => {
    form.reset()
    setSelectedGearItem(null)
    setShowClosetSearch(false)
  }

  return (
    <ResponsiveDialogContainer
      onOpenChange={handleOpenChange}
      title="Add gear item"
      description="Add a custom item to your gear closet."
      footerAction={
        <Button type="submit" disabled={isPending} onClick={() => form.handleSubmit(onSubmit)()}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? 'Adding...' : 'Add item'}
        </Button>
      }
      trigger={children}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            {selectedGearItem ? (
              <div className="bg-muted flex items-center justify-between rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{selectedGearItem.name}</div>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    {selectedGearItem.category && (
                      <Badge variant="outline">
                        <span>{selectedGearItem.category}</span>
                      </Badge>
                    )}
                    {selectedGearItem.weight && (
                      <span>
                        {selectedGearItem.weight}
                        {selectedGearItem.weightUnit ?? 'g'}
                      </span>
                    )}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={handleClearSelection}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                {!showClosetSearch ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowClosetSearch(true)}
                    >
                      Search gear closet
                    </Button>
                  </div>
                ) : (
                  <Command className="border" shouldFilter={true}>
                    <CommandInput placeholder="Search your gear closet..." />
                    <CommandList>
                      <CommandEmpty>No gear found.</CommandEmpty>
                      <CommandGroup>
                        {closetItems.map((item) => (
                          <CommandItem
                            key={`${item.source}-${item.id}`}
                            value={item.name}
                            onSelect={() => handleSelectGearItem(item)}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div>
                                <span className="text-sm">{item.name}</span>
                                {item.category && (
                                  <span className="text-muted-foreground ml-2 text-xs">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              {item.weight && (
                                <span className="text-muted-foreground text-xs">
                                  {item.weight}
                                  {item.weightUnit ?? 'g'}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                )}
              </>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item name</FormLabel>
                  <FormControl>
                    <Input placeholder="Item name" {...field} disabled={!!selectedGearItem} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!selectedGearItem && (
              <FormField
                control={form.control}
                name="saveToGearCloset"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <Checkbox
                        id="saveToGearCloset"
                        onCheckedChange={field.onChange}
                        value={field.value.toString()}
                        checked={field.value}
                      />
                    </FormControl>
                    <FormLabel htmlFor="saveToGearCloset">Save to gear closet</FormLabel>
                  </FormItem>
                )}
              />
            )}
          </div>
        </form>
      </Form>
    </ResponsiveDialogContainer>
  )
}

export default AddPackingListDialog
