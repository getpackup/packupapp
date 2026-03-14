import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import z from 'zod'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Form } from '~/components/ui/form'
import useAuth from '~/contexts/auth/useAuth'
import { activityLabelToKey } from '~/lib/gearFilterUtils'
import { tripKeys, useGeneratePackingList, useUpdateTrip } from '~/services/trips'
import type { ActivityTypes } from '~/types/GearItem'
import type { Trip } from '~/types/Trip'

import { Button } from '../ui/button'
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from '../ui/multi-select'

export function EditTripTags({
  name,
  tags,
  options,
  children,
}: {
  name: string
  tags: string[]
  options: { name: string; label: string }[]
  children: React.ReactNode
}) {
  const { id } = useParams()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const { mutateAsync: updateTripAsync } = useUpdateTrip(String(id))
  const { mutateAsync: generatePackingList } = useGeneratePackingList()
  const queryClient = useQueryClient()

  const formKeys = options.map((option) => option.label)

  const formSchema = z.object(Object.fromEntries(formKeys.map((key) => [key, z.boolean()])))

  const form = useForm<Record<string, boolean>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...Object.fromEntries(formKeys.map((key) => [key, tags.includes(key)])),
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id || !user?.uid) return

    const previousTripData = queryClient.getQueryData<Trip>(tripKeys.byId(id))
    const previousTags = previousTripData?.tags ?? []
    const tagsFromOtherGroups = previousTags.filter(
      (tag) => !formKeys.includes(tag)
    )
    const updatedTagsFromThisGroup = formKeys.filter(
      (key: string) => values[key as keyof typeof values]
    )
    const updatedTags = [...tagsFromOtherGroups, ...updatedTagsFromThisGroup]

    const newlyAddedTags = updatedTagsFromThisGroup.filter(
      (tag) => !previousTags.includes(tag)
    )

    try {
      await updateTripAsync({
        data: {
          tags: updatedTags,
        },
      })

      if (newlyAddedTags.length > 0) {
        const newActivityKeys = newlyAddedTags
          .map((label) => activityLabelToKey(label))
          .filter((key): key is keyof ActivityTypes => !!key)
        const newCustomTagNames = newlyAddedTags.filter(
          (label) => !activityLabelToKey(label)
        )

        if (newActivityKeys.length > 0 || newCustomTagNames.length > 0) {
          const result = await generatePackingList({
            tripId: id,
            activityKeys: newActivityKeys,
            userId: user.uid,
            customTagNames: newCustomTagNames,
          })
          if (result.length > 0) {
            toast.success(`Added ${result.length} items to your packing list`)
          }
        }
      }

      setOpen(false)
    } catch (error) {
      toast.error(`Error updating trip ${name} tags: ` + (error as Error).message)
      console.error(`Error updating trip ${name} tags:`, error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full">{children}</DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Update {name} tags</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <MultiSelect defaultValues={tags}>
                <MultiSelectTrigger className="w-full">
                  <MultiSelectValue
                    placeholder={`Select ${name}...`}
                    onDeselect={(item) => form.setValue(item, false, { shouldDirty: true })}
                  />
                </MultiSelectTrigger>
                <MultiSelectContent search={false}>
                  <MultiSelectGroup>
                    {options
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map((option) => (
                        <MultiSelectItem
                          key={option.label}
                          value={option.label}
                          onSelect={() => form.setValue(option.label, true, { shouldDirty: true })}
                        >
                          {option.label}
                        </MultiSelectItem>
                      ))}
                  </MultiSelectGroup>
                </MultiSelectContent>
              </MultiSelect>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!form.formState.isDirty}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
