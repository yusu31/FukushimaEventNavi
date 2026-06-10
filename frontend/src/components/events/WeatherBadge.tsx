'use client'

import { useEffect, useState } from 'react'
import apiClient from '@/lib/axios'

type WeatherData = {
  icon: string
  description: string
  temp: number
}

type Props = {
  area: string
  startAt: string
  size?: 'sm' | 'md'
}

export default function WeatherBadge({ area, startAt, size = 'sm' }: Props) {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    const date = startAt.split('T')[0]
    apiClient
      .get<WeatherData | null>(`/api/v1/weather?area=${encodeURIComponent(area)}&date=${date}`)
      .then(res => setWeather(res.data))
      .catch(() => {})
  }, [area, startAt])

  if (!weather) return null

  const iconSize = size === 'sm' ? 20 : 28

  return (
    <div className="flex items-center gap-0.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
        alt={weather.description}
        width={iconSize}
        height={iconSize}
        className="shrink-0"
      />
      <span className={size === 'sm' ? 'text-[11px] text-app-sub font-medium' : 'text-[13px] text-app-sub font-medium'}>
        {weather.temp}°C
      </span>
    </div>
  )
}
