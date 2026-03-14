import { zodResolver } from '@hookform/resolvers/zod'
import { Timestamp } from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import z from 'zod'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '~/components/ui/multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { allPredefinedTags, gearListCategories } from '~/lib/gearListItemEnum'
import {
  useCreateGearClosetItem,
  useGearClosetQuery,
  useRemoveGearItem,
  useUpdateGearClosetItem,
} from '~/services/gear'
import type { GearClosetItem } from '~/types/GearItem'

type EditGearClosetItemDialogProps = {
  userId: string
  item: (GearClosetItem & { isMasterItem?: boolean }) | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  tags: z.array(z.string()).min(1, 'Select at least one tag'),
  weight: z.string().optional(),
  weightUnit: z.enum(['g', 'kg', 'oz', 'lb']).optional(),
  description: z.string().optional(),
})

function EditGearClosetItemDialog({
  userId,
  item,
  open,
  onOpenChange,
}: EditGearClosetItemDialogProps) {
  const { mutateAsync: updateItem, isPending: isUpdating } = useUpdateGearClosetItem(userId)
  const { mutateAsync: createItem, isPending: isCreating } = useCreateGearClosetItem(userId)
  const { mutateAsync: hideItem } = useRemoveGearItem(userId)
  const { data: closet } = useGearClosetQuery({ userId, queryOptions: { enabled: !!userId } })
  const customTags = closet?.customTags ?? []
  const isPending = isUpdating || isCreating

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    values: {
      name: item?.name ?? '',
      tags: item?.tags ?? [],
      weight: item?.weight ?? '',
      weightUnit: item?.weightUnit ?? 'g',
      description: item?.description ?? '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!item) return

    if (item.isMasterItem) {
      const newData: Record<string, unknown> = {
        name: values.name,
        tags: values.tags,
        essential: false,
        quantity: item.quantity ?? 1,
        created: Timestamp.now(),
      }
      if (values.weight) {
        newData.weight = values.weight
        newData.weightUnit = values.weightUnit ?? 'g'
      }
      if (values.description) {
        newData.description = values.description
      }

      await createItem({ data: newData as Omit<GearClosetItem, 'id'> })
      await hideItem({ gearItemId: item.id })
    } else {
      const data: Record<string, unknown> = {
        id: item.id,
        name: values.name,
        tags: values.tags,
      }
      if (values.weight) {
        data.weight = values.weight
        data.weightUnit = values.weightUnit ?? 'g'
      }
      if (values.description) {
        data.description = values.description
      }

      await updateItem({ data: data as Partial<GearClosetItem> & { id: string } })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit gear item</DialogTitle>
              <DialogDescription>Update your gear item details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Osprey Atmos 65" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <MultiSelect values={field.value} onValuesChange={field.onChange}>
                      <MultiSelectTrigger className="w-full">
                        <MultiSelectValue placeholder="Select tags..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent
                        search={{ placeholder: 'Search tags...', emptyMessage: 'No tags found' }}
                      >
                        <MultiSelectGroup heading="General">
                          {gearListCategories.map((cat) => (
                            <MultiSelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                        <MultiSelectGroup heading="Activities">
                          {allPredefinedTags
                            .filter((t) => !gearListCategories.some((c) => c.value === t))
                            .map((tag) => (
                              <MultiSelectItem key={tag} value={tag}>
                                {tag}
                              </MultiSelectItem>
                            ))}
                        </MultiSelectGroup>
                        {customTags.length > 0 && (
                          <MultiSelectGroup heading="Custom">
                            {customTags.map((tag) => (
                              <MultiSelectItem key={tag.name} value={tag.name}>
                                {tag.name}
                              </MultiSelectItem>
                            ))}
                          </MultiSelectGroup>
                        )}
                      </MultiSelectContent>
                    </MultiSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input placeholder="0" type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weightUnit"
                  render={({ field }) => (
                    <FormItem className="w-20">
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional notes..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default EditGearClosetItemDialog
