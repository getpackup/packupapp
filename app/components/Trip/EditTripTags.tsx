import { zodResolver } from '@hookform/resolvers/zod'
import { PopoverClose } from '@radix-ui/react-popover'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import z from 'zod'

import { Form, FormLabel } from '~/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { firebaseKeys, useUpdateDocument } from '~/services/api'
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
  const { mutateAsync: updateDocument } = useUpdateDocument('trips')
  const { id } = useParams()
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

    // mock esc keypress to close the popover
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    form.reset({ ...Object.fromEntries(formKeys.map((key) => [key, values[key]])) })

    await queryClient.cancelQueries({ queryKey: firebaseKeys.doc('trips', id) })

    const previousTripData = queryClient.getQueryData<Trip>(firebaseKeys.doc('trips', id))
    const tagsFromOtherGroups = (previousTripData?.tags ?? []).filter(
      (tag) => !formKeys.includes(tag)
    )
    const updatedTagsFromThisGroup = formKeys.filter(
      (key: string) => values[key as keyof typeof values]
    )
    const updatedTags = [...tagsFromOtherGroups, ...updatedTagsFromThisGroup]

    queryClient.setQueryData<Trip>(firebaseKeys.doc('trips', id), (old: Trip | undefined) => {
      if (!old) return old
      return {
        ...old,
        tags: updatedTags,
      }
    })

    try {
      await updateDocument(
        {
          id: id,
          data: {
            ...previousTripData,
            tags: updatedTags,
          },
        },
        {
          onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: firebaseKeys.doc('trips', id) })

            toast.success(`${name} tags successfully updated`)
            // trackEvent('Trip Name Updated Successfully', {
            //   tripId: id,
            //   ...previousTripData,
            //   tags: updatedTags,
            // })
          },
          onError: (err: Error) => {
            // Rollback optimistic updates on error
            if (previousTripData) {
              queryClient.setQueryData(firebaseKeys.doc('trips', id), previousTripData)
            }
            // trackEvent(`Trip Name Update Failure`, {
            // tripId: id,
            //   ...previousTripData,
            // error: err,
            // })
            toast.error(err.message)
          },
        }
      )
    } catch (error) {
      // Rollback optimistic updates on error
      if (previousTripData) {
        queryClient.setQueryData(firebaseKeys.doc('trips', id), previousTripData)
      }
      toast.error(`Error updating trip ${name} tags: ` + (error as Error).message)
      console.error(`Error updating trip ${name} tags:`, error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger className="w-full">{children}</PopoverTrigger>
      <PopoverContent className="PopoverContent">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormLabel className="mb-2">Update {name} tags</FormLabel>

            <MultiSelect defaultValues={tags}>
              <MultiSelectTrigger className="mb-2 w-full">
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
            <div className="flex justify-end gap-2">
              <PopoverClose asChild>
                <Button type="button" variant="outline" className="">
                  Cancel
                </Button>
              </PopoverClose>
              <Button type="submit" disabled={!form.formState.isDirty} className="">
                Save changes
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  )
}
