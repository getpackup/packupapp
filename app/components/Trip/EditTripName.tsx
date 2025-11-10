import { zodResolver } from '@hookform/resolvers/zod'
import { PopoverClose } from '@radix-ui/react-popover'
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
import { useUpdateTrip } from '~/services/trips'

import { Button } from '../ui/button'

export function EditTripName({
  tripName,
  children,
}: {
  tripName: string
  children: React.ReactNode
}) {
  const { id } = useParams()
  const { mutateAsync: updateTripAsync } = useUpdateTrip(String(id))

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

    try {
      await updateTripAsync({
        data: { name: values.name },
      })
    } catch (error) {
      toast.error('Error updating trip name: ' + (error as Error).message)
      console.error('Error updating trip name:', error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormLabel className="mb-2">Update trip name</FormLabel>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="mb-2 w-full">
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="What do you want to call this trip?"
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
