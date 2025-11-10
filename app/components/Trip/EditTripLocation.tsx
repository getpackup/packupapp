import { zodResolver } from '@hookform/resolvers/zod'
import { PopoverClose } from '@radix-ui/react-popover'
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
import { useUpdateTrip } from '~/services/trips'

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
  const { id } = useParams()
  const { mutateAsync: updateTripAsync } = useUpdateTrip(String(id))

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

        autocompleteServiceRef.current =
          new g.maps.places.AutocomplAutocompleteSuggestioneteService()
        placesServiceRef.current = new g.maps.places.Places(containerForPlacesRef.current)
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

    try {
      await updateTripAsync({
        data: {
          lat: values.lat,
          lng: values.lng,
          startingPoint: values.name,
        },
      })
    } catch (error) {
      toast.error('Error updating trip location: ' + (error as Error).message)
      console.error('Error updating trip location:', error)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent>
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
