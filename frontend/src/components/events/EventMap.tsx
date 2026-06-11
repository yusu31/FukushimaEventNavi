'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet がバンドル時に画像パスを解決できないバグの回避策
// CDN から直接アイコン画像を参照する
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type Props = {
  location: string
  title: string
}

async function nominatimSearch(query: string): Promise<[number, number] | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=jp`
  const res = await fetch(url, { headers: { 'Accept-Language': 'ja' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null
  return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
}

async function geocode(address: string): Promise<[number, number] | null> {
  // まず完全な住所で検索
  const result = await nominatimSearch(address)
  if (result) return result

  // 見つからなければ末尾の単語（部屋名・棟名など）を1つずつ取り除いてリトライ
  const parts = address.trim().split(/\s+/)
  while (parts.length > 1) {
    parts.pop()
    const fallback = await nominatimSearch(parts.join(' '))
    if (fallback) return fallback
  }
  return null
}

export default function EventMap({ location, title }: Props) {
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    geocode(location)
      .then(setCoords)
      .finally(() => setLoading(false))
  }, [location])

  if (loading) {
    return (
      <div className="h-[200px] w-full rounded-xl bg-gray-100 animate-pulse" />
    )
  }

  if (!coords) {
    return (
      <p className="text-[13px] text-app-sub py-2">
        「{location}」の地図を表示できませんでした
      </p>
    )
  }

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`

  return (
    <div className="flex flex-col gap-2">
      <MapContainer
        center={coords}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '200px', width: '100%', borderRadius: '12px', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={coords} eventHandlers={{ click: () => window.open(googleMapsUrl, '_blank') }}>
          <Popup>
            <div className="text-[13px]">
              <p className="font-semibold mb-1">{title}</p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Google マップで開く →
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:text-primary-dark transition-colors self-start"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Google マップで現在地からのルートを確認 →
      </a>
    </div>
  )
}
