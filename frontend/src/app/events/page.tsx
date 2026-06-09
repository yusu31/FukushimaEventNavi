'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import apiClient from '@/lib/axios'
import EventCard from '@/components/events/EventCard'
import { Event } from '@/types/event'

// ─── フィルター用定数 ───────────────────────────────────────────────
const AREAS = [
  'すべての地域', '郡山市', '本宮市', 'いわき市',
  '福島市', '会津若松市', '南相馬市', '白河市', 'その他',
]
const CATEGORIES = [
  'すべて', 'テクノロジー', '音楽', 'スポーツ',
  '自然・アウトドア', '食・グルメ', '文化・伝統', 'ファミリー',
  '教育', '祭り・イベント', 'アート', 'その他',
]

// ─── スケルトンカード（Spotify・Vercel 方式）─────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.05)] animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="px-4 pt-3 pb-4 space-y-2.5">
        <div className="h-[22px] w-24 rounded-full bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3.5 w-36 rounded bg-gray-200 mt-1" />
      </div>
    </div>
  )
}

// ─── ピルボタン ────────────────────────────────────────────────────
type PillProps = {
  label: string
  active: boolean
  onClick: () => void
  layoutIdPrefix: string
}
function Pill({ label, active, onClick, layoutIdPrefix }: PillProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold
        transition-colors duration-150 outline-none whitespace-nowrap
        ${active
          ? 'text-white'
          : 'bg-white/60 border border-white/60 text-app-sub hover:text-app-text hover:bg-white/80'
        }
      `}
      whileTap={{ scale: 0.94 }}
    >
      {label}
      {active && (
        <motion.span
          layoutId={`${layoutIdPrefix}-active`}
          className="absolute inset-0 rounded-full bg-primary -z-10"
          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        />
      )}
    </motion.button>
  )
}

// ─── エッジスクロールフック ─────────────────────────────────────────
function useChipScroll() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number | null>(null)
  const [fading, setFading] = useState(true)

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setFading(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    const x = e.clientX - left
    const EDGE = 64
    const MAX = 5
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
    const speed = x > width - EDGE ? ((x - (width - EDGE)) / EDGE) * MAX
                : x < EDGE          ? -((EDGE - x) / EDGE) * MAX
                : 0
    if (speed !== 0) {
      const tick = () => { el.scrollLeft += speed; animRef.current = requestAnimationFrame(tick) }
      animRef.current = requestAnimationFrame(tick)
    }
  }

  const onMouseLeave = () => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
  }

  return { scrollRef, fading, onScroll, onMouseMove, onMouseLeave }
}

// ─── グリッドアニメーション設定 ────────────────────────────────────
// staggerChildren: 各カードを 0.05 秒ずつ時間差で出現させる
const gridVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.05 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

// ─── メインページ ─────────────────────────────────────────────────
export default function EventsPage() {
  const [events,    setEvents]    = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search,    setSearch]    = useState('')
  const [area,      setArea]      = useState('すべての地域')
  const [category,  setCategory]  = useState('すべて')

  const catChips  = useChipScroll()
  const areaChips = useChipScroll()

  useEffect(() => {
    apiClient.get('/api/v1/events')
      .then(res => setEvents(res.data))
      .finally(() => setIsLoading(false))
  }, [])

  // useMemo でフィルタリング（useEffect より効率的・シンプル）
  const filtered = useMemo(() => {
    let result = events
    if (area !== 'すべての地域') result = result.filter(e => e.area === area)
    if (category !== 'すべて')   result = result.filter(e => e.category === category)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q)
      )
    }
    return result
  }, [events, area, category, search])

  return (
    <div className="min-h-screen">

      {/* ─── フィルターバー ─── */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-40">
        {/* 検索バー（Spotify 方式：上部に常設） */}
        <div className="px-8 pt-3.5 pb-2">
          <div className="relative max-w-[480px]">
            {/* 検索アイコン */}
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-sub pointer-events-none"
              fill="none" stroke="currentColor" strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="イベント名・場所で検索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-app-bg border-[1.5px] border-app-border rounded-full text-[13px] text-app-text outline-none focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(95,139,139,0.12)] transition-all placeholder:text-app-sub"
            />
            {/* ✕ クリアボタン */}
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-app-sub hover:text-app-text transition-colors text-[16px] leading-none"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* カテゴリピル */}
        <div
          ref={catChips.scrollRef}
          onScroll={catChips.onScroll}
          onMouseMove={catChips.onMouseMove}
          onMouseLeave={catChips.onMouseLeave}
          className="overflow-x-auto scrollbar-hide pb-3"
          style={catChips.fading ? {
            maskImage: 'linear-gradient(to right, black 78%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 78%, transparent 100%)',
          } : undefined}
        >
          <div className="flex gap-2 w-max px-8 pr-16">
            {CATEGORIES.map(cat => (
              <Pill key={cat} label={cat} active={category === cat}
                onClick={() => setCategory(cat)} layoutIdPrefix="cat" />
            ))}
          </div>
        </div>

        {/* 地域ピル */}
        <div
          ref={areaChips.scrollRef}
          onScroll={areaChips.onScroll}
          onMouseMove={areaChips.onMouseMove}
          onMouseLeave={areaChips.onMouseLeave}
          className="overflow-x-auto scrollbar-hide pb-3.5"
          style={areaChips.fading ? {
            maskImage: 'linear-gradient(to right, black 78%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 78%, transparent 100%)',
          } : undefined}
        >
          <div className="flex gap-2 w-max px-8 pr-16">
            {AREAS.map(a => (
              <Pill key={a} label={a} active={area === a}
                onClick={() => setArea(a)} layoutIdPrefix="area" />
            ))}
          </div>
        </div>
      </div>

      {/* ─── メインコンテンツ ─── */}
      <main className="max-w-[1160px] mx-auto px-8 py-8 pb-28">
        {isLoading ? (
          // スケルトンローディング（10枚のシルエット）
          <div className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-x-[28px] gap-y-[24px] py-6">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            <p className="text-[13px] text-app-sub font-medium mb-2">
              {filtered.length}件のイベントが見つかりました
            </p>

            {filtered.length === 0 ? (
              <motion.div
                className="text-center py-24 text-app-sub"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-[40px] mb-3">🔍</div>
                <p className="text-[14px]">条件に合うイベントが見つかりませんでした</p>
              </motion.div>
            ) : (
              // staggerChildren でカードを時間差フェードイン
              // AnimatePresence でフィルター時の出入りをアニメーション
              // layout でフィルター後のカードが滑らかに再配置
              <motion.div
                key={`${area}-${category}-${search}`}
                className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-x-[28px] gap-y-[24px] py-6"
                variants={gridVariants}
                initial="hidden"
                animate="show"
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map(event => (
                    <motion.div
                      key={event.id}
                      variants={cardVariants}
                      layout
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                      className="h-full"
                    >
                      <EventCard event={event} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
