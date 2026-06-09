'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useState, useEffect } from 'react'
import EventCard from '@/components/events/EventCard'
import { useAuth } from '@/contexts/AuthContext'
import { useFavorites } from '@/contexts/FavoritesContext'

// TODO(完成時): 未ログイン時の「ログインが必要です」ブロックを復元すること（#44）

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

export default function FavoritesPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const { isLoggedIn, isLoading: authLoading } = useAuth()
  const { favorites, isLoading } = useFavorites()

  const showSkeleton = !mounted || authLoading || isLoading

  return (
    <div className="min-h-screen bg-app-bg px-6 py-8">
      {/* ヘッダー */}
      <div className="max-w-6xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center shadow-md">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-app-text leading-tight">お気に入り</h1>
            <p className="text-[12px] text-app-sub mt-0.5">
              {!isLoading ? `${favorites.length}件保存中` : '気になるイベントをまとめて管理'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* スケルトン */}
      {showSkeleton && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* 空の状態 */}
      {!showSkeleton && favorites.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-md mx-auto mt-20 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Heart size={36} className="text-gray-300" />
          </div>
          <h2 className="text-[18px] font-bold text-app-text mb-2">まだお気に入りがありません</h2>
          <p className="text-[13px] text-app-sub mb-6 leading-relaxed">
            {isLoggedIn
              ? <>イベントカードの♡ボタンを押すと<br />ここに保存されます。</>
              : <>♡ボタンを押してお気に入りを追加できます。<br />ログインするとデータが保存されます。</>
            }
          </p>
          <Link
            href="/events"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            イベントを探す →
          </Link>
        </motion.div>
      )}

      {/* お気に入り一覧 */}
      {!showSkeleton && favorites.length > 0 && (
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            >
              {favorites.map((fav, i) => (
                <motion.div
                  key={fav.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <EventCard event={fav.event} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
