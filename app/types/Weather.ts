export type DailyWeather = {
  date: string
  weatherCode: number
  temperatureMax: number
  temperatureMin: number
}

export type WeatherQueryResult = {
  days: DailyWeather[]
  source: 'forecast' | 'historical' | 'mixed'
  unavailableDays: string[]
}
