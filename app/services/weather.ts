import { useQuery } from '@tanstack/react-query'

import type { DailyWeather, WeatherQueryResult } from '~/types/Weather'

const weatherRootKey = ['weather'] as const

export const weatherKeys = {
  root: weatherRootKey,
  forecast: (lat: number, lng: number, startDate: string, endDate: string) =>
    [...weatherRootKey, 'forecast', lat, lng, startDate, endDate] as const,
}

type OpenMeteoForecastResponse = {
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
  }
}

function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getDaysBetween(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

async function fetchForecastWeather(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<DailyWeather[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min&start_date=${startDate}&end_date=${endDate}&timezone=auto`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch forecast weather')
  }

  const data: OpenMeteoForecastResponse = await response.json()

  return data.daily.time.map((date, index) => ({
    date,
    weatherCode: data.daily.weather_code[index],
    temperatureMax: data.daily.temperature_2m_max[index],
    temperatureMin: data.daily.temperature_2m_min[index],
  }))
}

async function fetchHistoricalWeather(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<DailyWeather[]> {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min&start_date=${startDate}&end_date=${endDate}&timezone=auto`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch historical weather')
  }

  const data: OpenMeteoForecastResponse = await response.json()

  return data.daily.time.map((date, index) => ({
    date,
    weatherCode: data.daily.weather_code[index],
    temperatureMax: data.daily.temperature_2m_max[index],
    temperatureMin: data.daily.temperature_2m_min[index],
  }))
}

export function useWeatherQuery({
  lat,
  lng,
  startDate,
  endDate,
  enabled = true,
}: {
  lat: number
  lng: number
  startDate: Date
  endDate: Date
  enabled?: boolean
}) {
  const startDateStr = formatDateToISO(startDate)
  const endDateStr = formatDateToISO(endDate)

  return useQuery<WeatherQueryResult, Error>({
    queryKey: weatherKeys.forecast(lat, lng, startDateStr, endDateStr),
    queryFn: async (): Promise<WeatherQueryResult> => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const maxForecastDate = addDays(today, 15) // 16 days including today (0-15)
      const historicalCutoffDate = addDays(today, -5) // 5-day delay for historical

      const tripStart = new Date(startDate)
      tripStart.setHours(0, 0, 0, 0)
      const tripEnd = new Date(endDate)
      tripEnd.setHours(0, 0, 0, 0)

      // Trip entirely in the future beyond forecast range
      if (tripStart > maxForecastDate) {
        const totalDays = getDaysBetween(tripStart, tripEnd) + 1
        const unavailableDays: string[] = []
        for (let i = 0; i < totalDays; i++) {
          unavailableDays.push(formatDateToISO(addDays(tripStart, i)))
        }
        return {
          days: [],
          source: 'forecast',
          unavailableDays,
        }
      }

      // Trip entirely in the past (historical data available)
      if (tripEnd < historicalCutoffDate) {
        const days = await fetchHistoricalWeather(lat, lng, startDateStr, endDateStr)
        return {
          days,
          source: 'historical',
          unavailableDays: [],
        }
      }

      // Trip entirely within forecast range
      if (tripStart >= today && tripEnd <= maxForecastDate) {
        const days = await fetchForecastWeather(lat, lng, startDateStr, endDateStr)
        return {
          days,
          source: 'forecast',
          unavailableDays: [],
        }
      }

      // Mixed: trip spans multiple date ranges
      const allDays: DailyWeather[] = []
      const unavailableDays: string[] = []

      // Fetch historical portion if applicable
      if (tripStart < historicalCutoffDate) {
        const historicalEnd =
          tripEnd < historicalCutoffDate ? tripEnd : addDays(historicalCutoffDate, -1)
        const historicalDays = await fetchHistoricalWeather(
          lat,
          lng,
          formatDateToISO(tripStart),
          formatDateToISO(historicalEnd)
        )
        allDays.push(...historicalDays)
      }

      // Gap between historical cutoff and today
      if (tripStart < today && tripEnd >= historicalCutoffDate) {
        const gapStart = tripStart < historicalCutoffDate ? historicalCutoffDate : tripStart
        const gapEnd = tripEnd < today ? tripEnd : addDays(today, -1)

        if (gapStart <= gapEnd) {
          const daysInGap = getDaysBetween(gapStart, gapEnd) + 1
          for (let i = 0; i < daysInGap; i++) {
            unavailableDays.push(formatDateToISO(addDays(gapStart, i)))
          }
        }
      }

      // Fetch forecast portion if applicable
      const forecastStart = tripStart > today ? tripStart : today
      const forecastEnd = tripEnd > maxForecastDate ? maxForecastDate : tripEnd

      if (forecastStart <= forecastEnd && forecastStart <= maxForecastDate) {
        const forecastDays = await fetchForecastWeather(
          lat,
          lng,
          formatDateToISO(forecastStart),
          formatDateToISO(forecastEnd)
        )
        allDays.push(...forecastDays)
      }

      // Days beyond forecast range
      if (tripEnd > maxForecastDate) {
        const beyondStart = addDays(maxForecastDate, 1)
        const daysCount = getDaysBetween(beyondStart, tripEnd) + 1
        for (let i = 0; i < daysCount; i++) {
          unavailableDays.push(formatDateToISO(addDays(beyondStart, i)))
        }
      }

      return {
        days: allDays,
        source: 'mixed',
        unavailableDays,
      }
    },
    enabled: enabled && !!lat && !!lng,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  })
}
