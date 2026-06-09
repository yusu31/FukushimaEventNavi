'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import jaLocale from '@fullcalendar/core/locales/ja'
import { EventClickArg, EventHoveringArg, DatesSetArg } from '@fullcalendar/core'
import {
  ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock,
  Users, ArrowRight, CalendarPlus, Check, Sparkles, ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '@/lib/axios'
import { useAuth } from '@/contexts/AuthContext'
import { Event } from '@/types/event'

// ─── カテゴリ設定 ─────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'テクノロジー':    '#0ea5e9',
  '音楽':           '#f59e0b',
  'スポーツ':       '#22c55e',
  '自然・アウトドア': '#16a34a',
  '食・グルメ':     '#f97316',
  '文化・伝統':     '#8b5cf6',
  'ファミリー':     '#06b6d4',
  '教育':           '#3b82f6',
  '祭り・イベント': '#d97706',
  'アート':         '#ec4899',
  'その他':         '#6b7280',
}
const DEFAULT_COLOR = '#5f8b8b'

const CATEGORY_GRADIENTS: Record<string, string> = {
  'テクノロジー':    'from-[#0ea5e9] to-[#6366f1]',
  '音楽':           'from-[#f59e0b] to-[#ef4444]',
  'スポーツ':       'from-[#22c55e] to-[#0ea5e9]',
  '自然・アウトドア': 'from-[#16a34a] to-[#15803d]',
  '食・グルメ':     'from-[#f97316] to-[#dc2626]',
  '文化・伝統':     'from-[#8b5cf6] to-[#6d28d9]',
  'ファミリー':     'from-[#06b6d4] to-[#0ea5e9]',
  '教育':           'from-[#3b82f6] to-[#1d4ed8]',
  '祭り・イベント': 'from-[#f59e0b] to-[#d97706]',
  'アート':         'from-[#ec4899] to-[#a855f7]',
  'その他':         'from-[#6b7280] to-[#4b5563]',
}
const DEFAULT_GRADIENT = 'from-[#5f8b8b] to-[#4a7070]'

const ALL_CATEGORIES = ['すべて', ...Object.keys(CATEGORY_COLORS)]
const AREAS = ['すべてのエリア', '郡山市', '本宮市', 'いわき市', '福島市', '会津若松市', '南相馬市', '白河市', 'その他']

// ─── ユーモアメッセージ ───────────────────────────────────────────────
const POPUP_HINTS = [
  '行ってみたら意外と楽しいかも 🎉',
  '友達誘ってみては？ 👥',
  '福島の魅力、再発見するチャンス ✨',
  '空き時間にぴったりかも 😊',
  '行かないと後悔するやつかも 🤔',
  '今週末のネタになりそう 📸',
  '参加すると視野が広がるよね 🌱',
]

const EMPTY_MESSAGES = [
  'この期間は福島、静かです… 🍵 のんびりするのもアリかも',
  'イベントなし！これはむしろチャンス。自分だけの贅沢な時間を 🌿',
  'この期間は予定なし。積ん読消化のチャンスかも 📚',
  'イベントゼロ！道の駅めぐりとかどうです？🚗',
  '静かな期間… でも自然の中のお散歩もいいですよ 🍃',
]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    month: 'short', day: 'numeric', weekday: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

// ─── 型定義 ───────────────────────────────────────────────────────────
type ViewKey = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth'

const VIEW_OPTIONS: { key: ViewKey; label: string }[] = [
  { key: 'dayGridMonth', label: '月' },
  { key: 'timeGridWeek', label: '週' },
  { key: 'timeGridDay', label: '日' },
  { key: 'listMonth', label: '一覧' },
]

type PopupState = {
  id: string
  title: string
  category: string
  location?: string
  start_at: string
  end_at?: string
  capacity?: number
  image_url?: string
  hint: string
  x: number
  y: number
}

type CalendarEvent = {
  id: string
  title: string
  start: string
  end?: string
  backgroundColor: string
  borderColor: string
  textColor: string
  classNames?: string[]
  extendedProps: {
    category: string
    location?: string
    start_at: string
    end_at?: string
    capacity?: number
    image_url?: string
  }
}

const LOADING_MESSAGES = [
  'イベントを福島から召喚中... 🦅',
  '郡山・いわき・本宮を探索中... 🗺️',
  '今月の楽しい予定を集めています... 🌸',
]

// ─── メインコンポーネント ─────────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const calendarRef = useRef<FullCalendar>(null)
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [scheduledEventIds, setScheduledEventIds] = useState<Set<number>>(new Set())
  const [scheduleIdMap, setScheduleIdMap] = useState<Map<number, number>>(new Map())

  const [selectedCategory, setSelectedCategory] = useState('すべて')
  const [selectedArea, setSelectedArea] = useState('すべてのエリア')
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewKey>('dayGridMonth')
  const [currentTitle, setCurrentTitle] = useState('')
  const [viewRange, setViewRange] = useState<{ start: Date; end: Date } | null>(null)
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [weekSuggest, setWeekSuggest] = useState<Event | null>(null)
  const [emptyMsg] = useState(() => randomFrom(EMPTY_MESSAGES))
  const [loadingMsg] = useState(() => randomFrom(LOADING_MESSAGES))

  // ─── データ取得 ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [evRes, schRes] = await Promise.allSettled([
          apiClient.get('/api/v1/events'),
          isLoggedIn ? apiClient.get('/api/v1/schedules') : Promise.resolve({ data: [] }),
        ])
        const events: Event[] = evRes.status === 'fulfilled' ? evRes.value.data : []
        setAllEvents(events)
        if (schRes.status === 'fulfilled') {
          const sch = schRes.value.data as (Event & { schedule_id: number })[]
          setScheduledEventIds(new Set(sch.map(s => s.id)))
          setScheduleIdMap(new Map(sch.map(s => [s.id, s.schedule_id])))
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchAll()
  }, [isLoggedIn])

  // ─── カレンダーイベント構築 ──────────────────────────────────────
  const buildCalendarEvents = useCallback((
    events: Event[], category: string, area: string, scheduledIds: Set<number>,
  ): CalendarEvent[] => events
    .filter(ev => category === 'すべて' || ev.category === category)
    .filter(ev => area === 'すべてのエリア' || ev.area === area)
    .map(ev => {
      const isScheduled = scheduledIds.has(ev.id)
      return {
        id: String(ev.id),
        title: ev.title,
        start: ev.start_at,
        end: ev.end_at ?? undefined,
        backgroundColor: isScheduled ? DEFAULT_COLOR : (CATEGORY_COLORS[ev.category] ?? DEFAULT_COLOR),
        borderColor: isScheduled ? 'rgba(255,255,255,0.4)' : 'transparent',
        textColor: '#ffffff',
        classNames: isScheduled ? ['fc-event-scheduled'] : [],
        extendedProps: {
          category: ev.category,
          location: ev.location ?? undefined,
          start_at: ev.start_at,
          end_at: ev.end_at ?? undefined,
          capacity: ev.capacity ?? undefined,
          image_url: ev.image_url ?? undefined,
        },
      }
    }), [])

  useEffect(() => {
    setCalendarEvents(buildCalendarEvents(allEvents, selectedCategory, selectedArea, scheduledEventIds))
  }, [allEvents, selectedCategory, selectedArea, scheduledEventIds, buildCalendarEvents])

  // ─── 週サジェスト（今週の参加予定がゼロの場合） ──────────────────
  useEffect(() => {
    if (allEvents.length === 0) { setWeekSuggest(null); return }
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const thisWeekScheduled = allEvents.filter(ev => {
      const d = new Date(ev.start_at)
      return d >= weekStart && d < weekEnd && scheduledEventIds.has(ev.id)
    }).length

    if (thisWeekScheduled > 0) { setWeekSuggest(null); return }

    const candidates = allEvents.filter(ev => {
      const d = new Date(ev.start_at)
      return d >= weekStart && d < weekEnd && !scheduledEventIds.has(ev.id)
    })
    setWeekSuggest(candidates.length > 0 ? randomFrom(candidates) : null)
  }, [allEvents, scheduledEventIds])

  // ─── 今日のイベント ──────────────────────────────────────────────
  const todayEvents = allEvents.filter(ev => isSameDay(new Date(ev.start_at), new Date()))

  // ─── 表示中の期間のイベント件数 ─────────────────────────────────
  const visibleCount = viewRange
    ? calendarEvents.filter(ev => {
        const d = new Date(ev.start)
        return d >= viewRange.start && d < viewRange.end
      }).length
    : null

  // ─── ナビゲーション ─────────────────────────────────────────────
  const goNext = () => calendarRef.current?.getApi().next()
  const goPrev = () => calendarRef.current?.getApi().prev()
  const goToday = () => calendarRef.current?.getApi().today()
  const changeView = (view: ViewKey) => {
    calendarRef.current?.getApi().changeView(view)
    setCurrentView(view)
  }

  // ─── ポップアップ表示（ホバー・クリック共通） ─────────────────
  const openPopup = (el: Element, event: { id: string; title: string; extendedProps: CalendarEvent['extendedProps'] }) => {
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current)
    const rect = el.getBoundingClientRect()
    const w = 300
    const x = rect.right + 8 + w > window.innerWidth ? rect.left - w - 8 : rect.right + 8
    const y = Math.min(rect.top, window.innerHeight - 400)
    setPopup({
      id: event.id,
      title: event.title,
      category: event.extendedProps.category,
      location: event.extendedProps.location,
      start_at: event.extendedProps.start_at,
      end_at: event.extendedProps.end_at,
      capacity: event.extendedProps.capacity,
      image_url: event.extendedProps.image_url,
      hint: randomFrom(POPUP_HINTS),
      x, y,
    })
  }

  const handleEventClick = (arg: EventClickArg) => openPopup(arg.el, arg.event)
  const handleMouseEnter = (arg: EventHoveringArg) => openPopup(arg.el, arg.event)
  const handleMouseLeave = () => {
    popupTimerRef.current = setTimeout(() => setPopup(null), 150)
  }

  // ─── 参加予定に追加 / 解除 ──────────────────────────────────────
  const handleAddToSchedule = async (eventId: string) => {
    if (!isLoggedIn) {
      toast('ログインするとカレンダーに追加できます 📅', { icon: '🔐', style: { fontSize: '13px' } })
      return
    }
    const id = Number(eventId)
    const isAdded = scheduledEventIds.has(id)
    setAddingId(eventId)
    try {
      if (isAdded) {
        const scheduleId = scheduleIdMap.get(id)
        if (scheduleId) {
          await apiClient.delete(`/api/v1/schedules/${scheduleId}`)
          setScheduledEventIds(prev => { const s = new Set(prev); s.delete(id); return s })
          setScheduleIdMap(prev => { const m = new Map(prev); m.delete(id); return m })
          toast('参加予定を解除しました', { icon: '📤', style: { fontSize: '13px' } })
        }
      } else {
        const res = await apiClient.post('/api/v1/schedules', { event_id: id })
        setScheduledEventIds(prev => new Set(prev).add(id))
        setScheduleIdMap(prev => new Map(prev).set(id, res.data.id))
        toast('カレンダーに追加しました 🎉', { style: { fontSize: '13px', fontWeight: '600' } })
      }
    } catch {
      toast.error('操作に失敗しました')
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="p-6">

      {/* ─── 今日のイベントバナー ─────────────────────────────────── */}
      <AnimatePresence>
        {!isLoading && todayEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/25 flex items-center gap-3"
          >
            <span className="text-[20px] shrink-0">🎉</span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-primary">
                今日は{todayEvents.length}件のイベントがあります！
              </p>
              <p className="text-[11px] text-app-sub mt-0.5 truncate">
                {todayEvents[0].title}
                {todayEvents.length > 1 && `  他${todayEvents.length - 1}件`}
              </p>
            </div>
            <button
              onClick={() => router.push(`/events/${todayEvents[0].id}`)}
              className="shrink-0 text-[11px] font-semibold text-primary flex items-center gap-1 hover:underline"
            >
              見てみる <ArrowRight size={11} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ページヘッダー ──────────────────────────────────────── */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-app-text">カレンダー</h1>
          <p className="text-[13px] text-app-sub mt-0.5">
            イベントをカレンダーで確認・予定に追加できます
          </p>
        </div>

        {/* ビュー切替タブ */}
        <div className="flex items-center bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl p-1 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          {VIEW_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => changeView(key)}
              className={`
                px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150
                ${currentView === key
                  ? 'bg-primary text-white shadow-[0_2px_6px_rgba(95,139,139,0.35)]'
                  : 'text-app-sub hover:text-app-text'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── フィルター行 ────────────────────────────────────────── */}
      <div className="mb-4 flex flex-col gap-2">
        {/* エリアフィルター（ドロップダウン）+ カテゴリラベル */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-app-sub font-medium shrink-0">エリア</span>
          <div className="relative">
            <select
              value={selectedArea}
              onChange={e => setSelectedArea(e.target.value)}
              className="
                pl-3 pr-7 py-1.5 rounded-xl text-[12px] font-medium text-app-text
                bg-white/60 border border-white/60 backdrop-blur-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                appearance-none cursor-pointer
              "
            >
              {AREAS.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-app-sub pointer-events-none" />
          </div>
          <span className="text-[11px] text-app-sub font-medium shrink-0 ml-1">カテゴリ</span>
        </div>

        {/* カテゴリチップ */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold
                border transition-all duration-150 whitespace-nowrap
                ${selectedCategory === cat && cat === 'すべて'
                  ? 'bg-primary text-white border-primary shadow-[0_2px_6px_rgba(95,139,139,0.3)]'
                  : selectedCategory === cat
                  ? 'text-white border-transparent shadow-[0_2px_6px_rgba(0,0,0,0.15)]'
                  : 'bg-white/60 text-app-sub border-white/60 hover:text-app-text hover:bg-white/80'
                }
              `}
              style={
                selectedCategory === cat && cat !== 'すべて'
                  ? { backgroundColor: CATEGORY_COLORS[cat] ?? DEFAULT_COLOR, borderColor: 'transparent' }
                  : undefined
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── カレンダーカード ─────────────────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden">

        {/* カスタムナビゲーションバー */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-app-border/40 bg-white/40">
          <div className="flex items-center gap-1">
            <button onClick={goPrev} className="w-8 h-8 rounded-lg flex items-center justify-center text-app-sub hover:text-app-text hover:bg-white/70 transition-all">
              <ChevronLeft size={16} />
            </button>
            <button onClick={goNext} className="w-8 h-8 rounded-lg flex items-center justify-center text-app-sub hover:text-app-text hover:bg-white/70 transition-all">
              <ChevronRight size={16} />
            </button>
            <h2 className="text-[15px] font-bold text-app-text ml-2 min-w-[130px]">{currentTitle}</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* 件数表示 */}
            {visibleCount !== null && !isLoading && (
              <span className="text-[11px] text-app-sub">
                {visibleCount > 0 ? `${visibleCount}件` : 'なし'}
              </span>
            )}
            {/* 参加予定凡例 */}
            {isLoggedIn && scheduledEventIds.size > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-app-sub">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: DEFAULT_COLOR }} />
                参加予定 {scheduledEventIds.size}件
              </div>
            )}
            <button onClick={goToday} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-primary/40 text-primary hover:bg-primary/10 transition-colors">
              今日
            </button>
          </div>
        </div>

        {/* FullCalendar 本体 */}
        <div className="p-4 fc-custom">
          {isLoading ? (
            <div className="h-[560px] flex flex-col items-center justify-center gap-3">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <CalendarDays size={36} className="text-primary/40" />
              </motion.div>
              <p className="text-[13px] text-app-sub">{loadingMsg}</p>
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
              initialView="dayGridMonth"
              locale={jaLocale}
              events={calendarEvents}
              eventClick={handleEventClick}
              eventMouseEnter={handleMouseEnter}
              eventMouseLeave={handleMouseLeave}
              headerToolbar={false}
              datesSet={(arg: DatesSetArg) => {
                setCurrentTitle(arg.view.title)
                setCurrentView(arg.view.type as ViewKey)
                setViewRange({ start: arg.start, end: arg.end })
              }}
              displayEventTime={false}
              contentHeight={currentView === 'dayGridMonth' ? 'auto' : 600}
              dayMaxEvents={3}
              moreLinkText={(n) => `+${n}件`}
              nowIndicator={true}
              scrollTime="08:00:00"
              eventDisplay="block"
              slotMinTime="07:00:00"
              slotMaxTime="23:00:00"
              listDaySideFormat={false}
              noEventsText="この期間はイベントがありません"
            />
          )}
        </div>
      </div>

      {/* ─── カレンダー下サマリーエリア ──────────────────────────── */}
      {!isLoading && (
        <div className="mt-4 flex flex-col gap-3">

          {/* 週サジェスト（今週参加予定ゼロ＋週イベントあり） */}
          <AnimatePresence>
            {weekSuggest && currentView === 'dayGridMonth' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-xl px-4 py-3.5 flex items-start gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/12 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={15} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-app-text">今週まだ予定なし 🤔</p>
                  <p className="text-[11px] text-app-sub mt-0.5 mb-2">こんなイベントはどうですか？</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-app-text truncate">{weekSuggest.title}</p>
                      <p className="text-[11px] text-app-sub mt-0.5">{formatDate(weekSuggest.start_at)}</p>
                    </div>
                    <button
                      onClick={() => handleAddToSchedule(String(weekSuggest.id))}
                      disabled={addingId === String(weekSuggest.id)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors disabled:opacity-60"
                    >
                      <CalendarPlus size={11} />予定に追加
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 空の期間メッセージ */}
          {visibleCount === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-5 text-[13px] text-app-sub/60 italic bg-white/40 rounded-xl"
            >
              {emptyMsg}
            </motion.div>
          )}

          {/* 月次サマリー */}
          {visibleCount !== null && visibleCount > 0 && (
            <div className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-app-sub">この期間のイベント</p>
                <p className="text-[18px] font-bold text-app-text mt-0.5">{visibleCount}件</p>
              </div>
              {isLoggedIn && (
                <div className="text-right">
                  <p className="text-[11px] text-app-sub">参加予定</p>
                  <p className="text-[18px] font-bold text-primary mt-0.5">{scheduledEventIds.size}件</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── ホバー/クリックポップアップ ────────────────────────── */}
      <AnimatePresence>
        {popup && (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'fixed', left: popup.x, top: popup.y, zIndex: 9999, width: 300 }}
            onMouseEnter={() => { if (popupTimerRef.current) clearTimeout(popupTimerRef.current) }}
            onMouseLeave={() => setPopup(null)}
            className="bg-white rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.06)]"
          >
            {/* ─ 上5分の3: 画像エリア ─ */}
            <div className="relative w-full h-[172px] overflow-hidden">
              {popup.image_url ? (
                <Image src={popup.image_url} alt={popup.title} fill className="object-cover" />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_GRADIENTS[popup.category] ?? DEFAULT_GRADIENT} flex items-center justify-center`}>
                  <span className="text-white/15 text-[72px] font-black select-none">
                    {popup.category[0]}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span
                className="absolute bottom-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full text-white backdrop-blur-sm"
                style={{ backgroundColor: (CATEGORY_COLORS[popup.category] ?? DEFAULT_COLOR) + 'cc' }}
              >
                {popup.category}
              </span>
              {scheduledEventIds.has(Number(popup.id)) && (
                <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Check size={9} />予定済み
                </span>
              )}
              {/* 閉じる */}
              <button
                onClick={() => setPopup(null)}
                className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <span className="text-[10px] font-bold">✕</span>
              </button>
            </div>

            {/* ─ 下5分の2: 情報エリア ─ */}
            <div className="px-4 pt-3 pb-3.5">
              <h3 className="text-[13px] font-bold text-app-text leading-snug mb-2.5 line-clamp-2">
                {popup.title}
              </h3>
              <div className="flex flex-col gap-1.5 mb-3">
                <div className="flex items-center gap-2 text-[11px] text-app-sub">
                  <Clock size={11} className="shrink-0 text-primary/60" />
                  <span>{formatDate(popup.start_at)}</span>
                </div>
                {popup.location && (
                  <div className="flex items-center gap-2 text-[11px] text-app-sub">
                    <MapPin size={11} className="shrink-0 text-primary/60" />
                    <span className="line-clamp-1">{popup.location}</span>
                  </div>
                )}
                {popup.capacity && (
                  <div className="flex items-center gap-2 text-[11px] text-app-sub">
                    <Users size={11} className="shrink-0 text-primary/60" />
                    <span>定員 {popup.capacity}名</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-app-sub/50 italic leading-relaxed mb-3">{popup.hint}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToSchedule(popup.id)}
                  disabled={addingId === popup.id}
                  className={`
                    flex-1 flex items-center justify-center gap-1.5
                    py-2 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-60
                    ${scheduledEventIds.has(Number(popup.id))
                      ? 'bg-primary text-white'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                    }
                  `}
                >
                  {scheduledEventIds.has(Number(popup.id))
                    ? <><Check size={11} />予定済み</>
                    : <><CalendarPlus size={11} />予定に追加</>
                  }
                </button>
                <button
                  onClick={() => router.push(`/events/${popup.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold bg-gray-100 text-app-text hover:bg-gray-200 transition-colors"
                >
                  詳細へ <ArrowRight size={11} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
