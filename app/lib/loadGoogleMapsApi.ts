let googleMapsApiPromise: Promise<typeof window | null> | null = null

export function loadGoogleMapsApi(): Promise<typeof window | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)

  if (googleMapsApiPromise) return googleMapsApiPromise

  googleMapsApiPromise = new Promise((resolve, reject) => {
    // If already loaded
    if ((window as any).google && (window as any).google.maps) {
      resolve(window)
      return
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-script="true"]'
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(window))
      existing.addEventListener('error', (e) => reject(e))
      return
    }

    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is not set'))
      return
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.defer = true
    script.dataset.googleMapsScript = 'true'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`

    script.onload = () => resolve(window)
    script.onerror = (e) => reject(e)

    document.head.appendChild(script)
  })

  return googleMapsApiPromise
}
