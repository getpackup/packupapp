import { zodResolver } from '@hookform/resolvers/zod'
import { endOfDay, startOfDay } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '~/components/ui/button'
import type { User } from '~/types/User'

import { Form } from '../../ui/form'
import DatesStep from './DatesStep'
import HeaderImageStep from './HeaderImageStep'
import LocationStep from './LocationStep'
import MembersStep from './MembersStep'
import NameStep from './NameStep'

type NewTripFormProps = {}

export const newTripFormSchema = z.object({
  startingPoint: z.string(),
  lat: z
    .number()
    .min(-90, { message: 'Latitude must be between -90 and 90' })
    .max(90, { message: 'Latitude must be between -90 and 90' }),
  lng: z
    .number()
    .min(-180, { message: 'Longitude must be between -180 and 180' })
    .max(180, { message: 'Longitude must be between -180 and 180' }),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  memberSearchValue: z.string().optional(),
  name: z
    .string()
    .min(3, { message: 'Name must be at least 3 characters' })
    .max(50, { message: 'Name must be less than 50 characters' }),
  headerImage: z.string().optional(),
})

const NewTripForm = ({}: NewTripFormProps) => {
  const [step, setStep] = useState<number>(0)
  const [tripMembers, setTripMembers] = useState<User[]>([])

  const form = useForm<z.infer<typeof newTripFormSchema>>({
    resolver: zodResolver(newTripFormSchema),
    defaultValues: {
      startingPoint: '',
      lat: 0,
      lng: 0,
      startDate: undefined,
      endDate: undefined,
      headerImage: undefined,
    },
  })

  function onSubmit(values: z.infer<typeof newTripFormSchema>) {
    console.log(values)

    if (!values.startDate || !values.endDate) return
    const newDates = {
      startDate: Timestamp.fromDate(startOfDay(values.startDate)),
      endDate: Timestamp.fromDate(endOfDay(values.endDate)),
    }
    console.log(newDates)
  }
  return (
    <div className="flex flex-col items-center">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {step === 0 && <LocationStep key="location" form={form} />}
            {step === 1 && <DatesStep key="dates" form={form} />}
            {step === 2 && (
              <MembersStep
                key="members"
                form={form}
                setStep={setStep}
                tripMembers={tripMembers}
                setTripMembers={setTripMembers}
              />
            )}
            {step === 3 && <NameStep key="name" form={form} />}
            {step === 4 && <HeaderImageStep key="headerImage" form={form} />}
          </AnimatePresence>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="" onClick={() => setStep(step - 1)}>
              Previous
            </Button>
            <Button type="button" variant="accent" className="" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default NewTripForm
