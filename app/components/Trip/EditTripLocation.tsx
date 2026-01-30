import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import z from 'zod'

import {
  Dialog,
  DialogClose,
  DialogContent,
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
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { type PlacePrediction, useGooglePlaces } from '~/lib/useGooglePlaces'
import { useUpdateTrip } from '~/services/trips'

import { Button } from '../ui/button'

export function EditTripLocation({
  lat,
  lng,
  startingPoint,
  children,
}: {
  lat: number
  lng: number
  startingPoint: string
  children: React.ReactNode
}) {
  const { id } = useParams()
  const [open, setOpen] = useState(false)
  const { mutateAsync: updateTripAsync } = useUpdateTrip(String(id))

  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const { isPlacesReady, fetchAutocompleteSuggestions, fetchPlaceDetails, getLatLngFromPlace } =
    useGooglePlaces()

  const formSchema = z.object({
    name: z.string(),
    lat: z
      .number()
      .min(-90, { message: 'Latitude must be between -90 and 90' })
      .max(90, { message: 'Latitude must be between -90 and 90' }),
    lng: z
      .number()
      .min(-180, { message: 'Longitude must be between -180 and 180' })
      .max(180, { message: 'Longitude must be between -180 and 180' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: startingPoint,
      lat: lat,
      lng: lng,
    },
  })

  // Debounced predictions
  const debouncedFetch = useRef<number | null>(null)
  const handleNameChange = (value: string) => {
    form.setValue('name', value, { shouldDirty: true })

    if (!isPlacesReady) {
      setPredictions([])
      return
    }

    if (debouncedFetch.current) window.clearTimeout(debouncedFetch.current)
    debouncedFetch.current = window.setTimeout(async () => {
      const results = await fetchAutocompleteSuggestions(value)
      setPredictions(results)
    }, 250)
  }

  const handlePickPrediction = async (prediction: any) => {
    // Fill name immediately
    form.setValue('name', prediction.description, { shouldDirty: true })

    // Fetch place details to get lat/lng
    const placeDetails = await fetchPlaceDetails(prediction.place_id)
    const latLng = getLatLngFromPlace(placeDetails)

    if (latLng) {
      form.setValue('lat', latLng.lat, { shouldDirty: true })
      form.setValue('lng', latLng.lng, { shouldDirty: true })
    }
    setPredictions([])
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id) return

    try {
      await updateTripAsync({
        data: {
          lat: values.lat,
          lng: values.lng,
          startingPoint: values.name,
        },
      })
      setOpen(false)
    } catch (error) {
      toast.error('Error updating trip location: ' + (error as Error).message)
      console.error('Error updating trip location:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Update trip location</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="mb-2 w-full">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter a location..."
                        onChange={(e) => handleNameChange(e.target.value)}
                        onFocus={(e) => {
                          field.onBlur()
                          setTimeout(() => {
                            e.target.setSelectionRange(e.target.value.length, e.target.value.length)
                          }, 10)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {predictions.length > 0 && (
                <ul className="max-h-[200px] divide-y overflow-y-auto rounded border">
                  {predictions.map((p) => (
                    <li
                      key={p.place_id}
                      role="button"
                      className="hover:bg-accent cursor-pointer p-2"
                      onClick={() => handlePickPrediction(p)}
                    >
                      <div className="text-sm font-medium">
                        {p.structured_formatting?.main_text || p.description}
                      </div>
                      {p.structured_formatting?.secondary_text && (
                        <div className="text-muted-foreground text-xs">
                          {p.structured_formatting.secondary_text}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!form.formState.isDirty}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
