import { useState } from 'react'
import { type DateRange } from 'react-day-picker'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { Calendar } from '~/components/ui/calendar'

import AnimatedContainer from '../../AnimatedContainer'
import { newTripFormSchema } from './schema'

type DatesStepProps = {
  form: UseFormReturn<z.infer<typeof newTripFormSchema>>
}

const DatesStep = ({ form }: DatesStepProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: form.getValues('startDate'),
    to: form.getValues('endDate'),
  })
  const { errors } = form.formState

  const onSelect = (dateRange: DateRange | undefined) => {
    const from = dateRange?.from
    const to = dateRange?.to
    setDateRange({ from, to })
    if (typeof from === 'undefined' || typeof to === 'undefined') {
      return
    }
    form.setValue('startDate', from, { shouldValidate: !!errors.startDate })
    form.setValue('endDate', to, { shouldValidate: !!errors.endDate })
  }

  return (
    <AnimatedContainer key="location" animation="scaleAndFadeIn">
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
          className="w-full"
        />
        {(form.formState.errors.startDate || form.formState.errors.endDate) && (
          <p className="text-destructive text-sm">
            {form.formState.errors.startDate?.message ?? form.formState.errors.endDate?.message}
          </p>
        )}
      </div>
    </AnimatedContainer>
  )
}

export default DatesStep
