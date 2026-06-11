'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { getBBox, getCentroid, coordsToPath } from '@/lib/fukushima-geo'

type MunicipalityFeature = {
  type: 'Feature'
  properties: {
    N03_004: string | null
    N03_007: string | null
  }
  geometry: {
    type: string
    coordinates: number[][][]
  }
}

type GeoData = {
  type: 'FeatureCollection'
  features: MunicipalityFeature[]
}

type VisitRecord = {
  id: number
  municipality: string
  companion_type: string
  photo_url: string | null
  visited_at: string
  memo: string | null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).replace(/\//g, '.')
}

type Props = {
  visitRecords: VisitRecord[]
  onMunicipalityClick: (name: string) => void
}

const VISITED_COLOR = '#5F8B8B'
const UNVISITED_COLOR = '#c5d8e8'
const HOVER_VISITED_COLOR = '#4a7070'
const HOVER_UNVISITED_COLOR = '#9ab8cc'

const W = 900
const H = 600
const POPUP_W = 200

export default function FukushimaMap({ visitRecords, onMunicipalityClick }: Props) {
  const [geoData, setGeoData] = useState<GeoData | null>(null)
  const [hoveredName, setHoveredName] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const visitedSet = useMemo(
    () => new Set(visitRecords.map((r) => r.municipality)),
    [visitRecords]
  )

  const photoMap = useMemo(
    () => new Map(visitRecords.filter((r) => r.photo_url).map((r) => [r.municipality, r.photo_url!])),
    [visitRecords]
  )

  useEffect(() => {
    fetch('/fukushima.geojson')
      .then((res) => res.json())
      .then((data: GeoData) => setGeoData(data))
  }, [])

  const getFill = useCallback((name: string, hovered: boolean): string => {
    if (photoMap.has(name)) return hovered ? 'rgba(74,112,112,0.3)' : 'transparent'
    if (visitedSet.has(name)) return hovered ? HOVER_VISITED_COLOR : VISITED_COLOR
    return hovered ? HOVER_UNVISITED_COLOR : UNVISITED_COLOR
  }, [visitedSet, photoMap])

  const popupStyle = useMemo(() => {
    if (!hoveredName) return {}
    const POPUP_H = 150
    let left = mousePos.x + 14
    let top = mousePos.y - POPUP_H / 2
    if (left + POPUP_W > W - 8) left = mousePos.x - POPUP_W - 14
    if (top < 8) top = 8
    return { left, top }
  }, [hoveredName, mousePos])

  if (!geoData) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: '600px', background: '#e8f0f5' }}>
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const hoveredPhoto = hoveredName ? photoMap.get(hoveredName) : undefined
  const hoveredRecord = hoveredName ? visitRecords.find((r) => r.municipality === hoveredName) : undefined

  return (
    <div
      style={{ width: '100%', height: '600px', background: '#e8f0f5', position: 'relative' }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <defs>
          {geoData.features.map((feature) => {
            const name = feature.properties.N03_004 ?? ''
            const code = feature.properties.N03_007 ?? name
            if (!photoMap.has(name)) return null
            const d = coordsToPath(feature.geometry.coordinates)
            return (
              <clipPath key={`clip-${code}`} id={`clip-${code}`}>
                <path d={d} />
              </clipPath>
            )
          })}
        </defs>

        {/* 市町村ベースパス */}
        {geoData.features.map((feature) => {
          const name = feature.properties.N03_004 ?? ''
          const code = feature.properties.N03_007 ?? name
          const d = coordsToPath(feature.geometry.coordinates)
          const isHovered = hoveredName === name
          return (
            <path
              key={code}
              d={d}
              fill={getFill(name, isHovered)}
              stroke="#ffffff"
              strokeWidth={1.2}
              strokeLinejoin="round"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredName(name)}
              onMouseLeave={() => setHoveredName(null)}
              onClick={() => name && onMunicipalityClick(name)}
            >
              <title>{visitedSet.has(name) ? `${name}（訪問済み）` : name}</title>
            </path>
          )
        })}

        {/* 写真クリップ画像（重心を中心に配置） */}
        {geoData.features.map((feature) => {
          const name = feature.properties.N03_004 ?? ''
          const code = feature.properties.N03_007 ?? name
          const photoUrl = photoMap.get(name)
          if (!photoUrl) return null
          const bbox = getBBox(feature.geometry.coordinates)
          const centroid = getCentroid(feature.geometry.coordinates)
          const bboxW = bbox.maxX - bbox.minX
          const bboxH = bbox.maxY - bbox.minY
          const displayW = Math.max(bboxW, bboxH * 1.333) * 1.2
          const displayH = displayW * 0.75
          const isHovered = hoveredName === name
          return (
            <image
              key={`img-${code}`}
              href={photoUrl}
              x={centroid.x - displayW / 2}
              y={centroid.y - displayH / 2}
              width={displayW}
              height={displayH}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#clip-${code})`}
              style={{
                pointerEvents: 'none',
                opacity: isHovered ? 0.6 : 0.92,
                transition: 'opacity 0.2s',
              }}
            />
          )
        })}

        {/* 写真あり市町村の白枠を上から重ねる */}
        {geoData.features.map((feature) => {
          const name = feature.properties.N03_004 ?? ''
          const code = feature.properties.N03_007 ?? name
          if (!photoMap.has(name)) return null
          const d = coordsToPath(feature.geometry.coordinates)
          return (
            <path
              key={`border-${code}`}
              d={d}
              fill="none"
              stroke="#ffffff"
              strokeWidth={1.2}
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />
          )
        })}
      </svg>

      {/* ホバーカード（写真あり） */}
      {hoveredName && hoveredPhoto && (
        <div
          style={{
            position: 'absolute',
            left: popupStyle.left,
            top: popupStyle.top,
            width: POPUP_W,
            background: 'white',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            pointerEvents: 'none',
            zIndex: 20,
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hoveredPhoto}
            alt={hoveredName}
            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '260px', objectFit: 'contain' }}
          />
          <div style={{ padding: '6px 10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1f2937', whiteSpace: 'nowrap' }}>{hoveredName}</span>
              <span style={{ fontSize: 10, color: '#5F8B8B', fontWeight: 600, whiteSpace: 'nowrap' }}>訪問済み ✓</span>
            </div>
            {hoveredRecord && (
              <span style={{ fontSize: 10, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {formatDate(hoveredRecord.visited_at)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ホバーバッジ（写真なし） */}
      {hoveredName && !hoveredPhoto && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.65)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {hoveredName}{visitedSet.has(hoveredName) ? ' ✓' : ''}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
