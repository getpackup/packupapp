import { zodResolver } from '@hookform/resolvers/zod'
import { Timestamp } from 'firebase/firestore'
import { Loader2, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
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
import { useCreateShoppingListItem } from '~/services/shoppingList'
import type { Trip } from '~/types/Trip'

import InputCharacterCount from '../InputCharacterCount'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

type AddShoppingListItemDialogProps = {
  trip: Trip
  onItemCreated?: (itemId: string) => void
}

const MAX_NAME_AND_NOTES_LENGTH = 100
const MAX_STORE_LENGTH = 30

function AddShoppingListItemDialog({ trip, onItemCreated }: AddShoppingListItemDialogProps) {
  const { user } = useAuth()

  const { mutateAsync: createShoppingListItemAsync, isPending } = useCreateShoppingListItem()

  const formSchema = z.object({
    itemName: z
      .string()
      .min(3, 'Item name must be at least 3 characters')
      .max(
        MAX_NAME_AND_NOTES_LENGTH,
        `Item name must be less than ${MAX_NAME_AND_NOTES_LENGTH} characters`
      ),
    store: z
      .string()
      .max(MAX_STORE_LENGTH, `Store must be less than ${MAX_STORE_LENGTH} characters`)
      .optional(),
    notes: z
      .string()
      .max(
        MAX_NAME_AND_NOTES_LENGTH,
        `Notes must be less than ${MAX_NAME_AND_NOTES_LENGTH} characters`
      )
      .optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: {
      itemName: '',
      store: '',
      notes: '',
    },
  })

  const watchedName = form.watch('itemName')
  const watchedStore = form.watch('store')
  const watchedNotes = form.watch('notes')

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !trip) return

    const result = await createShoppingListItemAsync({
      data: {
        actualPrice: null,
        created: Timestamp.now(),
        estimatedPrice: null,
        isPurchased: false,
        itemName: values.itemName,
        notes: values.notes ?? '',
        priority: 'no priority',
        purchasedAt: null,
        quantity: 1,
        sourcePackingListItemId: null,
        store: values.store ?? null,
        tripId: trip.tripId,
        updated: null,
        userId: user.uid,
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
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="flex items-center gap-2">Quick Add item</TooltipContent>
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
              <DialogTitle>Quick Add item</DialogTitle>
              <DialogDescription>
                Add a new item to the list for {trip.name}. You can edit it and add more details
                later, if needed.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Item name"
                        {...field}
                        maxLength={MAX_NAME_AND_NOTES_LENGTH}
                      />
                    </FormControl>
                    <FormMessage />
                    <InputCharacterCount
                      maxLength={MAX_NAME_AND_NOTES_LENGTH}
                      value={watchedName ?? ''}
                      dangerThreshold={20}
                      isDirty={Boolean(form.formState.dirtyFields.itemName)}
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="store"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="REI, MEC, Target, etc."
                        {...field}
                        maxLength={MAX_STORE_LENGTH}
                      />
                    </FormControl>
                    <FormMessage />
                    <InputCharacterCount
                      maxLength={MAX_STORE_LENGTH}
                      value={watchedStore ?? ''}
                      dangerThreshold={5}
                      isDirty={Boolean(form.formState.dirtyFields.store)}
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={MAX_NAME_AND_NOTES_LENGTH} />
                    </FormControl>
                    <FormMessage />
                    <InputCharacterCount
                      maxLength={MAX_NAME_AND_NOTES_LENGTH}
                      value={watchedNotes ?? ''}
                      dangerThreshold={20}
                      isDirty={Boolean(form.formState.dirtyFields.itemName)}
                    />
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
