import { PopoverClose } from '@radix-ui/react-popover'
import { useQueryClient } from '@tanstack/react-query'
import { endOfDay, startOfDay } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { useState } from 'react'
import { type DateRange } from 'react-day-picker'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { firebaseKeys, useUpdateDocument } from '~/services/api'
import type { Trip } from '~/types/Trip'

import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { Label } from '../ui/label'

export function EditTripDates({
  children,
  startDate,
  endDate,
}: {
  children: React.ReactNode
  startDate: Timestamp
  endDate: Timestamp
}) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDate.toDate(),
    to: endDate.toDate(),
  })
  const { mutateAsync: updateDocument } = useUpdateDocument('trips')
  const { id } = useParams()
  const queryClient = useQueryClient()

  const startDateHasChanged = dateRange?.from !== startDate.toDate()
  const endDateHasChanged = dateRange?.to !== endDate.toDate()

  const onSubmit = async () => {
    if (!id) return

    // mock esc keypress to close the popover
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    await queryClient.cancelQueries({ queryKey: firebaseKeys.doc('trips', id) })

    const newDates = {
      startDate: Timestamp.fromDate(startOfDay(dateRange?.from ?? startDate.toDate())),
      endDate: Timestamp.fromDate(endOfDay(dateRange?.to ?? endDate.toDate())),
    }

    const previousTripData = queryClient.getQueryData<Trip>(firebaseKeys.doc('trips', id))
    queryClient.setQueryData<Trip>(firebaseKeys.doc('trips', id), (old: Trip | undefined) => {
      if (!old) return old
      return {
        ...old,
        ...newDates,
      }
    })

    try {
      await updateDocument(
        {
          id: id,
          data: { ...previousTripData, ...newDates },
        },
        {
          onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: firebaseKeys.doc('trips', id) })

            toast.success(`Trip dates successfully updated`)
            // trackEvent('Trip Date Updated Successfully', {
            //   tripId: id,
            //   ...previousTripData,
            //   ...newDates,
            // })
          },
          onError: (err: Error) => {
            // Rollback optimistic updates on error
            if (previousTripData) {
              queryClient.setQueryData(firebaseKeys.doc('trips', id), previousTripData)
            }
            // trackEvent(`Trip Dates Update Failure`, {
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
      toast.error('Error updating trip dates: ' + (error as Error).message)
      console.error('Error updating trip dates:', error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="">
        <Label className="mb-2">Update trip date</Label>

        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={setDateRange}
          captionLayout="dropdown"
          className="mx-auto mb-2"
        />
        <div className="flex justify-end gap-2">
          <PopoverClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </PopoverClose>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!startDateHasChanged && !endDateHasChanged}
          >
            Save changes
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
