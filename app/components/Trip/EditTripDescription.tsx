import { zodResolver } from '@hookform/resolvers/zod'
import { PopoverClose } from '@radix-ui/react-popover'
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
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { firebaseKeys, useUpdateDocument } from '~/services/api'
import type { Trip } from '~/types/Trip'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

export function EditTripDescription({
  description,
  children,
}: {
  description: string
  children: React.ReactNode
}) {
  const { mutateAsync: updateDocument } = useUpdateDocument('trips')
  const { id } = useParams()
  const queryClient = useQueryClient()

  const formSchema = z.object({
    description: z
      .string()
      .max(500, { message: 'Trip description must be less than 500 characters' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: description || '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id) return

    // mock esc keypress to close the popover
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    form.reset({ description: values.description })

    await queryClient.cancelQueries({ queryKey: firebaseKeys.doc('trips', id) })

    const previousTripData = queryClient.getQueryData<Trip>(firebaseKeys.doc('trips', id))
    queryClient.setQueryData<Trip>(firebaseKeys.doc('trips', id), (old: Trip | undefined) => {
      if (!old) return old
      return {
        ...old,
        description: values.description,
      }
    })

    try {
      await updateDocument(
        {
          id: id,
          data: {
            ...previousTripData,
            description: values.description || '',
          },
        },
        {
          onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: firebaseKeys.doc('trips', id) })

            toast.success(`Trip description successfully updated`)
            // trackEvent('Trip Description Updated Successfully', {
            //   tripId: id,
            //   ...previousTripData,
            //   description: values.description,
            // })
          },
          onError: (err: Error) => {
            // Rollback optimistic updates on error
            if (previousTripData) {
              queryClient.setQueryData(firebaseKeys.doc('trips', id), previousTripData)
            }
            // trackEvent(`Trip Description Update Failure`, {
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
      toast.error('Error updating trip description: ' + (error as Error).message)
      console.error('Error updating trip description:', error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormLabel className="mb-2">Update trip description</FormLabel>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="mb-2 w-full">
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Describe your trip in a few words..."
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
