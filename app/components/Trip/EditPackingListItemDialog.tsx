import { zodResolver } from '@hookform/resolvers/zod'
import { Timestamp } from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { z } from 'zod'

import useAuth from '~/contexts/auth/useAuth'
import { allPredefinedTags } from '~/lib/gearListItemEnum'
import { getItemTags } from '~/lib/getItemTags'
import { getTagDotClass } from '~/lib/tagColors'
import { useCustomTagColorMap } from '~/lib/useCustomTagColorMap'
import { cn } from '~/lib/utils'
import {
  useCreateGearClosetItem,
  useGearClosetQuery,
  useRemoveGearItem,
  useUpdateGearClosetItem,
} from '~/services/gear'
import { useUpdatePackingListItem } from '~/services/trips'
import type { PackingListItem } from '~/types/PackingListItem'

import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form'
import { Input } from '../ui/input'
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '../ui/multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Textarea } from '../ui/textarea'

const weightUnits = ['g', 'kg', 'oz', 'lb'] as const

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tags: z.array(z.string()),
  description: z.string(),
  weight: z.string(),
  weightUnit: z.enum(weightUnits),
  quantity: z.number().min(1),
  saveToCloset: z.boolean(),
})

type EditPackingListItemDialogProps = {
  item: PackingListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

function EditPackingListItemDialog({ item, open, onOpenChange }: EditPackingListItemDialogProps) {
  const { id: tripId } = useParams()
  const { user } = useAuth()
  const { mutateAsync: updateItem, isPending } = useUpdatePackingListItem({
    tripId: tripId ?? '',
  })
  const { data: closet } = useGearClosetQuery({ userId: user?.uid ?? '', queryOptions: { enabled: !!user?.uid } })
  const customTags = closet?.customTags ?? []
  const colorMap = useCustomTagColorMap(user?.uid ?? '')
  const { mutateAsync: updateGearClosetItem } = useUpdateGearClosetItem(user?.uid ?? '')
  const { mutateAsync: createGearClosetItem } = useCreateGearClosetItem(user?.uid ?? '')
  const { mutateAsync: removeGearItem } = useRemoveGearItem(user?.uid ?? '')

  const isGearLinked = !!item.gearItemId
  const isCustomGear = isGearLinked && item.gearSource === 'custom'
  const isMasterGear = isGearLinked && item.gearSource === 'master'

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name,
      tags: getItemTags(item),
      description: item.overrides?.description ?? item.description ?? '',
      weight: item.overrides?.weight ?? item.weight ?? '',
      weightUnit: item.overrides?.weightUnit ?? item.weightUnit ?? 'g',
      quantity: item.quantity,
      saveToCloset: false,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!tripId) return

    const updateData: Record<string, unknown> = {
      id: item.id,
      name: values.name,
      category: values.tags[0] ?? item.category ?? 'Uncategorized',
      tags: values.tags,
      quantity: values.quantity,
    }

    if (isGearLinked) {
      const overrides: Record<string, string> = {}
      if (values.description !== (item.description ?? '')) {
        overrides.description = values.description
      }
      if (values.weight !== (item.weight ?? '')) {
        overrides.weight = values.weight
      }
      if (values.weightUnit !== (item.weightUnit ?? 'g')) {
        overrides.weightUnit = values.weightUnit
      }
      if (Object.keys(overrides).length > 0) {
        updateData.overrides = { ...(item.overrides ?? {}), ...overrides }
      }
    } else {
      updateData.description = values.description
      if (values.weight) {
        updateData.weight = values.weight
        updateData.weightUnit = values.weightUnit
      }
    }

    await updateItem({ data: updateData as Parameters<typeof updateItem>[0]['data'] })

    if (values.saveToCloset && item.gearItemId) {
      if (isCustomGear) {
        const closetUpdate: Record<string, unknown> = {
          id: item.gearItemId,
          name: values.name,
        }
        if (values.description) closetUpdate.description = values.description
        if (values.weight) closetUpdate.weight = values.weight
        if (values.weightUnit) closetUpdate.weightUnit = values.weightUnit
        await updateGearClosetItem({
          data: closetUpdate as Parameters<typeof updateGearClosetItem>[0]['data'],
        })
      } else if (isMasterGear) {
        await removeGearItem({ gearItemId: item.gearItemId })

        const newItemData: Record<string, unknown> = {
          name: values.name,
          tags: [],
          essential: false,
          created: Timestamp.now(),
        }
        if (values.description) newItemData.description = values.description
        if (values.weight) newItemData.weight = values.weight
        if (values.weightUnit) newItemData.weightUnit = values.weightUnit

        const newItem = await createGearClosetItem({
          data: newItemData as Parameters<typeof createGearClosetItem>[0]['data'],
        })

        await updateItem({
          data: {
            id: item.id,
            gearItemId: newItem.id,
            gearSource: 'custom',
            gearOwnerId: user?.uid,
          } as Parameters<typeof updateItem>[0]['data'],
        })
      }
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit item</DialogTitle>
              <DialogDescription>
                {isGearLinked
                  ? 'Changes to description and weight are saved as overrides for this trip.'
                  : 'Update the details for this packing list item.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <MultiSelect
                      values={field.value}
                      onValuesChange={field.onChange}
                    >
                      <MultiSelectTrigger className="w-full">
                        <MultiSelectValue placeholder="Select tags..." />
                      </MultiSelectTrigger>
                      <MultiSelectContent
                        search={{ placeholder: 'Search tags...', emptyMessage: 'No tags found.' }}
                      >
                        {allPredefinedTags.map((tag) => (
                          <MultiSelectItem key={tag} value={tag} badgeLabel={
                            <span className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  'inline-block h-2 w-2 shrink-0 rounded-full',
                                  getTagDotClass(tag, colorMap)
                                )}
                              />
                              {tag}
                            </span>
                          }>
                            <span
                              className={cn(
                                'inline-block h-2 w-2 shrink-0 rounded-full',
                                getTagDotClass(tag, colorMap)
                              )}
                            />
                            {tag}
                          </MultiSelectItem>
                        ))}
                        {customTags.length > 0 &&
                          customTags.map((ct) => (
                            <MultiSelectItem key={ct.name} value={ct.name} badgeLabel={
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    'inline-block h-2 w-2 shrink-0 rounded-full',
                                    getTagDotClass(ct.name, colorMap)
                                  )}
                                />
                                {ct.name}
                              </span>
                            }>
                              <span
                                className={cn(
                                  'inline-block h-2 w-2 shrink-0 rounded-full',
                                  getTagDotClass(ct.name, colorMap)
                                )}
                              />
                              {ct.name}
                            </MultiSelectItem>
                          ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Optional description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 120" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weightUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weightUnits.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isGearLinked && (
                <FormField
                  control={form.control}
                  name="saveToCloset"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2">
                      <FormControl>
                        <Checkbox
                          id="saveToCloset"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel htmlFor="saveToCloset">
                        Also update this item in your gear closet
                      </FormLabel>
                    </FormItem>
                  )}
                />
              )}
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

export default EditPackingListItemDialog
