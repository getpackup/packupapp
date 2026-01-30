import { MoveRight } from 'lucide-react'
import { useState } from 'react'
import { type DateRange } from 'react-day-picker'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { Calendar } from '~/components/ui/calendar'

import AnimatedContainer from '../../AnimatedContainer'
import { newTripFormSchema } from '.'

type DatesStepProps = {
  form: UseFormReturn<z.infer<typeof newTripFormSchema>>
}

const DatesStep = ({ form }: DatesStepProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: form.getValues('startDate'),
    to: form.getValues('endDate'),
  })

  const onSelect = (dateRange: DateRange | undefined) => {
    const from = dateRange?.from
    const to = dateRange?.to
    setDateRange({ from, to })
    form.setValue('startDate', from)
    form.setValue('endDate', to)
  }

  return (
    <AnimatedContainer key="location" animation="scaleAndFadeIn">
      <span className="text-muted-foreground flex items-center gap-2 text-sm tracking-wider">
        <MoveRight className="size-4" /> About your trip
      </span>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">When are you going?</h1>

        <Calendar
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={(dateRange) => onSelect(dateRange)}
          captionLayout="label"
          numberOfMonths={2}
          disabled={{ before: new Date() }}
        />
      </div>
    </AnimatedContainer>
  )
}

export default DatesStep
