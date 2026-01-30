import { endOfDay, startOfDay } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { useState } from 'react'
import { type DateRange } from 'react-day-picker'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { useUpdateTrip } from '~/services/trips'

import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'

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
  const [open, setOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startDate.toDate(),
    to: endDate.toDate(),
  })
  const { mutateAsync: updateTripAsync } = useUpdateTrip(String(id))

  const startDateHasChanged = dateRange?.from !== startDate.toDate()
  const endDateHasChanged = dateRange?.to !== endDate.toDate()

  const onSubmit = async () => {
    if (!id) return

    const newDates = {
      startDate: Timestamp.fromDate(startOfDay(dateRange?.from ?? startDate.toDate())),
      endDate: Timestamp.fromDate(endOfDay(dateRange?.to ?? endDate.toDate())),
    }

    try {
      await updateTripAsync({
        data: { ...newDates },
      })
      setOpen(false)
    } catch (error) {
      toast.error('Error updating trip dates: ' + (error as Error).message)
      console.error('Error updating trip dates:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="">
        <div className="flex flex-col">
          <DialogHeader className="">
            <DialogTitle>Update trip date</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              captionLayout="dropdown"
              className="mx-auto border-0 p-0"
            />
          </div>
          <DialogFooter className="">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!startDateHasChanged && !endDateHasChanged}
            >
              Save changes
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
