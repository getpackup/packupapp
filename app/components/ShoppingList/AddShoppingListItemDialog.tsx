import { zodResolver } from '@hookform/resolvers/zod'
import { Timestamp } from 'firebase/firestore'
import { Loader2, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import z from 'zod'

import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import useAuth from '~/contexts/auth/useAuth'
import { useCreatePackingListItem } from '~/services/trips'

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

type AddShoppingListItemDialogProps = {
  tripName: string
  onItemCreated?: (itemId: string) => void
}

function AddShoppingListItemDialog({ tripName, onItemCreated }: AddShoppingListItemDialogProps) {
  const { id } = useParams()
  const { user } = useAuth()

  const { mutateAsync: createPackingListItem, isPending } = useCreatePackingListItem()

  const formSchema = z.object({
    name: z.string().min(3, 'Item name must be at least 3 characters'),
    saveToGearCloset: z.boolean(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      saveToGearCloset: true,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id) return

    //TODO: Add save to gear closet logic

    const result = await createPackingListItem({
      tripId: id,
      data: {
        created: Timestamp.now(),
        category: tripName,
        description: '',
        isEssential: false,
        isPacked: false,
        name: values.name,
        packedBy: [
          {
            uid: user?.uid ?? '',
            quantity: 1,
            isShared: false,
          },
        ],
        quantity: 1,
      },
    })

    if (result?.id && onItemCreated) {
      onItemCreated(result.id)
    }

    form.reset()
    // fake esc key press to close the dialog
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  }
  return (
    <Dialog onOpenChange={() => form.reset()}>
      <DialogTrigger asChild>
        <div onClick={(e) => e.stopPropagation()}>
          <Tooltip>
            <TooltipTrigger className="p-1 opacity-80 hover:opacity-100">
              <Plus className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">
              Add item to {tripName}
            </TooltipContent>
          </Tooltip>
        </div>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add item</DialogTitle>
              <DialogDescription>
                Create a new item and add it to the shopping list.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item name</FormLabel>
                    <FormControl>
                      <Input placeholder="Item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

export default AddShoppingListItemDialog
