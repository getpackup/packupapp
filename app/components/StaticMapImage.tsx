import 'mapbox-gl/dist/mapbox-gl.css'

import { MapPin } from 'lucide-react'
import { Map, Marker } from 'react-map-gl/mapbox'

type StaticMapImageProps = {
  lat: number
  lng: number
  height: number | string
  width: number | string
  zoom: number
  label?: string
}

const StaticMapImage = ({ lat, lng, width, height, zoom, label }: StaticMapImageProps) => {
  return (
    <Map
      latitude={lat}
      longitude={lng}
      style={{ width: width, height: height }}
      zoom={zoom}
      mapStyle="mapbox://styles/getpackup/cknw0bimf0s1q18nxauvs45jj"
      mapboxAccessToken={import.meta.env['VITE_MAPBOX_API_KEY']}
    >
      {label ? (
        <Marker latitude={lat} longitude={lng}>
          <MapPin />
        </Marker>
      ) : null}
    </Map>
  )
}

export default StaticMapImage
