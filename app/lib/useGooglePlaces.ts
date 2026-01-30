import { useEffect, useRef, useState } from 'react'

import { loadGoogleMapsApi } from './loadGoogleMapsApi'

interface GoogleMapsApi {
  maps: {
    places: GooglePlacesLibrary
  }
}

interface GooglePlacesLibrary {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: { input: string }) => Promise<AutocompleteResponse>
  }
  Place: new (options: { id: string }) => PlaceInstance
}

interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[]
}

interface AutocompleteSuggestion {
  placePrediction?: {
    placeId?: string
    place?: {
      id: string
    }
    text?:
      | {
          text: string
        }
      | string
    structuredFormat?: StructuredFormatting
  }
  placeId?: string
  place?: {
    id: string
  }
  text?:
    | {
        text: string
      }
    | string
}

interface StructuredFormatting {
  mainText?: string
  main_text?: string
  secondaryText?: string
  secondary_text?: string
}

interface PlaceInstance {
  fetchFields: (options: { fields: string[] }) => Promise<PlaceDetails>
}

interface PlaceLocation {
  lat: () => number
  lng: () => number
}

export type PlacePrediction = {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export type PlaceDetails = {
  location?: PlaceLocation | { lat: number; lng: number }
  displayName?: string
  // Keep geometry for backwards compatibility if needed
  geometry?: {
    location: PlaceLocation | { lat: number; lng: number }
  }
  name?: string
}

// Helper function to wait for Places library to be available
function waitForPlaces(
  g: GoogleMapsApi | undefined | null,
  maxAttempts = 20,
  delay = 100
): Promise<GooglePlacesLibrary> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const checkPlaces = () => {
      attempts++
      const places = g?.maps?.places

      // Check for new recommended API classes
      if (places?.AutocompleteSuggestion && places?.Place) {
        resolve(places)
      } else if (attempts >= maxAttempts) {
        reject(new Error('Places library not available after waiting'))
      } else {
        setTimeout(checkPlaces, delay)
      }
    }
    checkPlaces()
  })
}

// Helper function to map the new API response format to the expected format
function mapSuggestionsToPredictions(suggestions: AutocompleteSuggestion[]): PlacePrediction[] {
  return suggestions.map((suggestion) => {
    // Extract place ID (might be in format "places/xxx" or just the ID)
    const placeId =
      suggestion.placePrediction?.placeId ||
      suggestion.placePrediction?.place?.id ||
      suggestion.placeId ||
      suggestion.place?.id ||
      ''

    // Keep the original format - don't strip the prefix as it might be needed
    // The new API seems to expect the full format "places/xxx"
    const cleanPlaceId = placeId

    // Extract text/description
    const text =
      (typeof suggestion.placePrediction?.text === 'object'
        ? suggestion.placePrediction.text.text
        : suggestion.placePrediction?.text) ||
      (typeof suggestion.text === 'object' ? suggestion.text.text : suggestion.text) ||
      ''

    // Extract structured formatting if available
    const structuredFormatting = suggestion.placePrediction?.structuredFormat || {}

    return {
      place_id: cleanPlaceId,
      description: text,
      structured_formatting: {
        main_text:
          structuredFormatting.mainText ||
          structuredFormatting.main_text ||
          text.split(',')[0] ||
          text,
        secondary_text:
          structuredFormatting.secondaryText ||
          structuredFormatting.secondary_text ||
          text.split(',').slice(1).join(',').trim() ||
          '',
      },
    }
  })
}

export function useGooglePlaces() {
  const [isPlacesReady, setIsPlacesReady] = useState(false)
  const placesApiRef = useRef<GooglePlacesLibrary | null>(null)

  // Load Google Maps API and initialize Places library
  useEffect(() => {
    let isMounted = true

    loadGoogleMapsApi()
      .then(async (win) => {
        if (!win || !isMounted) return
        const g = (win as Window & { google?: GoogleMapsApi }).google

        // Wait for Places library to be fully initialized
        try {
          const places = await waitForPlaces(g)
          if (!isMounted) return

          placesApiRef.current = places
          setIsPlacesReady(true)
        } catch (error) {
          console.error('Error waiting for Places library:', error)
          setIsPlacesReady(false)
        }
      })
      .catch(() => {
        console.error('Error loading Google Maps API')
        setIsPlacesReady(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch autocomplete suggestions
  const fetchAutocompleteSuggestions = async (input: string): Promise<PlacePrediction[]> => {
    if (!isPlacesReady || !placesApiRef.current || !input || input.trim().length < 2) {
      return []
    }

    const AutocompleteSuggestion = placesApiRef.current.AutocompleteSuggestion

    if (typeof AutocompleteSuggestion?.fetchAutocompleteSuggestions === 'function') {
      try {
        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: input.trim(),
        })

        if (response?.suggestions && Array.isArray(response.suggestions)) {
          return mapSuggestionsToPredictions(response.suggestions)
        }
        return []
      } catch (error) {
        console.error('Error fetching place predictions:', error)
        return []
      }
    } else {
      console.error('fetchAutocompleteSuggestions not found on AutocompleteSuggestion')
      return []
    }
  }

  // Fetch place details by place ID
  const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
    if (!isPlacesReady || !placesApiRef.current || !placeId) {
      return null
    }

    try {
      // Extract plain ID (without 'places/' prefix) - the new API requires plain ID for the 'id' field
      const plainId = placeId.replace(/^places\//, '')

      // Create Place instance and fetch details
      const place = new placesApiRef.current.Place({ id: plainId })
      const placeDetails = await place.fetchFields({ fields: ['location', 'displayName'] })

      // Check if we got an error response
      if (placeDetails && 'place' in placeDetails) {
        const wrappedPlace = (placeDetails as any).place
        if (wrappedPlace && (wrappedPlace.error || wrappedPlace.status)) {
          console.error('Place details error response:', wrappedPlace)
          return null
        }
      }

      return placeDetails
    } catch (error) {
      console.error('Error fetching place details:', error)
      return null
    }
  }

  // Helper to get lat/lng from place details
  const getLatLngFromPlace = (place: PlaceDetails | null): { lat: number; lng: number } | null => {
    if (!place) {
      return null
    }

    // Handle case where response is wrapped in a 'place' property
    const actualPlace = 'place' in place ? (place as any).place : place

    const location = actualPlace?.location
    if (!location) {
      return null
    }

    // Extract coordinates - location.lat and location.lng are functions
    try {
      const lat = typeof location.lat === 'function' ? location.lat() : location.lat
      const lng = typeof location.lng === 'function' ? location.lng() : location.lng

      if (typeof lat === 'number' && typeof lng === 'number') {
        return { lat, lng }
      }
    } catch (error) {
      console.error('Error extracting coordinates:', error)
    }

    return null
  }

  return {
    isPlacesReady,
    fetchAutocompleteSuggestions,
    fetchPlaceDetails,
    getLatLngFromPlace,
  }
}
