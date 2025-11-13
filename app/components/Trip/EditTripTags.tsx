import { zodResolver } from '@hookform/resolvers/zod'
import { PopoverClose } from '@radix-ui/react-popover'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import z from 'zod'

import { Form, FormLabel } from '~/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { tripKeys, useUpdateTrip } from '~/services/trips'
import type { GearListEnum } from '~/types/GearItem'
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
  options: GearListEnum
  children: React.ReactNode
}) {
  const { id } = useParams()
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

    // mock esc keypress to close the popover
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    form.reset({ ...Object.fromEntries(formKeys.map((key) => [key, values[key]])) })

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
    } catch (error) {
      toast.error(`Error updating trip ${name} tags: ` + (error as Error).message)
      console.error(`Error updating trip ${name} tags:`, error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent>
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
