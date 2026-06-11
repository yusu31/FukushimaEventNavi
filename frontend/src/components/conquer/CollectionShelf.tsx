'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import RegionItem3D from './RegionItem3D'
import CollectionItemModal from './CollectionItemModal'

type ConquestEntry = {
  id: number
  region_id: string
  conquered_at: string
}

type RegionDef = {
  id: string
  name: string
  ruby: string
  color: string
}

type Props = {
  regions: RegionDef[]
  conquests: ConquestEntry[]
}

const ITEM_LABELS: Record<string, string> = {
  kenpo: 'こけし',
  koriyama: '三春駒',
  sukagawa: 'ウルトラマン',
  kennan: '白河だるま',
  aizu: '赤べこ',
  okuaizu: 'クマ',
  minamiaizu: '手まり',
  soma: '馬',
  futaba: 'サッカーボール',
  iwaki: 'フラダンサー',
  all: '黄金トロフィー',
}

export default function CollectionShelf({ regions, conquests }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const allItems: RegionDef[] = [
    ...regions,
    { id: 'all', name: '全制覇', ruby: 'ぜんせいは', color: '#d4af37' },
  ]

  const conquestMap = new Map(conquests.map((c) => [c.region_id, c]))

  // 3段構成: 4 / 4 / 3
  const rows = [
    allItems.slice(0, 4),
    allItems.slice(4, 8),
    allItems.slice(8, 11),
  ]

  const selectedRegion = selectedId ? (allItems.find((r) => r.id === selectedId) ?? null) : null
  const selectedConquest = selectedId ? (conquestMap.get(selectedId) ?? null) : null

  return (
    <>
      <div
        className="rounded-3xl overflow-hidden w-full"
        style={{
          background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 55%, #24243e 100%)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          padding: '24px 32px 0 32px',
        }}
      >
        <p
          className="text-center mb-6"
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.55em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.22)',
          }}
        >
          Collection
        </p>

        {rows.map((row, rowIdx) => (
          <div key={rowIdx}>
            {/* アイテム列 */}
            <div className="flex justify-center gap-5 pb-5">
              {row.map((item) => {
                const conquest = conquestMap.get(item.id)
                const isConquered = !!conquest
                const isHovered = hoveredId === item.id

                return (
                  <div
                    key={item.id}
                    className="flex flex-col items-center gap-2"
                    style={{ cursor: isConquered ? 'pointer' : 'default' }}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => isConquered && setSelectedId(item.id)}
                  >
                    <div
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: 16,
                        overflow: 'hidden',
                        position: 'relative',
                        background: isConquered
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(255,255,255,0.02)',
                        border: isConquered
                          ? `1.5px solid ${item.color}45`
                          : '1.5px solid rgba(255,255,255,0.05)',
                        boxShadow:
                          isHovered && isConquered
                            ? `0 -8px 24px ${item.color}35, 0 0 0 1px ${item.color}25`
                            : isConquered
                              ? '0 4px 16px rgba(0,0,0,0.4)'
                              : 'none',
                        transform:
                          isHovered && isConquered ? 'translateY(-10px)' : 'translateY(0)',
                        transition:
                          'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
                      }}
                    >
                      {isConquered ? (
                        <RegionItem3D regionId={item.id} autoRotate={isHovered} />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <Lock size={18} style={{ color: 'rgba(255,255,255,0.11)' }} />
                          <span
                            style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.07)' }}
                          >
                            ?
                          </span>
                        </div>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        color: isConquered
                          ? 'rgba(255,255,255,0.58)'
                          : 'rgba(255,255,255,0.13)',
                      }}
                    >
                      {isConquered ? (ITEM_LABELS[item.id] ?? item.name) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* アクリル棚板 */}
            <div
              style={{
                height: 10,
                margin: '0 -32px',
                background:
                  'linear-gradient(to bottom, rgba(210,230,255,0.22) 0%, rgba(160,190,255,0.06) 100%)',
                borderTop: '1.5px solid rgba(255,255,255,0.38)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            />

            <div style={{ height: 16 }} />
          </div>
        ))}

        <p
          className="text-center pb-5"
          style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.18)' }}
        >
          {conquests.length} / 11 ACQUIRED
        </p>
      </div>

      {selectedId && selectedRegion && selectedConquest && (
        <CollectionItemModal
          region={selectedRegion}
          conquest={selectedConquest}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  )
}
