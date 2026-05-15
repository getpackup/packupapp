import { useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import { type PlacePrediction, useGooglePlaces } from '~/lib/useGooglePlaces'

import AnimatedContainer from '../../AnimatedContainer'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../ui/form'
import { Input } from '../../ui/input'
import { newTripFormSchema } from '.'

type LocationStepProps = {
  form: UseFormReturn<z.infer<typeof newTripFormSchema>>
}

const LocationStep = ({ form }: LocationStepProps) => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const { isPlacesReady, fetchAutocompleteSuggestions, fetchPlaceDetails, getLatLngFromPlace } =
    useGooglePlaces()
  const { errors } = form.formState

  // Debounced predictions
  const debouncedFetch = useRef<number | null>(null)
  const handleNameChange = (value: string) => {
    form.setValue('startingPoint', value, {
      shouldDirty: true,
      shouldValidate: !!errors.startingPoint,
    })

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

  const handlePickPrediction = async (prediction: PlacePrediction) => {
    // Fill startingPoint immediately
    form.setValue('startingPoint', prediction.description, { shouldDirty: true })
    if (!form.getValues('name')) {
      form.setValue('name', `Trip to ${prediction.description}`, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true,
      })
    }

    // Fetch place details to get lat/lng
    const placeDetails = await fetchPlaceDetails(prediction.place_id)
    const latLng = getLatLngFromPlace(placeDetails)

    if (latLng) {
      form.setValue('lat', latLng.lat, { shouldDirty: true })
      form.setValue('lng', latLng.lng, { shouldDirty: true })
    }
    setPredictions([])
  }

  return (
    <AnimatedContainer key="location" animation="scaleAndFadeIn">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Where are you headed?</h1>
        <FormField
          control={form.control}
          name="startingPoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Search for a location..."
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
            <ul className="max-h-50 divide-y overflow-y-auto rounded border">
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
      </div>
    </AnimatedContainer>
  )
}

export default LocationStep
