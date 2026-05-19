import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import z from 'zod'

import { Form, FormControl, FormField, FormItem, FormMessage } from '~/components/ui/form'
import { useUpdateTrip } from '~/services/trips'

import ResponsiveDialogContainer from '../ResponsiveDialogContainer'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

export function EditTripDescription({
  description,
  children,
}: {
  description: string
  children: React.ReactNode
}) {
  const { id } = useParams()
  const [open, setOpen] = useState(false)
  const { mutateAsync: updateTripAsync } = useUpdateTrip(String(id))

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

    try {
      await updateTripAsync({
        data: { description: values.description },
      })
      setOpen(false)
    } catch (error) {
      toast.error('Error updating trip description: ' + (error as Error).message)
      console.error('Error updating trip description:', error)
    }
  }

  return (
    <ResponsiveDialogContainer
      open={open}
      onOpenChange={setOpen}
      trigger={children}
      title="Update trip description"
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
              name="description"
              render={({ field }) => (
                <FormItem className="w-full">
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
          </div>
        </form>
      </Form>
    </ResponsiveDialogContainer>
  )
}
