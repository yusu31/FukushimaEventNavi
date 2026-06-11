'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import {
  Monitor, Music, Trophy, Leaf, Utensils, Landmark,
  Users, BookOpen, Sparkles, Palette, Tag,
  CalendarDays, MapPin, Globe, CalendarPlus, Heart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import apiClient from '@/lib/axios'
import { Event } from '@/types/event'
import WeatherBadge from '@/components/events/WeatherBadge'

// Leaflet は window オブジェクトを使うため SSR 非対応 → dynamic import で回避
const EventMap = dynamic(() => import('@/components/events/EventMap'), { ssr: false })

const CATEGORY_STYLES: Record<string, { bg: string; text: string; Icon: LucideIcon }> = {
  'テクノロジー':    { bg: 'bg-[#e5f3f1]', text: 'text-[#2a7a68]', Icon: Monitor },
  '音楽':           { bg: 'bg-[#f3ede5]', text: 'text-[#7a5a2a]', Icon: Music },
  'スポーツ':       { bg: 'bg-[#eaf3e5]', text: 'text-[#3a7a2a]', Icon: Trophy },
  '自然・アウトドア': { bg: 'bg-[#e8f3e8]', text: 'text-[#2a6a2a]', Icon: Leaf },
  '食・グルメ':     { bg: 'bg-[#f3e8e5]', text: 'text-[#7a3a2a]', Icon: Utensils },
  '文化・伝統':     { bg: 'bg-[#ede5f3]', text: 'text-[#5a2a7a]', Icon: Landmark },
  'ファミリー':     { bg: 'bg-[#e8f3f0]', text: 'text-[#2a6a50]', Icon: Users },
  '教育':           { bg: 'bg-[#e5eef3]', text: 'text-[#2a4a7a]', Icon: BookOpen },
  '祭り・イベント': { bg: 'bg-[#f3f0e5]', text: 'text-[#7a6a2a]', Icon: Sparkles },
  'アート':         { bg: 'bg-[#f0e5f3]', text: 'text-[#6a2a7a]', Icon: Palette },
  'その他':         { bg: 'bg-[#f0f0f0]', text: 'text-[#5a5a5a]', Icon: Tag },
}
const DEFAULT_STYLE = { bg: 'bg-primary-light', text: 'text-primary-dark', Icon: Tag }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function EventDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    apiClient.get(`/api/v1/events/${id}`)
      .then(res => setEvent(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="bg-app-bg min-h-screen flex items-center justify-center text-app-sub">
        読み込み中...
      </div>
    )
  }

  if (notFound || !event) {
    return (
      <div className="bg-app-bg min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-app-sub">イベントが見つかりませんでした</p>
        <button onClick={() => router.back()} className="text-primary underline text-sm">
          一覧に戻る
        </button>
      </div>
    )
  }

  const style = CATEGORY_STYLES[event.category] ?? DEFAULT_STYLE

  return (
    <div className="bg-app-bg min-h-screen">
      <motion.div
        className="max-w-[720px] mx-auto px-4 py-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <button
          onClick={() => router.back()}
          className="text-[13px] text-app-sub hover:text-primary mb-6 flex items-center gap-1 transition-colors"
        >
          ← 一覧に戻る
        </button>

        <div className="bg-app-surface rounded-[18px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          {/* ヘッダー画像 */}
          {event.image_url ? (
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={event.image_url}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-[#cde0de] to-[#b4cece] flex items-center justify-center">
              <style.Icon size={80} className="text-white/80 drop-shadow-lg" />
            </div>
          )}

          <div className="p-7">
            {/* カテゴリタグ + アクションボタン（右上） */}
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                <style.Icon size={12} />
                {event.category}
              </span>
              <div className="flex gap-2">
                <button className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-[12px] font-semibold px-3.5 py-1.5 rounded-[8px] transition-colors">
                  <CalendarPlus size={13} />
                  参加予定
                </button>
                <button className="inline-flex items-center gap-1.5 text-primary border-[1.5px] border-primary hover:bg-primary-light text-[12px] font-semibold px-3.5 py-1.5 rounded-[8px] transition-colors">
                  <Heart size={13} />
                  お気に入り
                </button>
              </div>
            </div>

            {/* タイトル */}
            <h1 className="text-[22px] font-bold text-app-text leading-snug mb-5">
              {event.title}
            </h1>

            {/* メタ情報 */}
            <div className="flex flex-col gap-3 pb-5 border-b border-app-border mb-5">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 text-[14px] text-app-sub min-w-0">
                  <CalendarDays size={16} className="shrink-0 mt-0.5" />
                  <span>{formatDate(event.start_at)}{event.end_at && ` 〜 ${formatDate(event.end_at)}`}</span>
                </div>
                <WeatherBadge area={event.area} startAt={event.start_at} size="md" />
              </div>
              {event.location && (
                <div className="flex items-start gap-2.5 text-[14px] text-app-sub">
                  <MapPin size={16} className="shrink-0 mt-0.5" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.capacity && (
                <div className="flex items-start gap-2.5 text-[14px] text-app-sub">
                  <Users size={16} className="shrink-0 mt-0.5" />
                  <span>定員 {event.capacity}名</span>
                </div>
              )}
              {event.event_url && (
                <div className="flex items-start gap-2.5 text-[14px]">
                  <Globe size={16} className="shrink-0 mt-0.5 text-app-sub" />
                  <a
                    href={event.event_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary-dark"
                  >
                    外部サイトでイベント詳細を見る →
                  </a>
                </div>
              )}
            </div>

            {/* 説明文 */}
            {event.description && (
              <p className="text-[14px] leading-[1.85] text-app-text mb-6 whitespace-pre-wrap">
                {event.description}
              </p>
            )}

            {/* 地図（一番下） */}
            {event.location && <EventMap location={event.location} title={event.title} />}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
