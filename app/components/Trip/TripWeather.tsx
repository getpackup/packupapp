import type { Timestamp } from 'firebase/firestore'
import { CloudOff, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import useAuth from '~/contexts/auth/useAuth'
import {
  formatTemperature,
  getDefaultTemperatureUnit,
  getWeatherDescription,
  getWeatherIcon,
} from '~/lib/weatherUtils'
import { useUpdateUser } from '~/services/users'
import { useWeatherQuery } from '~/services/weather'

import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'

type TripWeatherProps = {
  lat: number
  lng: number
  startDate: Timestamp
  endDate: Timestamp
}

const TripWeather = ({ lat, lng, startDate, endDate }: TripWeatherProps) => {
  const { user } = useAuth()
  const updateUser = useUpdateUser(user?.uid ?? '')

  const [temperatureUnit, setTemperatureUnit] = useState<'celsius' | 'fahrenheit'>(() => {
    if (user?.preferences?.temperatureUnit) {
      return user.preferences.temperatureUnit
    }
    return getDefaultTemperatureUnit()
  })

  useEffect(() => {
    if (user?.preferences?.temperatureUnit) {
      setTemperatureUnit(user.preferences.temperatureUnit)
    }
  }, [user?.preferences?.temperatureUnit])

  const startDateObj = new Date(startDate.seconds * 1000)
  const endDateObj = new Date(endDate.seconds * 1000)

  const { data, isLoading, isError } = useWeatherQuery({
    lat,
    lng,
    startDate: startDateObj,
    endDate: endDateObj,
  })

  const handleUnitChange = (value: string) => {
    if (!value) return
    const newUnit = value as 'celsius' | 'fahrenheit'
    setTemperatureUnit(newUnit)

    if (user?.uid) {
      updateUser.mutate({
        data: {
          preferences: {
            ...user?.preferences,
            temperatureUnit: newUnit,
          },
        },
      })
    }
  }

  const getHeadingText = () => {
    if (!data) return 'Weather'
    if (data.source === 'historical') return 'Historical Weather'
    if (data.source === 'mixed') return 'Mixed Weather'
    if (data.source === 'forecast') return 'Weather Forecast'
    return 'Weather'
  }

  if (isLoading) {
    return (
      <>
        <div className="text-sidebar-foreground mt-2 flex shrink-0 items-center px-3 text-xs leading-relaxed">
          Weather
        </div>
        <div className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </>
    )
  }

  if (isError) {
    return (
      <>
        <div className="text-sidebar-foreground mt-2 flex shrink-0 items-center px-3 text-xs leading-relaxed">
          Weather
        </div>
        <div className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-sm">
          <CloudOff className="h-4 w-4" />
          <span>Unable to load</span>
        </div>
      </>
    )
  }

  if (!data) return null

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return {
      weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }
  }

  const daysMap = new Map(data.days.map((d) => [d.date, d]))
  const tripStart = new Date(startDateObj)
  tripStart.setHours(0, 0, 0, 0)
  const tripEnd = new Date(endDateObj)
  tripEnd.setHours(0, 0, 0, 0)
  const allTripDates: string[] = []
  const cur = new Date(tripStart)
  while (cur <= tripEnd) {
    allTripDates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }

  if (allTripDates.length === 0) return null

  return (
    <>
      <div className="text-sidebar-foreground mt-2 mb-2 flex shrink-0 items-center justify-between px-3 text-xs leading-relaxed">
        <span>{getHeadingText()}</span>
        <ToggleGroup
          type="single"
          value={temperatureUnit}
          onValueChange={handleUnitChange}
          size="sm"
          variant="outline"
          className="h-6"
        >
          <ToggleGroupItem value="celsius" className="h-6 px-2 text-xs">
            °C
          </ToggleGroupItem>
          <ToggleGroupItem value="fahrenheit" className="h-6 px-2 text-xs">
            °F
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex gap-1 overflow-x-auto px-3 pb-2">
        {allTripDates.map((dateStr) => {
          const day = daysMap.get(dateStr)
          const { weekday, date } = formatDisplayDate(dateStr)

          if (day) {
            const WeatherIcon = getWeatherIcon(day.weatherCode)
            const description = getWeatherDescription(day.weatherCode)
            return (
              <Tooltip key={dateStr}>
                <TooltipTrigger asChild>
                  <div className="bg-card flex shrink-0 flex-col items-center rounded-lg border px-3 py-2">
                    <span className="text-xs font-medium">{weekday}</span>
                    <span className="text-muted-foreground text-xs">{date}</span>
                    <WeatherIcon className="text-muted-foreground my-2 h-8 w-8" />
                    <span className="text-sm font-medium">
                      {formatTemperature(day.temperatureMax, temperatureUnit)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatTemperature(day.temperatureMin, temperatureUnit)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{description}</TooltipContent>
              </Tooltip>
            )
          }

          const dateObj = new Date(dateStr + 'T00:00:00')
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const unavailableLabel =
            dateObj < today ? 'Recent weather not yet available' : 'Future weather not yet available'

          return (
            <div
              key={dateStr}
              className="bg-card text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed px-3 py-2 text-xs"
            >
              <span className="font-medium">{weekday}</span>
              <span className="">{date}</span>
              <span className="my-2 text-center">—</span>
              <span className="text-center">{unavailableLabel}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default TripWeather
