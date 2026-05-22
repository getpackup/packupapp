type StaticMapImageProps = {
  lat: number
  lng: number
  height: number | string
  width: number | string
  zoom: number
  label?: string
}

const STYLE_ID = 'getpackup/cknw0bimf0s1q18nxauvs45jj'
const TOKEN = import.meta.env['VITE_MAPBOX_API_KEY'] as string

const StaticMapImage = ({ lat, lng, width, height, zoom, label }: StaticMapImageProps) => {
  const overlay = label ? `pin-s+555555(${lng},${lat})/` : ''
  const src = `https://api.mapbox.com/styles/v1/${STYLE_ID}/static/${overlay}${lng},${lat},${zoom}/800x400@2x?access_token=${TOKEN}`

  return (
    <img
      src={src}
      alt={label ?? 'Map'}
      style={{ width, height }}
      className="object-cover"
      loading="lazy"
    />
  )
}

export default StaticMapImage
