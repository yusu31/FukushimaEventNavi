'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useState } from 'react'
// TODO(完成時): import { useRouter } from 'next/navigation' を復元すること（#44）
import toast from 'react-hot-toast'
import {
  Monitor, Music, Trophy, Leaf, Utensils, Landmark,
  Users, BookOpen, Sparkles, Palette, Tag,
  CalendarDays, MapPin, Heart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Event } from '@/types/event'
// TODO(完成時): import { useAuth } from '@/contexts/AuthContext' を復元すること（#44）
import { useFavorites } from '@/contexts/FavoritesContext'

const CATEGORY_STYLES: Record<string, { gradient: string; text: string; Icon: LucideIcon }> = {
  'テクノロジー':      { gradient: 'from-[#0ea5e9] to-[#6366f1]', text: 'text-white', Icon: Monitor },
  '音楽':             { gradient: 'from-[#f59e0b] to-[#ef4444]', text: 'text-white', Icon: Music },
  'スポーツ':         { gradient: 'from-[#22c55e] to-[#0ea5e9]', text: 'text-white', Icon: Trophy },
  '自然・アウトドア': { gradient: 'from-[#16a34a] to-[#15803d]', text: 'text-white', Icon: Leaf },
  '食・グルメ':       { gradient: 'from-[#f97316] to-[#dc2626]', text: 'text-white', Icon: Utensils },
  '文化・伝統':       { gradient: 'from-[#8b5cf6] to-[#6d28d9]', text: 'text-white', Icon: Landmark },
  'ファミリー':       { gradient: 'from-[#06b6d4] to-[#0ea5e9]', text: 'text-white', Icon: Users },
  '教育':             { gradient: 'from-[#3b82f6] to-[#1d4ed8]', text: 'text-white', Icon: BookOpen },
  '祭り・イベント':   { gradient: 'from-[#f59e0b] to-[#d97706]', text: 'text-white', Icon: Sparkles },
  'アート':           { gradient: 'from-[#ec4899] to-[#a855f7]', text: 'text-white', Icon: Palette },
  'その他':           { gradient: 'from-[#6b7280] to-[#4b5563]', text: 'text-white', Icon: Tag },
}
const DEFAULT_STYLE = { gradient: 'from-[#5f8b8b] to-[#4a7070]', text: 'text-white', Icon: Tag }

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    month: 'short', day: 'numeric', weekday: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

type Props = { event: Event }

export default function EventCard({ event }: Props) {
  // TODO(完成時): const router = useRouter() を復元すること（#44）
  // TODO(完成時): const { isLoggedIn } = useAuth() を復元すること（#44）
  const { isFavorited, toggleFavorite } = useFavorites()
  const [isToggling, setIsToggling] = useState(false)

  const favorited = isFavorited(event.id)
  const style = CATEGORY_STYLES[event.category] ?? DEFAULT_STYLE

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    // TODO(完成時): 下の1行を復元してリダイレクトに戻すこと（#44）
    // if (!isLoggedIn) { router.push('/auth/sign-in'); return }
    if (isToggling) return
    setIsToggling(true)
    try {
      await toggleFavorite(event.id, event)
      const next = !favorited
      toast(next ? 'お気に入りに追加しました' : 'お気に入りを解除しました', {
        id: `fav-${event.id}`,
        icon: next
          ? <Heart size={14} className="text-red-500 fill-red-500" />
          : <Heart size={14} className="text-gray-400" />,
        style: { fontSize: '13px', fontWeight: '600' },
        duration: 1500,
      })
    } catch {
      toast.error('操作に失敗しました', { id: `fav-err-${event.id}` })
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <Link href={`/events/${event.id}`} className="block outline-none group h-full">
      <motion.div
        className="
          relative rounded-[20px] overflow-hidden cursor-pointer
          flex flex-col h-full
          bg-white/85 backdrop-blur-sm
          border border-white/60
          shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)]
        "
        style={{ willChange: 'transform' }}
        whileHover={{
          y: -8,
          scale: 1.02,
          boxShadow: '0 24px 48px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.05)',
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
      >
        {/* 画像エリア */}
        <div className="relative w-full aspect-video overflow-hidden">
          {event.image_url ? (
            <motion.div
              className="relative w-full h-full"
              whileHover={{ scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              <Image src={event.image_url} alt={event.title} fill className="object-cover" />
            </motion.div>
          ) : (
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${style.gradient} flex items-center justify-center`}
              whileHover={{ scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              <style.Icon size={52} className="text-white/90 drop-shadow-lg" />
            </motion.div>
          )}

          {/* カテゴリバッジ（左上・常時表示） */}
          <div className={`
            absolute top-3 left-3 z-10
            inline-flex items-center gap-1 px-2.5 py-1 rounded-full
            bg-gradient-to-r ${style.gradient}
            text-[11px] font-bold ${style.text}
            shadow-[0_2px_8px_rgba(0,0,0,0.2)]
          `}>
            <style.Icon size={11} />
            {event.category}
          </div>

          {/* ♡ ボタン（右上・常時表示） */}
          <motion.button
            className="
              absolute top-3 right-3 z-10
              w-8 h-8 rounded-full flex items-center justify-center
            "
            style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(8px)' }}
            whileTap={{ scale: 0.82 }}
            whileHover={{ scale: 1.12, background: 'rgba(0,0,0,0.60)' }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            onClick={handleFavorite}
            aria-label={favorited ? 'お気に入りを解除' : 'お気に入りに追加'}
          >
            <motion.div
              key={favorited ? 'filled' : 'empty'}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              <Heart
                size={15}
                className={favorited ? 'text-red-400 fill-red-400' : 'text-white'}
              />
            </motion.div>
          </motion.button>
        </div>

        {/* テキストエリア */}
        <div className="px-4 pt-3.5 pb-4 flex flex-col flex-1">
          <div className="text-[14px] font-bold text-app-text leading-snug line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-150">
            {event.title}
          </div>

          <div className="flex flex-col gap-1.5 text-[12px] text-app-sub">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={13} className="shrink-0" />
              <span>{formatDate(event.start_at)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
            {event.capacity && (
              <div className="flex items-center gap-1.5">
                <Users size={13} className="shrink-0" />
                <span>定員 {event.capacity}名</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-primary group-hover:translate-x-0.5 transition-transform duration-150">
              詳細を見る →
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
