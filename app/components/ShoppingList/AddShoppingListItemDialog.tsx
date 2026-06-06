import { zodResolver } from '@hookform/resolvers/zod'
import { Timestamp, where } from 'firebase/firestore'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

import ResponsiveDialogContainer from '~/components/ResponsiveDialogContainer'
import { Button } from '~/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import useAuth from '~/contexts/auth/useAuth'
import { isBeforeToday } from '~/lib/date'
import { useCreateShoppingListItem } from '~/services/shoppingList'
import { useTripsQuery } from '~/services/trips'
import type { Trip } from '~/types/Trip'
import { TripMemberStatus } from '~/types/TripMember'

import InputCharacterCount from '../InputCharacterCount'

type AddShoppingListItemDialogProps = {
  trip?: Trip
  onItemCreated?: (itemId: string) => void
  trigger?: React.ReactNode
}

const MAX_NAME_AND_NOTES_LENGTH = 100
const MAX_STORE_LENGTH = 30

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
  tripId: z.string().min(1, 'Please select a trip'),
})

function AddShoppingListItemDialog({ trip, onItemCreated, trigger }: AddShoppingListItemDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const formId = useId()
  const { mutateAsync: createShoppingListItemAsync, isPending } = useCreateShoppingListItem()

  const tripConstraints = useMemo(
    () =>
      user?.uid
        ? [
            where(`tripMembers.${user.uid}.status`, 'not-in', [
              TripMemberStatus.Declined,
              TripMemberStatus.Removed,
            ]),
          ]
        : [],
    [user?.uid]
  )

  const { data: trips } = useTripsQuery({
    constraints: tripConstraints,
    queryOptions: { enabled: !trip && !!user?.uid },
  })

  const sortedTrips = useMemo(() => {
    if (!trips) return []
    const upcoming = trips
      .filter((t) => !isBeforeToday(t.endDate.seconds * 1000))
      .sort((a, b) => (a.startDate?.seconds ?? 0) - (b.startDate?.seconds ?? 0))
    const past = trips
      .filter((t) => isBeforeToday(t.endDate.seconds * 1000))
      .sort((a, b) => (b.startDate?.seconds ?? 0) - (a.startDate?.seconds ?? 0))
    return [...upcoming, ...past]
  }, [trips])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    defaultValues: {
      itemName: '',
      store: '',
      notes: '',
      tripId: trip?.tripId ?? '',
    },
  })

  useEffect(() => {
    if (!trip && sortedTrips[0] && !form.getValues('tripId')) {
      form.setValue('tripId', sortedTrips[0].tripId)
    }
  }, [sortedTrips, trip, form])

  const watchedName = form.watch('itemName')
  const watchedStore = form.watch('store')
  const watchedNotes = form.watch('notes')

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      form.reset({
        itemName: '',
        store: '',
        notes: '',
        tripId: trip?.tripId ?? sortedTrips[0]?.tripId ?? '',
      })
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return

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
        tripId: values.tripId,
        updated: null,
        userId: user.uid,
      },
    })

    if (result?.id && onItemCreated) {
      onItemCreated(result.id)
    }

    handleOpenChange(false)
  }

  const defaultTrigger = (
    <div onClick={(e) => e.stopPropagation()}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Quick Add item</TooltipContent>
      </Tooltip>
    </div>
  )

  return (
    <ResponsiveDialogContainer
      title="Add item"
      description={
        trip
          ? `Add a new item for ${trip.name}. You can edit it and add more details later.`
          : 'Add a new item to your shopping list. You can edit it and add more details later.'
      }
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger ?? defaultTrigger}
      footerAction={
        <Button type="submit" form={formId} disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? 'Saving...' : 'Save'}
        </Button>
      }
    >
      <Form {...form}>
        <form
          id={formId}
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4"
          onKeyDown={(e) => e.stopPropagation()}
        >
          {!trip && (
            <FormField
              control={form.control}
              name="tripId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trip</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a trip" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedTrips.map((t) => (
                          <SelectItem key={t.tripId} value={t.tripId}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
                  isDirty={Boolean(form.formState.dirtyFields.notes)}
                />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </ResponsiveDialogContainer>
  )
}

export default AddShoppingListItemDialog
