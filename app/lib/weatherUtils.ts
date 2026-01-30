import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  type LucideIcon,
  Sun,
} from 'lucide-react'

export function getWeatherIcon(weatherCode: number): LucideIcon {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs#weathervariables
  if (weatherCode === 0) return Sun // Clear sky
  if (weatherCode === 1) return Sun // Mainly clear
  if (weatherCode === 2) return CloudSun // Partly cloudy
  if (weatherCode === 3) return Cloud // Overcast
  if (weatherCode >= 45 && weatherCode <= 48) return CloudFog // Fog
  if (weatherCode >= 51 && weatherCode <= 55) return CloudDrizzle // Drizzle
  if (weatherCode >= 56 && weatherCode <= 57) return CloudDrizzle // Freezing drizzle
  if (weatherCode >= 61 && weatherCode <= 65) return CloudRain // Rain
  if (weatherCode >= 66 && weatherCode <= 67) return CloudRain // Freezing rain
  if (weatherCode >= 71 && weatherCode <= 77) return CloudSnow // Snow
  if (weatherCode >= 80 && weatherCode <= 82) return CloudRain // Rain showers
  if (weatherCode >= 85 && weatherCode <= 86) return CloudSnow // Snow showers
  if (weatherCode >= 95 && weatherCode <= 99) return CloudLightning // Thunderstorm

  return Cloud
}

export function getWeatherDescription(weatherCode: number): string {
  if (weatherCode === 0) return 'Clear'
  if (weatherCode === 1) return 'Mostly clear'
  if (weatherCode === 2) return 'Partly cloudy'
  if (weatherCode === 3) return 'Cloudy'
  if (weatherCode >= 45 && weatherCode <= 48) return 'Foggy'
  if (weatherCode >= 51 && weatherCode <= 55) return 'Drizzle'
  if (weatherCode >= 56 && weatherCode <= 57) return 'Freezing drizzle'
  if (weatherCode >= 61 && weatherCode <= 65) return 'Rain'
  if (weatherCode >= 66 && weatherCode <= 67) return 'Freezing rain'
  if (weatherCode >= 71 && weatherCode <= 77) return 'Snow'
  if (weatherCode >= 80 && weatherCode <= 82) return 'Showers'
  if (weatherCode >= 85 && weatherCode <= 86) return 'Snow showers'
  if (weatherCode >= 95 && weatherCode <= 99) return 'Thunderstorm'

  return 'Unknown'
}

export function formatTemperature(celsius: number, unit: 'celsius' | 'fahrenheit'): string {
  if (unit === 'fahrenheit') {
    return `${Math.round(celsius * 1.8 + 32)}°`
  }
  return `${Math.round(celsius)}°`
}

export function getDefaultTemperatureUnit(): 'celsius' | 'fahrenheit' {
  if (typeof navigator === 'undefined') return 'celsius'

  const locale = navigator.language || 'en-US'
  const fahrenheitLocales = ['en-US', 'en-BS', 'en-BZ', 'en-KY', 'en-PW', 'en-PR', 'en-GU']

  return fahrenheitLocales.some((loc) => locale.startsWith(loc.split('-')[0]) && locale === loc)
    ? 'fahrenheit'
    : 'celsius'
}
