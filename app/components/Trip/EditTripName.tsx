import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import z from 'zod'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { firebaseKeys, useUpdateDocument } from '~/services/api'
import type { Trip } from '~/types/Trip'

import { Button } from '../ui/button'

export function EditTripName({
  tripName,
  children,
}: {
  tripName: string
  children: React.ReactNode
}) {
  const { mutateAsync: updateDocument } = useUpdateDocument('trips')
  const { id } = useParams()
  const queryClient = useQueryClient()

  const formSchema = z.object({
    name: z
      .string()
      .min(5, { message: 'Trip name must be at least 5 characters' })
      .max(50, { message: 'Trip name must be less than 50 characters' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tripName,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id) return

    // mock esc keypress to close the popover
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    form.reset({ name: values.name })

    await queryClient.cancelQueries({ queryKey: firebaseKeys.doc('trips', id) })

    const previousTripData = queryClient.getQueryData<Trip>(firebaseKeys.doc('trips', id))
    queryClient.setQueryData(firebaseKeys.doc('trips', id), (old: Trip) => {
      if (!old) return old
      return {
        ...old,
        name: values.name,
      }
    })

    try {
      await updateDocument(
        { id: id, data: { ...previousTripData, name: values.name } },
        {
          onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: firebaseKeys.doc('trips', id) })

            toast.success(`Trip name successfully updated`)
            // trackEvent('Trip Name Updates Successfully', {
            //   tripId: id,
            //   ...previousTripData,
            //   name: values.name,
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
      toast.error('Error updating trip name: ' + (error as Error).message)
      console.error('Error updating trip name:', error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger className="w-full">{children}</PopoverTrigger>
      <PopoverContent className="w-96" forceMount={undefined}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormLabel className="mb-2">Update trip name</FormLabel>
            <div className="flex w-full items-center gap-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Update trip name"
                        onFocus={(e) => {
                          field.onBlur()
                          // Move cursor to the end instead of selecting all text
                          setTimeout(() => {
                            e.target.setSelectionRange(e.target.value.length, e.target.value.length)
                          }, 10)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={!form.formState.isDirty} className="mr-auto">
                Save changes
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  )
}
