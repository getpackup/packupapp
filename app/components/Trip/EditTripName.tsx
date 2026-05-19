import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import z from 'zod'

import { Form, FormControl, FormField, FormItem, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { useUpdateTrip } from '~/services/trips'

import ResponsiveDialogContainer from '../ResponsiveDialogContainer'
import { Button } from '../ui/button'

export function EditTripName({
  tripName,
  children,
}: {
  tripName: string
  children: React.ReactNode
}) {
  const { id } = useParams()
  const [open, setOpen] = useState(false)
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

    try {
      await updateTripAsync({
        data: { name: values.name },
      })
      setOpen(false)
    } catch (error) {
      toast.error('Error updating trip name: ' + (error as Error).message)
      console.error('Error updating trip name:', error)
    }
  }

  return (
    <ResponsiveDialogContainer
      trigger={children}
      open={open}
      onOpenChange={setOpen}
      title="Update trip name"
      footerAction={
        <Button
          type="submit"
          disabled={!form.formState.isDirty}
          onClick={() => form.handleSubmit(onSubmit)()}
        >
          Save changes
        </Button>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full">
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
          </div>
        </form>
      </Form>
    </ResponsiveDialogContainer>
  )
}
