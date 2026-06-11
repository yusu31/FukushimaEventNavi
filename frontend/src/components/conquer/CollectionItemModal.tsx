'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import RegionItem3D from './RegionItem3D'

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
  region: RegionDef
  conquest: ConquestEntry
  onClose: () => void
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function CollectionItemModal({ region, conquest, onClose }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[400] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      >
        {/* 背景：風景写真 + ブラー */}
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/conquer/regions/${region.id === 'all' ? 'aizu' : region.id}.jpg`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(4px) brightness(0.52) saturate(1.3)' }}
          />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
        </div>

        {/* コンテンツ */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-5 max-w-xs w-full px-6"
          initial={{ y: 40, scale: 0.9, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 20, scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 地区バッジ */}
          <div
            className="px-4 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase"
            style={{
              background: `${region.color}20`,
              border: `1px solid ${region.color}55`,
              color: region.color,
              boxShadow: `0 0 16px ${region.color}20`,
            }}
          >
            {region.name}
          </div>

          {/* 3Dモデル */}
          <div
            style={{
              width: 260,
              height: 260,
              borderRadius: 28,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${region.color}35`,
              boxShadow: `0 0 80px ${region.color}20, 0 20px 50px rgba(0,0,0,0.6)`,
            }}
          >
            <RegionItem3D regionId={region.id} autoRotate={true} />
          </div>

          {/* アイテム情報 */}
          <div className="text-center space-y-1.5">
            <p
              className="text-[9px] font-bold tracking-[0.6em] uppercase"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Item Acquired
            </p>
            <h2
              className="text-3xl font-black text-white"
              style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
            >
              {ITEM_LABELS[region.id] ?? region.name}
            </h2>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {formatDate(conquest.conquered_at)} 制覇
            </p>
          </div>

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="mt-1 p-2.5 rounded-full transition-all active:scale-90 hover:scale-110"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <X size={16} className="text-white/50" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
