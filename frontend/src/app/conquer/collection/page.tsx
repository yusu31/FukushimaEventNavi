'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trophy, ArrowLeft, Zap, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import CollectionShelf from '@/components/conquer/CollectionShelf'
import { useConquerCollection } from '@/hooks/useConquerCollection'

const FUKUSHIMA_REGIONS = [
  { id: 'kenpo', name: '県北', ruby: 'けんぽく', color: '#5a9e7a' },
  { id: 'koriyama', name: '郡山・田村', ruby: 'こおりやま・たむら', color: '#4a72a0' },
  { id: 'sukagawa', name: '須賀川・石川', ruby: 'すかがわ・いしかわ', color: '#4a8898' },
  { id: 'kennan', name: '県南', ruby: 'けんなん', color: '#9e5a5a' },
  { id: 'aizu', name: '会津', ruby: 'あいづ', color: '#9e7a3a' },
  { id: 'okuaizu', name: '奥会津', ruby: 'おくあいづ', color: '#7a5e25' },
  { id: 'minamiaizu', name: '南会津', ruby: 'みなみあいづ', color: '#7a5a9e' },
  { id: 'soma', name: '相馬', ruby: 'そうま', color: '#2e8a7e' },
  { id: 'futaba', name: '双葉', ruby: 'ふたば', color: '#2a6e8a' },
  { id: 'iwaki', name: 'いわき', ruby: 'いわき', color: '#7a9e3a' },
]

const ALL_REGION_IDS = [...FUKUSHIMA_REGIONS.map((r) => r.id), 'all']

export default function CollectionPage() {
  const [mounted, setMounted] = useState(false)
  const [devBusy, setDevBusy] = useState(false)
  const { conquests, isLoading, addConquest } = useConquerCollection()

  useEffect(() => setMounted(true), [])

  // DEV: 全地区を一括制覇
  const handleFillAll = useCallback(async () => {
    setDevBusy(true)
    await Promise.all(ALL_REGION_IDS.map((id) => addConquest(id)))
    setDevBusy(false)
  }, [addConquest])

  // DEV: 全データをリセット
  const handleReset = useCallback(async () => {
    setDevBusy(true)
    await fetch('/api/v1/region_conquests/destroy_all', { method: 'DELETE' })
    window.location.reload()
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app-bg">
      {/* ヘッダー */}
      <div className="px-6 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Link
            href="/conquer"
            className="flex items-center gap-1 text-[12px] text-app-sub hover:text-app-text transition-colors mb-4"
          >
            <ArrowLeft size={13} />
            マップ制覇に戻る
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #d4af37, #b8960c)' }}
            >
              <Trophy size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-app-text leading-tight">コレクション</h1>
              <p className="text-[12px] text-app-sub mt-0.5">
                {isLoading ? '読み込み中...' : `${conquests.length} / 11 アイテム獲得`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* コレクション棚 */}
      <div className="px-6 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <CollectionShelf regions={FUKUSHIMA_REGIONS} conquests={conquests} />
          </motion.div>
        )}
      </div>

      {/* ── DEV TOOLS ─────────────────────────────────────── */}
      <div className="px-6 pb-12">
        <div
          className="rounded-2xl p-4"
          style={{
            background: 'repeating-linear-gradient(45deg, #1a1a1a 0px, #1a1a1a 8px, #222 8px, #222 16px)',
            border: '1.5px solid #444',
          }}
        >
          <p
            className="text-[9px] font-bold tracking-[0.4em] uppercase mb-3"
            style={{ color: '#f59e0b' }}
          >
            ⚙ Dev Tools — 本番前に削除
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleFillAll}
              disabled={devBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#16a34a', color: '#fff' }}
            >
              <Zap size={13} />
              全地区を一括制覇
            </button>
            <button
              onClick={handleReset}
              disabled={devBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: '#dc2626', color: '#fff' }}
            >
              <RotateCcw size={13} />
              全データをリセット
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
