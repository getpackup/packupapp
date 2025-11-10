import { PopoverClose } from '@radix-ui/react-popover'
import { endOfDay, startOfDay } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { useState } from 'react'
import { type DateRange } from 'react-day-picker'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { useUpdateTrip } from '~/services/trips'

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
  const { id } = useParams()
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDate.toDate(),
    to: endDate.toDate(),
  })
  const { mutateAsync: updateTripAsync } = useUpdateTrip(String(id))

  const startDateHasChanged = dateRange?.from !== startDate.toDate()
  const endDateHasChanged = dateRange?.to !== endDate.toDate()

  const onSubmit = async () => {
    if (!id) return

    // mock esc keypress to close the popover
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    const newDates = {
      startDate: Timestamp.fromDate(startOfDay(dateRange?.from ?? startDate.toDate())),
      endDate: Timestamp.fromDate(endOfDay(dateRange?.to ?? endDate.toDate())),
    }

    try {
      await updateTripAsync({
        data: { ...newDates },
      })
    } catch (error) {
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
