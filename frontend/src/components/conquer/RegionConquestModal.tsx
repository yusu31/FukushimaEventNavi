'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import RegionItem3D from './RegionItem3D'

type RegionStat = {
  id: string
  name: string
  color: string
}

type Props = {
  region: RegionStat
  onAdd: () => Promise<boolean>
  onClose: () => void
  alreadyConquered: boolean
}

export default function RegionConquestModal({ region, onAdd, onClose, alreadyConquered }: Props) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(alreadyConquered)
  const [flyOut, setFlyOut] = useState(false)
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    const timer = setTimeout(() => {
      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.5 },
        colors: [region.color, '#ffd700', '#ffffff', '#ff6b6b'],
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [region.color])

  const handleAdd = async () => {
    if (added || adding) return
    setAdding(true)
    const ok = await onAdd()
    setAdding(false)
    if (ok) {
      setAdded(true)
      setFlyOut(true)
      setTimeout(() => onClose(), 1200)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[300] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 背景写真 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/conquer/regions/${region.id}.jpg`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.45) saturate(1.2)', pointerEvents: 'none' }}
        />

        {/* コンテンツ */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
          {/* 地区名 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.55em',
                textTransform: 'uppercase',
                color: '#d4af37',
                textShadow: '0 0 20px rgba(212,175,55,0.5)',
              }}
            >
              Conquered
            </p>
            <h2
              className="text-5xl font-black tracking-wide"
              style={{ color: '#ffffff', textShadow: '0 0 40px rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.8)' }}
            >
              {region.name}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.25)' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.35em' }}>制覇</span>
              <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.25)' }} />
            </div>
          </motion.div>

          {/* 3Dアイテム */}
          <AnimatePresence>
            {!flyOut ? (
              <motion.div
                key="item"
                initial={{ y: 80, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ x: 200, y: -200, opacity: 0, scale: 0.3 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 260, damping: 22 }}
                style={{ width: 220, height: 220 }}
              >
                <RegionItem3D regionId={region.id} autoRotate={true} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* ボタン */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col items-center gap-3"
          >
            {!added ? (
              <button
                onClick={handleAdd}
                disabled={adding}
                className="px-8 py-3 rounded-full font-bold text-lg text-black transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #ffd700, #ffb300)', boxShadow: '0 4px 20px rgba(255,215,0,0.5)' }}
              >
                {adding ? '追加中...' : '✨ コレクションに追加！'}
              </button>
            ) : (
              <p className="text-white font-bold text-lg">コレクションに追加しました！</p>
            )}
            <button
              onClick={onClose}
              className="text-white/60 text-sm hover:text-white/90 transition-colors"
            >
              閉じる
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
