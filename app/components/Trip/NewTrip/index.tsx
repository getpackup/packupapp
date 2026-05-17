import { zodResolver } from '@hookform/resolvers/zod'
import { differenceInCalendarDays, endOfDay, startOfDay } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '~/components/ui/button'
import useAuth from '~/contexts/auth/useAuth'
import { activityKeyToLabel } from '~/lib/gearFilterUtils'
import { allGearListItems } from '~/lib/gearListItemEnum'
import { useCreateTrip, useGeneratePackingList } from '~/services/trips'
import { useIncrementTagCounts } from '~/services/users'
import type { ActivityTypes } from '~/types/GearItem'
import { TripMemberStatus } from '~/types/TripMember'
import type { User } from '~/types/User'

import { Form } from '../../ui/form'
import DatesStep from './DatesStep'
import HeaderImageStep from './HeaderImageStep'
import LocationStep from './LocationStep'
import MembersStep from './MembersStep'
import NameStep from './NameStep'
import TagsStep from './TagsStep'

type NewTripFormProps = {}

export const newTripFormSchema = z.object({
  startingPoint: z.string().min(3, { message: 'Location must be at least 3 characters' }),
  lat: z
    .number()
    .min(-90, { message: 'Latitude must be between -90 and 90' })
    .max(90, { message: 'Latitude must be between -90 and 90' }),
  lng: z
    .number()
    .min(-180, { message: 'Longitude must be between -180 and 180' })
    .max(180, { message: 'Longitude must be between -180 and 180' }),
  startDate: z.date({ error: 'Start date is required' }),
  endDate: z.date({ error: 'End date is required' }),
  memberSearchValue: z.string().optional(),
  name: z
    .string()
    .min(3, { message: 'Name must be at least 3 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  headerImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

const TOTAL_STEPS = 6

const STEPS_WITH_REQUIRED_FIELDS: Partial<
  Record<number, (keyof z.infer<typeof newTripFormSchema>)[]>
> = {
  0: ['startingPoint'],
  1: ['startDate', 'endDate'],
  3: ['name'],
}

const NewTripForm = ({}: NewTripFormProps) => {
  const { user } = useAuth()
  const [step, setStep] = useState<number>(0)
  const [tripMembers, setTripMembers] = useState<User[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const { mutateAsync: createTrip } = useCreateTrip()
  const { mutateAsync: generatePackingList } = useGeneratePackingList()
  const { mutate: incrementTagCounts } = useIncrementTagCounts(user?.uid ?? '')

  useEffect(() => {
    if (user) {
      setTripMembers([user])
    }
  }, [user])

  const form = useForm<z.infer<typeof newTripFormSchema>>({
    resolver: zodResolver(newTripFormSchema),
    defaultValues: {
      startingPoint: '',
      lat: 0,
      lng: 0,
      startDate: undefined,
      endDate: undefined,
      headerImage: undefined,
      tags: [],
    },
  })

  async function onSubmit(values: z.infer<typeof newTripFormSchema>) {
    if (!user?.uid || !values.startDate || !values.endDate) return

    setIsSubmitting(true)

    try {
      const startDate = Timestamp.fromDate(startOfDay(values.startDate))
      const endDate = Timestamp.fromDate(endOfDay(values.endDate))
      const tripLength = differenceInCalendarDays(values.endDate, values.startDate) + 1

      const allTags = values.tags ?? []
      const predefinedKeySet = new Set<string>(allGearListItems.map((i) => i.name))
      const activityKeys = allTags.filter((t): t is keyof ActivityTypes => predefinedKeySet.has(t))
      const customTagValues = allTags.filter((t) => !predefinedKeySet.has(t))
      const tagLabels = [
        ...activityKeys
          .map((key) => activityKeyToLabel(key))
          .filter((label): label is string => !!label),
        ...customTagValues,
      ]

      const tripMembersMap: Record<string, any> = {
        [user.uid]: {
          uid: user.uid,
          status: TripMemberStatus.Owner,
          invitedAt: Timestamp.now(),
        },
      }

      for (const member of tripMembers) {
        if (member.uid === user.uid) continue
        tripMembersMap[member.uid] = {
          uid: member.uid,
          status: TripMemberStatus.Pending,
          invitedAt: Timestamp.now(),
          invitedBy: user.uid,
        }
      }

      const trip = await createTrip({
        data: {
          name: values.name,
          description: '',
          startDate,
          endDate,
          startingPoint: values.startingPoint,
          lat: values.lat,
          lng: values.lng,
          headerImage: values.headerImage ?? '',
          owner: user.uid,
          tags: tagLabels,
          timezoneOffset: new Date().getTimezoneOffset(),
          tripLength,
          tripMembers: tripMembersMap,
        },
        tripMembers: tripMembersMap,
      })

      if (allTags.length > 0) {
        incrementTagCounts({ tags: allTags })
      }

      if (activityKeys.length > 0 || customTagValues.length > 0) {
        try {
          const result = await generatePackingList({
            tripId: trip.tripId,
            activityKeys,
            userId: user.uid,
            customTagNames: customTagValues,
          })
          if (result.length > 0) {
            toast.success(`Trip created with ${result.length} packing list items`)
          } else {
            toast.success('Trip created')
          }
        } catch (genErr) {
          console.error('Packing list generation failed:', genErr)
          toast.success(
            'Trip created (packing list generation failed — you can retry from the trip page)'
          )
        }
      } else {
        toast.success('Trip created')
      }

      navigate(`/trips/${trip.tripId}`)
    } catch {
      toast.error('Failed to create trip')
      setIsSubmitting(false)
    }
  }

  const isLastStep = step === TOTAL_STEPS - 1

  const handleNext = async () => {
    const fields = STEPS_WITH_REQUIRED_FIELDS[step]
    if (fields) {
      const valid = await form.trigger(fields)
      if (!valid) return
    }
    if (isLastStep) {
      form.handleSubmit(onSubmit)()
    } else {
      setStep(step + 1)
    }
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
                tripMembers={tripMembers}
                setTripMembers={setTripMembers}
              />
            )}
            {step === 3 && <NameStep key="name" form={form} />}
            {step === 4 && <HeaderImageStep key="headerImage" form={form} />}
            {step === 5 && <TagsStep key="tags" form={form} />}
          </AnimatePresence>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 0 || isSubmitting}
            >
              Previous
            </Button>
            <Button type="button" variant="accent" onClick={handleNext} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLastStep ? (isSubmitting ? 'Creating...' : 'Create trip') : 'Next'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default NewTripForm
