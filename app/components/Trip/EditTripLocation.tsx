import { zodResolver } from '@hookform/resolvers/zod'
import { PopoverClose } from '@radix-ui/react-popover'
import { useQueryClient } from '@tanstack/react-query'
import { Timestamp } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { toast } from 'sonner'
import z from 'zod'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { loadGoogleMapsApi } from '~/lib/loadGoogleMapsApi'
import { firebaseKeys, useUpdateDocument } from '~/services/api'
import type { Trip } from '~/types/Trip'

import { Button } from '../ui/button'

{
  /* <Script id="googleMapsLoaded">{`window.googleMapsLoaded = function() {}`}</Script>
<Script
  strategy="lazyOnload"
  src={`https://maps.googleapis.com/maps/api/js?key=${process.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=googleMapsLoaded&loading=async`}
/> */
}

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
  const { mutateAsync: updateDocument } = useUpdateDocument('trips')
  const { id } = useParams()
  const queryClient = useQueryClient()

  const [predictions, setPredictions] = useState<any[]>([])
  const [isPlacesReady, setIsPlacesReady] = useState(false)
  const autocompleteServiceRef = useRef<any | null>(null)
  const placesServiceRef = useRef<any | null>(null)
  const containerForPlacesRef = useRef<HTMLDivElement | null>(null)

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

  // Load Google Maps API and initialize services
  useEffect(() => {
    let isMounted = true
    loadGoogleMapsApi()
      .then((win) => {
        if (!win || !isMounted) return
        const g = (win as any).google
        if (!g?.maps?.places) return

        // Create a hidden container for PlacesService
        if (!containerForPlacesRef.current) {
          const div = document.createElement('div')
          div.style.display = 'none'
          document.body.appendChild(div)
          containerForPlacesRef.current = div
        }

        autocompleteServiceRef.current = new g.maps.places.AutocompleteService()
        placesServiceRef.current = new g.maps.places.PlacesService(containerForPlacesRef.current)
        setIsPlacesReady(true)
      })
      .catch(() => {
        setIsPlacesReady(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Debounced predictions
  const debouncedFetch = useRef<number | null>(null)
  const handleNameChange = (value: string) => {
    form.setValue('name', value, { shouldDirty: true })

    if (!isPlacesReady || !autocompleteServiceRef.current) {
      setPredictions([])
      return
    }

    if (debouncedFetch.current) window.clearTimeout(debouncedFetch.current)
    debouncedFetch.current = window.setTimeout(() => {
      if (!value || value.trim().length < 2) {
        setPredictions([])
        return
      }
      autocompleteServiceRef.current.getPlacePredictions(
        { input: value },
        (res: any[], status: string) => {
          if (status !== 'OK' || !Array.isArray(res)) {
            setPredictions([])
            return
          }
          setPredictions(res)
        }
      )
    }, 250)
  }

  const handlePickPrediction = (prediction: any) => {
    // Fill name immediately
    form.setValue('name', prediction.description, { shouldDirty: true })

    if (!placesServiceRef.current) return
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['geometry', 'name'] },
      (place: any, status: string) => {
        if (status !== 'OK' || !place?.geometry?.location) return
        const latLng = place.geometry.location
        const newLat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat
        const newLng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng
        form.setValue('lat', newLat, { shouldDirty: true })
        form.setValue('lng', newLng, { shouldDirty: true })
        setPredictions([])
      }
    )
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id) return

    // mock esc keypress to close the popover
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    form.reset({ lat: values.lat, lng: values.lng, name: values.name })

    await queryClient.cancelQueries({ queryKey: firebaseKeys.doc('trips', id) })

    const previousTripData = queryClient.getQueryData<Trip>(firebaseKeys.doc('trips', id))
    queryClient.setQueryData<Trip>(firebaseKeys.doc('trips', id), (old: Trip | undefined) => {
      if (!old) return old
      return {
        ...old,
        lat: values.lat,
        lng: values.lng,
        startingPoint: values.name,
        updatedAt: Timestamp.fromDate(new Date()),
      }
    })

    try {
      await updateDocument(
        {
          id: id,
          data: {
            ...previousTripData,
            lat: values.lat,
            lng: values.lng,
            startingPoint: values.name,
            updatedAt: Timestamp.fromDate(new Date()),
          },
        },
        {
          onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: firebaseKeys.doc('trips', id) })

            toast.success(`Trip location successfully updated`)
            // trackEvent('Trip Location Updated Successfully', {
            //   tripId: id,
            //   ...previousTripData,
            //   lat: values.lat,
            //   lng: values.lng,
            //   startingPoint: values.name,
            //   updatedAt: Timestamp.fromDate(new Date()),
            // })
          },
          onError: (err: Error) => {
            // Rollback optimistic updates on error
            if (previousTripData) {
              queryClient.setQueryData(firebaseKeys.doc('trips', id), previousTripData)
            }
            // trackEvent(`Trip Location Update Failure`, {
            // tripId: id,
            //   ...previousTripData,
            //   lat: values.lat,
            //   lng: values.lng,
            //   startingPoint: values.name,
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
      toast.error('Error updating trip location: ' + (error as Error).message)
      console.error('Error updating trip location:', error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger className="w-full">{children}</PopoverTrigger>
      <PopoverContent className="PopoverContent">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormLabel className="mb-2">Update trip location</FormLabel>

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
            <div className="mb-2">
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
            <div className="flex justify-end gap-2">
              <PopoverClose asChild>
                <Button type="button" variant="outline" className="">
                  Cancel
                </Button>
              </PopoverClose>
              <Button type="submit" disabled={!form.formState.isDirty} className="">
                Save changes
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  )
}
