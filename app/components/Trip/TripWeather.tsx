import type { Timestamp } from 'firebase/firestore'
import { CalendarOff, CloudOff, Loader2 } from 'lucide-react'
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

  if (!data || (data.days.length === 0 && data.unavailableDays.length > 0)) {
    return (
      <>
        <div className="text-sidebar-foreground mt-2 flex shrink-0 items-center px-3 text-xs leading-relaxed">
          Weather
        </div>
        <div className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-sm">
          <CalendarOff className="h-4 w-4" />
          <span>Available within 16 days of trip</span>
        </div>
      </>
    )
  }

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return {
      weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }
  }

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
        {data.days.map((day) => {
          const WeatherIcon = getWeatherIcon(day.weatherCode)
          const description = getWeatherDescription(day.weatherCode)
          const { weekday, date } = formatDisplayDate(day.date)

          return (
            <Tooltip key={day.date}>
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
        })}
      </div>
      {data.unavailableDays.length > 0 && (
        <div className="text-muted-foreground px-3 text-xs">
          +{data.unavailableDays.length} day{data.unavailableDays.length > 1 ? 's' : ''} not yet
          available
        </div>
      )}
    </>
  )
}

export default TripWeather
