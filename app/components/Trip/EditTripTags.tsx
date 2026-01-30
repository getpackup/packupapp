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
import { tripKeys, useUpdateTrip } from '~/services/trips'
import type { GearListEnumType } from '~/types/GearItem'
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
  options: GearListEnumType
  children: React.ReactNode
}) {
  const { id } = useParams()
  const [open, setOpen] = useState(false)
  const { mutateAsync: updateTripAsync } = useUpdateTrip(String(id))
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
    if (!id) return

    const previousTripData = queryClient.getQueryData<Trip>(tripKeys.byId(id))
    const tagsFromOtherGroups = (previousTripData?.tags ?? []).filter(
      (tag) => !formKeys.includes(tag)
    )
    const updatedTagsFromThisGroup = formKeys.filter(
      (key: string) => values[key as keyof typeof values]
    )
    const updatedTags = [...tagsFromOtherGroups, ...updatedTagsFromThisGroup]

    try {
      await updateTripAsync({
        data: {
          tags: updatedTags,
        },
      })
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
