'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map as MapIcon, Trophy, ChevronRight, ChevronLeft, X, Pencil } from 'lucide-react'
import apiClient from '@/lib/axios'
import VisitRecordModal from '@/components/conquer/VisitRecordModal'
import FukushimaMap from '@/components/conquer/FukushimaMap'
import RegionConquestModal from '@/components/conquer/RegionConquestModal'
import AllConquestModal from '@/components/conquer/AllConquestModal'
import PendingConfirmationModal, { PendingConfirmation, PendingSource } from '@/components/conquer/PendingConfirmationModal'
import { useConquerCollection } from '@/hooks/useConquerCollection'

type VisitRecord = {
  id: number
  municipality: string
  companion_type: string
  photo_url: string | null
  visited_at: string
  memo: string | null
}

// 福島県10地区（案B：会津・相双・県中を分割）
const FUKUSHIMA_REGIONS = [
  {
    id: 'kenpo', name: '県北', ruby: 'けんぽく', color: '#5a9e7a',
    municipalities: ['福島市', '二本松市', '伊達市', '本宮市', '桑折町', '国見町', '川俣町', '大玉村'],
  },
  {
    id: 'koriyama', name: '郡山・田村', ruby: 'こおりやま・たむら', color: '#4a72a0',
    municipalities: ['郡山市', '田村市', '三春町', '小野町', '平田村'],
  },
  {
    id: 'sukagawa', name: '須賀川・石川', ruby: 'すかがわ・いしかわ', color: '#4a8898',
    municipalities: ['須賀川市', '鏡石町', '天栄村', '石川町', '玉川村', '浅川町', '古殿町'],
  },
  {
    id: 'kennan', name: '県南', ruby: 'けんなん', color: '#9e5a5a',
    municipalities: ['白河市', '西郷村', '泉崎村', '中島村', '矢吹町', '棚倉町', '矢祭町', '塙町', '鮫川村'],
  },
  {
    id: 'aizu', name: '会津', ruby: 'あいづ', color: '#9e7a3a',
    municipalities: ['会津若松市', '喜多方市', '北塩原村', '磐梯町', '猪苗代町', '会津坂下町', '湯川村', '会津美里町'],
  },
  {
    id: 'okuaizu', name: '奥会津', ruby: 'おくあいづ', color: '#7a5e25',
    municipalities: ['西会津町', '柳津町', '三島町', '金山町', '昭和村'],
  },
  {
    id: 'minamiaizu', name: '南会津', ruby: 'みなみあいづ', color: '#7a5a9e',
    municipalities: ['下郷町', '檜枝岐村', '只見町', '南会津町'],
  },
  {
    id: 'soma', name: '相馬', ruby: 'そうま', color: '#2e8a7e',
    municipalities: ['相馬市', '南相馬市', '新地町', '飯舘村'],
  },
  {
    id: 'futaba', name: '双葉', ruby: 'ふたば', color: '#2a6e8a',
    municipalities: ['広野町', '楢葉町', '富岡町', '川内村', '大熊町', '双葉町', '浪江町', '葛尾村'],
  },
  {
    id: 'iwaki', name: 'いわき', ruby: 'いわき', color: '#7a9e3a',
    municipalities: ['いわき市'],
  },
]

// ──────────────────────────────────────────────────
// フルスクリーン写真ライトボックス（Spotifyスタイルスライド）
// ──────────────────────────────────────────────────
function PhotoLightbox({
  photos,
  initialIndex,
  regionOf,
  onClose,
  onEdit,
}: {
  photos: VisitRecord[]
  initialIndex: number
  regionOf: (r: VisitRecord) => string
  onClose: () => void
  onEdit: (municipality: string) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [direction, setDirection] = useState(0)
  const currentIndexRef = useRef(initialIndex)
  const touchStartX = useRef<number | null>(null)

  const navigate = useCallback((newIdx: number) => {
    if (newIdx < 0 || newIdx >= photos.length) return
    const dir = newIdx > currentIndexRef.current ? 1 : -1
    setDirection(dir)
    setCurrentIndex(newIdx)
    currentIndexRef.current = newIdx
  }, [photos.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate(currentIndexRef.current - 1)
      if (e.key === 'ArrowRight') navigate(currentIndexRef.current + 1)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, onClose])

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '65%' : '-65%',
      opacity: 0,
      scale: 0.88,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-65%' : '65%',
      opacity: 0,
      scale: 0.88,
    }),
  }

  const record = photos[currentIndex]
  if (!record) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0a0a0a' }}
      onClick={onClose}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const delta = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(delta) > 50) {
          if (delta < 0) navigate(currentIndexRef.current + 1)
          else navigate(currentIndexRef.current - 1)
        }
        touchStartX.current = null
      }}
    >
      {/* 背景：アンビエントモード（写真の色が滲み出るエフェクト） */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={record.photo_url!}
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-125"
        style={{
          filter: 'blur(55px) saturate(1.8) brightness(0.55)',
          opacity: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 閉じるボタン */}
      <button
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-20"
        onClick={(e) => { e.stopPropagation(); onClose() }}
      >
        <X size={18} />
      </button>

      {/* ← 前へ */}
      {currentIndex > 0 && (
        <button
          className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-20"
          onClick={(e) => { e.stopPropagation(); navigate(currentIndex - 1) }}
        >
          <ChevronLeft size={22} />
        </button>
      )}

      {/* → 次へ */}
      {currentIndex < photos.length - 1 && (
        <button
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors z-20"
          onClick={(e) => { e.stopPropagation(); navigate(currentIndex + 1) }}
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* メインコンテンツ */}
      <div
        className="relative flex flex-col items-center gap-4 w-full z-10"
        style={{ maxWidth: '680px', padding: '0 64px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* スライドアニメーション写真 */}
        <div className="w-full overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                type: 'spring',
                stiffness: 310,
                damping: 28,
                mass: 0.85,
              }}
              className="flex justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={record.photo_url!}
                alt={record.municipality}
                style={{
                  maxWidth: '100%',
                  maxHeight: '62vh',
                  objectFit: 'contain',
                  borderRadius: 20,
                  display: 'block',
                  WebkitMaskImage: 'radial-gradient(ellipse 92% 88% at 50% 50%, black 60%, transparent 100%)',
                  maskImage: 'radial-gradient(ellipse 92% 88% at 50% 50%, black 60%, transparent 100%)',
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 情報バー */}
        <div className="flex items-center gap-2.5 text-white flex-wrap justify-center">
          <span className="text-[15px] font-bold">{record.municipality}</span>
          <span className="text-[12px] text-white/45">{regionOf(record)}</span>
          <span className="text-[12px] text-white/45">
            {new Date(record.visited_at).toLocaleDateString('ja-JP', {
              year: 'numeric', month: 'short', day: 'numeric',
            })}
          </span>
          <span className="text-[12px] text-white/45">{record.companion_type}</span>
          <button
            onClick={() => { onEdit(record.municipality); onClose() }}
            className="text-white/30 hover:text-white/80 transition-colors"
            title="編集"
          >
            <Pencil size={13} />
          </button>
        </div>

        {/* ページインジケーター */}
        <div className="flex items-center gap-1">
          {photos.length <= 12 ? (
            photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); navigate(i) }}
                style={{
                  width: i === currentIndex ? 20 : 5,
                  height: 5,
                  borderRadius: 9999,
                  background: i === currentIndex ? 'white' : 'rgba(255,255,255,0.22)',
                  transition: 'all 0.22s ease',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))
          ) : (
            <span className="text-[11px] text-white/30">
              {currentIndex + 1} / {photos.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────
// メインページ
// ──────────────────────────────────────────────────
export default function ConquerPage() {
  const [mounted, setMounted] = useState(false)
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([])
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)
  const [selectedMunicipality, setSelectedMunicipality] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [celebratingRegion, setCelebratingRegion] = useState<typeof FUKUSHIMA_REGIONS[number] | null>(null)
  const [showAllConquest, setShowAllConquest] = useState(false)
  const [pendingConfirmations, setPendingConfirmations] = useState<PendingConfirmation[]>([])
  const [activePending, setActivePending] = useState<PendingConfirmation | null>(null)
  const [pendingQueue, setPendingQueue] = useState<PendingSource[]>([])
  const [pendingMunicipalityForRecord, setPendingMunicipalityForRecord] = useState<string | null>(null)
  const [pendingEventId, setPendingEventId] = useState<number | null>(null)
  const prevCompletedRef = useRef<Record<string, boolean>>({})
  const prevAllConqueredRef = useRef(false)
  const { conquests, addConquest, hasConquered } = useConquerCollection()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const load = async () => {
      setIsLoadingRecords(true)
      try {
        const [recordsRes, pendingRes] = await Promise.all([
          apiClient.get<VisitRecord[]>('/api/v1/visit_records'),
          apiClient.get<PendingConfirmation[]>('/api/v1/conquer/pending_confirmations').catch(() => ({ data: [] })),
        ])
        setVisitRecords(recordsRes.data)
        setPendingConfirmations(pendingRes.data)
      } catch {
        // ロード失敗時は空のまま
      } finally {
        setIsLoadingRecords(false)
      }
    }
    load()
  }, [])

  const existingRecord = selectedMunicipality
    ? visitRecords.find((r) => r.municipality === selectedMunicipality) ?? null
    : null

  const handleSaved = (record: VisitRecord) => {
    setVisitRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = record; return next }
      return [...prev, record]
    })
    setSelectedMunicipality(null)
    setPendingEventId(null)
    // 記録済みになったら確認待ちリストから除去
    setPendingConfirmations(prev => prev.filter(p => p.municipality !== record.municipality))
    // キューに次の確認対象があれば順番に開く
    if (pendingQueue.length > 0 && pendingMunicipalityForRecord) {
      setPendingQueue(q => q.slice(1))
    } else {
      setPendingMunicipalityForRecord(null)
      setPendingQueue([])
    }
  }

  const handleDeleted = (id: number) => {
    setVisitRecords((prev) => prev.filter((r) => r.id !== id))
    setSelectedMunicipality(null)
  }

  const recordMap = useMemo(
    () => new globalThis.Map(visitRecords.map((r) => [r.municipality, r])),
    [visitRecords]
  )

  // ライトボックス用：写真ありの記録を古い順に並べた配列
  const allPhotos = useMemo(
    () =>
      visitRecords
        .filter((r) => r.photo_url)
        .sort((a, b) => new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime()),
    [visitRecords]
  )

  // DEV: 地区の全市町村を一括記録 → 直接お祝いモーダルを表示
  const handleDevFillRegion = useCallback(async (region: typeof FUKUSHIMA_REGIONS[number]) => {
    const unvisited = region.municipalities.filter((m) => !recordMap.has(m))
    if (unvisited.length > 0) {
      try {
        const results = await Promise.all(
          unvisited.map((m) =>
            apiClient.post<VisitRecord>('/api/v1/visit_records', {
              visit_record: { municipality: m, companion_type: '一人', visited_at: new Date().toISOString() },
            })
          )
        )
        setVisitRecords((prev) => [...prev, ...results.map((r) => r.data)])
      } catch {
        // dev ツールなのでエラーは無視
      }
    }
    // DEV: 制覇済みかどうかに関わらず直接モーダル表示
    setCelebratingRegion(region)
  }, [recordMap])

  // 確認待ちピン：市町村Setを生成
  const pendingMunicipalitiesSet = useMemo(
    () => new Set(pendingConfirmations.map((p) => p.municipality)),
    [pendingConfirmations]
  )

  // 確認待ちピンクリック → モーダルを開く
  const handlePendingClick = useCallback((name: string) => {
    const found = pendingConfirmations.find((p) => p.municipality === name)
    if (found) setActivePending(found)
  }, [pendingConfirmations])

  // 「記録する」押下 → キューに積んで訪問記録モーダルへ
  const handlePendingConfirmed = useCallback((municipality: string, checkedSources: PendingSource[]) => {
    setActivePending(null)
    setPendingMunicipalityForRecord(municipality)
    setPendingQueue(checkedSources.slice(1))
    // 最初のソースがイベントなら event_id を訪問記録に紐付けるために保持
    const first = checkedSources[0]
    setPendingEventId(first?.source_type === 'event' ? first.source_id : null)
    setSelectedMunicipality(municipality)
  }, [])

  // 「スキップ」→ 確認待ちリストから該当市町村を除去（次回アクセスで再表示）
  const handlePendingSkip = useCallback(() => {
    if (activePending) {
      setPendingConfirmations(prev => prev.filter(p => p.municipality !== activePending.municipality))
    }
    setActivePending(null)
  }, [activePending])

  const regionOf = useCallback((record: VisitRecord) => {
    for (const r of FUKUSHIMA_REGIONS) {
      if (r.municipalities.includes(record.municipality)) return r.name
    }
    return ''
  }, [])

  const openLightbox = useCallback(
    (record: VisitRecord) => {
      const idx = allPhotos.findIndex((r) => r.id === record.id)
      if (idx >= 0) setLightboxIndex(idx)
    },
    [allPhotos]
  )

  // 地区ごとの統計（訪問済みは古い順・空スロットは常に全件表示）
  const regionStats = useMemo(
    () =>
      FUKUSHIMA_REGIONS.map((region) => {
        const visited = region.municipalities
          .filter((m) => recordMap.has(m))
          .map((m) => recordMap.get(m)!)
          .sort((a, b) => new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime())
        const visitedCount = visited.length
        const totalCount = region.municipalities.length
        const emptyCount = totalCount - visitedCount
        return { ...region, visited, visitedCount, totalCount, emptyCount, completed: visitedCount === totalCount }
      }),
    [recordMap]
  )

  // 地区制覇を検知：ローディング完了後に false→true の変化を捕捉
  useEffect(() => {
    if (isLoadingRecords) return
    for (const region of regionStats) {
      const wasCompleted = prevCompletedRef.current[region.id] ?? false
      if (!wasCompleted && region.completed && !hasConquered(region.id)) {
        setCelebratingRegion(region)
        break
      }
    }
    prevCompletedRef.current = Object.fromEntries(regionStats.map((r) => [r.id, r.completed]))
  }, [regionStats, isLoadingRecords, hasConquered])

  // 全59市町村制覇を検知
  useEffect(() => {
    if (isLoadingRecords) return
    const allDone = regionStats.length > 0 && regionStats.every((r) => r.completed)
    if (!prevAllConqueredRef.current && allDone && !hasConquered('all')) {
      setShowAllConquest(true)
    }
    prevAllConqueredRef.current = allDone
  }, [regionStats, isLoadingRecords, hasConquered])

  const visitedCount = recordMap.size

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
      <div className="px-6 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
            <MapIcon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-app-text leading-tight">マップ制覇</h1>
            <p className="text-[12px] text-app-sub mt-0.5">
              {isLoadingRecords ? '読み込み中...' : `${visitedCount} / 59 市町村制覇`}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {conquests.length > 0 && (
              <a
                href="/conquer/collection"
                className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 hover:bg-amber-100 transition-colors"
              >
                <Trophy size={13} className="text-amber-500" />
                <span className="text-[12px] font-semibold text-amber-600">{conquests.length}/10</span>
              </a>
            )}
            {visitedCount > 0 && (
              <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
                <span className="text-[12px] font-semibold text-yellow-600">{visitedCount}市町村</span>
              </div>
            )}
          </div>
        </motion.div>
        <p className="text-[13px] text-app-sub mt-3 leading-relaxed">
          市町村をクリックして訪問を記録しよう。<br />
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-primary/80" />
            <span>訪問済み</span>
            <span className="inline-block w-3 h-3 rounded-sm bg-gray-200 ml-2" />
            <span>未訪問</span>
          </span>
        </p>
      </div>

      {/* SVGマップ */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden" style={{ height: '600px' }}>
          <FukushimaMap
            visitRecords={visitRecords}
            onMunicipalityClick={setSelectedMunicipality}
            pendingMunicipalities={pendingMunicipalitiesSet}
            onPendingClick={handlePendingClick}
          />
        </div>
      </div>

      {/* 地区別 記録 */}
      <div className="px-6 pb-10 space-y-5">
        <h2 className="text-[15px] font-bold text-app-text">記録</h2>

        {regionStats.map((region) => (
          <div key={region.id}>
            {/* 地区ヘッダー */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[11px] font-bold text-white px-2.5 py-0.5 rounded-full"
                style={{ background: region.color }}
              >
                {region.name}
              </span>
              <span className="text-[10px] text-app-sub">（{region.ruby}）</span>
              <div className="ml-auto flex items-center gap-2">
                {/* DEV: 地区一括制覇ボタン */}
                <button
                  onClick={() => handleDevFillRegion(region)}
                  disabled={region.completed}
                  title="DEV: この地区の全市町村を一括記録"
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded transition-opacity disabled:opacity-20"
                  style={{ background: '#1f1f1f', color: '#f59e0b', border: '1px dashed #555' }}
                >
                  ⚡DEV
                </button>
                {region.completed ? (
                  <span className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    <Trophy size={9} />全制覇！
                  </span>
                ) : (
                  <span className="text-[11px] text-app-sub">
                    <span className="font-bold" style={{ color: region.color }}>{region.visitedCount}</span>
                    <span className="text-gray-300 mx-0.5">/</span>
                    <span>{region.totalCount}</span>
                  </span>
                )}
              </div>
            </div>

            {/* スロットグリッド（6列固定） */}
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
              {/* 訪問済みスロット */}
              {region.visited.map((record) => (
                <button
                  key={record.id}
                  title={record.municipality}
                  className="rounded-xl overflow-hidden bg-white shadow-sm hover:scale-105 hover:shadow-md transition-all duration-200 focus:outline-none text-left"
                  onClick={() => record.photo_url ? openLightbox(record) : setSelectedMunicipality(record.municipality)}
                >
                  {/* 写真エリア */}
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100 flex items-center justify-center">
                    {record.photo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={record.photo_url}
                        alt={record.municipality}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `${region.color}18` }}
                      >
                        <span className="text-[16px]" style={{ color: `${region.color}70` }}>✓</span>
                      </div>
                    )}
                  </div>
                  {/* テキストバー */}
                  <div className="px-1 py-1 text-center">
                    <p className="text-[8px] font-bold text-gray-800 truncate leading-tight">
                      {record.municipality}
                    </p>
                    <p className="text-[7px] text-gray-400 leading-tight mt-px">
                      {new Date(record.visited_at).toLocaleDateString('ja-JP', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                      }).replace(/\//g, '.')}
                    </p>
                  </div>
                </button>
              ))}

              {/* 空スロット */}
              {Array.from({ length: region.emptyCount }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: `linear-gradient(145deg, ${region.color}12 0%, ${region.color}05 100%)`,
                    border: `1px solid ${region.color}20`,
                  }}
                >
                  {/* 写真エリア（空） */}
                  <div className="aspect-[4/3] relative">
                    <div
                      className="absolute inset-0"
                      style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${region.color}28` }} />
                    </div>
                  </div>
                  {/* テキストバー（高さ揃え用） */}
                  <div className="px-1 py-1" style={{ minHeight: '28px' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 訪問記録モーダル */}
      {selectedMunicipality && (
        <VisitRecordModal
          municipality={selectedMunicipality}
          existingRecord={existingRecord}
          eventId={pendingEventId}
          onClose={() => { setSelectedMunicipality(null); setPendingEventId(null) }}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}

      {/* フルスクリーン写真ライトボックス */}
      {lightboxIndex !== null && allPhotos.length > 0 && (
        <PhotoLightbox
          photos={allPhotos}
          initialIndex={lightboxIndex}
          regionOf={regionOf}
          onClose={() => setLightboxIndex(null)}
          onEdit={(municipality) => setSelectedMunicipality(municipality)}
        />
      )}

      {/* 地区制覇お祝いモーダル */}
      {celebratingRegion && (
        <RegionConquestModal
          region={celebratingRegion}
          alreadyConquered={hasConquered(celebratingRegion.id)}
          onAdd={() => addConquest(celebratingRegion.id)}
          onClose={() => setCelebratingRegion(null)}
        />
      )}

      {/* 確認待ちモーダル */}
      {activePending && (
        <PendingConfirmationModal
          confirmation={activePending}
          onConfirmed={handlePendingConfirmed}
          onSkip={handlePendingSkip}
          onClose={() => setActivePending(null)}
        />
      )}

      {/* 全59市町村制覇エンドロール */}
      {showAllConquest && (
        <AllConquestModal
          regions={FUKUSHIMA_REGIONS}
          onClose={() => {
            addConquest('all')
            setShowAllConquest(false)
          }}
        />
      )}
    </div>
  )
}

