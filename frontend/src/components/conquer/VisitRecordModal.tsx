'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Camera, Users, Calendar, FileText, User, Heart, UserPlus, Home, Maximize2, Minimize2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import apiClient from '@/lib/axios'
import toast from 'react-hot-toast'
import { normalizeMunicipalityPath } from '@/lib/fukushima-geo'

type MunicipalityFeature = {
  type: 'Feature'
  properties: { N03_004: string | null; N03_007: string | null }
  geometry: { type: string; coordinates: number[][][] }
}

type GeoData = {
  type: 'FeatureCollection'
  features: MunicipalityFeature[]
}

type VisitRecord = {
  id: number
  municipality: string
  companion_type: string
  photo_url: string | null
  visited_at: string
  memo: string | null
}

type Props = {
  municipality: string
  existingRecord: VisitRecord | null
  onClose: () => void
  onSaved: (record: VisitRecord) => void
  onDeleted: (id: number) => void
}

type Orientation = 'landscape' | 'portrait'

const COMPANION_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: '一人', label: '一人', Icon: User },
  { value: '家族', label: '家族', Icon: Home },
  { value: '恋人', label: '恋人', Icon: Heart },
  { value: '友人', label: '友人', Icon: UserPlus },
]

// 選択した向き・位置・スケールでトリミングして Base64 を返す
function cropImage(
  src: string,
  posX: number,
  posY: number,
  scale: number,
  orientation: Orientation
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const TARGET_W = orientation === 'landscape' ? 800 : 600
      const TARGET_H = orientation === 'landscape' ? 600 : 800
      const TARGET_ASPECT = TARGET_W / TARGET_H

      const canvas = document.createElement('canvas')
      canvas.width = TARGET_W
      canvas.height = TARGET_H
      const ctx = canvas.getContext('2d')!

      const effectiveScale = 1 / scale
      const imgAspect = img.naturalWidth / img.naturalHeight

      let baseW: number, baseH: number
      if (imgAspect > TARGET_ASPECT) {
        baseH = img.naturalHeight
        baseW = baseH * TARGET_ASPECT
      } else {
        baseW = img.naturalWidth
        baseH = baseW / TARGET_ASPECT
      }

      const srcW = baseW * effectiveScale
      const srcH = baseH * effectiveScale
      const maxSrcX = img.naturalWidth - srcW
      const maxSrcY = img.naturalHeight - srcH
      const srcX = Math.max(0, Math.min(maxSrcX, maxSrcX * (posX / 100)))
      const srcY = Math.max(0, Math.min(maxSrcY, maxSrcY * (posY / 100)))

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, TARGET_W, TARGET_H)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = src
  })
}

export default function VisitRecordModal({
  municipality,
  existingRecord,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [companionType, setCompanionType] = useState(existingRecord?.companion_type ?? '一人')
  const [visitedAt, setVisitedAt] = useState(
    existingRecord ? existingRecord.visited_at.split('T')[0] : today
  )
  const [memo, setMemo] = useState(existingRecord?.memo ?? '')
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingRecord?.photo_url ?? null)
  const [isNewUpload, setIsNewUpload] = useState(false)
  const [photoPos, setPhotoPos] = useState({ x: 50, y: 50 })
  const [photoScale, setPhotoScale] = useState(1)
  const [orientation, setOrientation] = useState<Orientation>('landscape')
  const [municipalityOverlay, setMunicipalityOverlay] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ドラッグ・ピンチ操作
  const isDragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const lastPinchDist = useRef<number | null>(null)
  const imgRef = useRef<HTMLDivElement>(null)

  // 市町村のアウトラインをオーバーレイ用に読み込む
  useEffect(() => {
    fetch('/fukushima.geojson')
      .then((r) => r.json())
      .then((data: GeoData) => {
        const feature = data.features.find(
          (f) => (f.properties.N03_004 ?? '') === municipality
        )
        if (!feature) return
        const [vpW, vpH] = orientation === 'landscape' ? [400, 300] : [300, 400]
        setMunicipalityOverlay(normalizeMunicipalityPath(feature.geometry.coordinates, vpW, vpH))
      })
  }, [municipality, orientation])

  // ホイール・タッチは passive なので native addEventListener で登録
  useEffect(() => {
    const el = imgRef.current
    if (!el || !isNewUpload) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setPhotoScale((prev) => Math.max(1, Math.min(4, prev - e.deltaY * 0.003)))
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastPinchDist.current = null
        e.preventDefault()
        return
      }
      isDragging.current = true
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      e.preventDefault()
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        if (lastPinchDist.current !== null) {
          const delta = dist - lastPinchDist.current
          setPhotoScale((prev) => Math.max(1, Math.min(4, prev + delta * 0.015)))
        }
        lastPinchDist.current = dist
        isDragging.current = false
        return
      }
      lastPinchDist.current = null
      if (!isDragging.current) return
      const dx = e.touches[0].clientX - lastMouse.current.x
      const dy = e.touches[0].clientY - lastMouse.current.y
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setPhotoPos((prev) => ({
        x: Math.max(0, Math.min(100, prev.x - dx * 0.25)),
        y: Math.max(0, Math.min(100, prev.y - dy * 0.25)),
      }))
    }

    const onTouchEnd = () => {
      isDragging.current = false
      lastPinchDist.current = null
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [isNewUpload, photoPreview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('10MB以下の画像を選択してください')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(reader.result as string)
      setPhotoPos({ x: 50, y: 50 })
      setPhotoScale(1)
      setIsNewUpload(true)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    let finalPhotoUrl: string | null = photoPreview
    if (photoPreview && isNewUpload) {
      finalPhotoUrl = await cropImage(photoPreview, photoPos.x, photoPos.y, photoScale, orientation)
    }

    const payload = {
      visit_record: {
        municipality,
        companion_type: companionType,
        visited_at: visitedAt,
        memo: memo || null,
        photo_url: finalPhotoUrl,
      },
    }

    try {
      if (existingRecord) {
        const res = await apiClient.put(`/api/v1/visit_records/${existingRecord.id}`, payload)
        toast.success('記録を更新しました')
        onSaved(res.data)
      } else {
        const res = await apiClient.post('/api/v1/visit_records', payload)
        toast.success(`${municipality}の訪問を記録しました！`)
        onSaved(res.data)
      }
    } catch {
      toast.error('保存に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!existingRecord) return
    if (!confirm('この記録を削除しますか？')) return
    try {
      await apiClient.delete(`/api/v1/visit_records/${existingRecord.id}`)
      toast.success('記録を削除しました')
      onDeleted(existingRecord.id)
    } catch {
      toast.error('削除に失敗しました')
    }
  }

  const vpW = orientation === 'landscape' ? 400 : 300
  const vpH = orientation === 'landscape' ? 300 : 400
  // 縦モードは横モードと同じ高さになる幅に制限（56.25% = (3/4)² * 100%）
  const photoContainerStyle =
    orientation === 'landscape'
      ? { width: '100%', aspectRatio: '4/3' }
      : { width: '56.25%', aspectRatio: '3/4' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-primary/15 to-primary/5 px-5 py-4 flex items-center justify-between border-b border-gray-100 shrink-0">
          <div>
            <p className="text-[11px] text-primary font-semibold uppercase tracking-wider">
              {existingRecord ? '記録を編集' : '訪問を記録'}
            </p>
            <h2 className="text-[18px] font-bold text-app-text mt-0.5">{municipality}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <X size={15} className="text-app-sub" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4 overflow-y-auto">
          {/* 写真 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-[12px] font-semibold text-app-sub uppercase tracking-wider">
                <Camera size={13} />
                写真（任意）
              </label>
              {/* 縦/横 切り替え */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => { setOrientation('landscape'); setPhotoPos({ x: 50, y: 50 }); setPhotoScale(1) }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    orientation === 'landscape'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-app-sub'
                  }`}
                >
                  <Maximize2 size={11} />
                  横
                </button>
                <button
                  type="button"
                  onClick={() => { setOrientation('portrait'); setPhotoPos({ x: 50, y: 50 }); setPhotoScale(1) }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                    orientation === 'portrait'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-app-sub'
                  }`}
                >
                  <Minimize2 size={11} />
                  縦
                </button>
              </div>
            </div>

            {photoPreview ? (
              /* 縦モードは中央寄せ、横モードは全幅 */
              <div className={orientation === 'portrait' ? 'flex justify-center' : ''}>
                <div
                  className="relative rounded-xl overflow-hidden bg-gray-100"
                  style={photoContainerStyle}
                >
                  {isNewUpload ? (
                    /* 新規アップロード時：ドラッグ・ピンチで調整可能 */
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="訪問写真"
                        className="absolute inset-0 w-full h-full object-cover select-none"
                        style={{
                          objectPosition: `${photoPos.x}% ${photoPos.y}%`,
                          transform: `scale(${photoScale})`,
                          transformOrigin: `${photoPos.x}% ${photoPos.y}%`,
                          transition: 'transform 0.04s',
                          zIndex: 0,
                        }}
                        draggable={false}
                      />

                      {/* 市町村の形のガイドライン（薄く重ねる、pointerEvents:none） */}
                      {municipalityOverlay && (
                        <svg
                          viewBox={`0 0 ${vpW} ${vpH}`}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 2,
                          }}
                        >
                          <path d={municipalityOverlay} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={3} />
                          <path
                            d={municipalityOverlay}
                            fill="rgba(255,255,255,0.12)"
                            stroke="rgba(255,255,255,0.85)"
                            strokeWidth={2}
                            strokeDasharray="5 3"
                          />
                        </svg>
                      )}

                      {/* 操作ヒント（最前面・クリック無効） */}
                      <div
                        className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 text-white rounded-full px-2 py-1 text-[10px] pointer-events-none"
                        style={{ zIndex: 11 }}
                      >
                        形に合わせてドラッグ／ピンチで調整
                      </div>

                      {/* 写真変更ボタン（最前面） */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full px-2 py-1 text-[11px] hover:bg-black/70 transition-colors"
                        style={{ zIndex: 11 }}
                      >
                        変更
                      </button>

                      {/* マウス＆タッチのインタラクティブレイヤー（zIndex:10 = SVGより上、ボタンより下） */}
                      <div
                        ref={imgRef}
                        className="absolute inset-0"
                        style={{ zIndex: 10, touchAction: 'none', cursor: isDragging.current ? 'grabbing' : 'grab' }}
                        onMouseDown={(ev) => {
                          isDragging.current = true
                          lastMouse.current = { x: ev.clientX, y: ev.clientY }
                        }}
                        onMouseMove={(ev) => {
                          if (!isDragging.current) return
                          const dx = ev.clientX - lastMouse.current.x
                          const dy = ev.clientY - lastMouse.current.y
                          lastMouse.current = { x: ev.clientX, y: ev.clientY }
                          setPhotoPos((prev) => ({
                            x: Math.max(0, Math.min(100, prev.x - dx * 0.25)),
                            y: Math.max(0, Math.min(100, prev.y - dy * 0.25)),
                          }))
                        }}
                        onMouseUp={() => { isDragging.current = false }}
                        onMouseLeave={() => { isDragging.current = false }}
                      />
                    </>
                  ) : (
                    /* 既存レコードの写真：そのまま表示 */
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="訪問写真"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full px-2 py-1 text-[11px] hover:bg-black/70 transition-colors"
                      >
                        変更
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* アップロード前：ガイドライン入りのプレースホルダー */
              <div className={orientation === 'portrait' ? 'flex justify-center' : ''}>
                <div
                  className="relative rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 cursor-pointer hover:border-primary/50 transition-colors"
                  style={photoContainerStyle}
                  onClick={() => fileInputRef.current?.click()}
                >
                {/* 市町村の形のガイドライン（未アップロード時） */}
                {municipalityOverlay && (
                  <svg
                    viewBox={`0 0 ${vpW} ${vpH}`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}
                  >
                    <path
                      d={municipalityOverlay}
                      fill="rgba(95,139,139,0.2)"
                      stroke="rgba(95,139,139,0.7)"
                      strokeWidth={2}
                      strokeDasharray="5 3"
                    />
                  </svg>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Camera size={28} className="text-gray-300" />
                  <span className="text-[12px] text-gray-400">クリックして写真を選択</span>
                </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* 同行者 */}
          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-app-sub uppercase tracking-wider mb-2">
              <Users size={13} />
              誰と行った？
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COMPANION_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCompanionType(value)}
                  className={`
                    flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-[12px] font-medium transition-all
                    ${companionType === value
                      ? 'border-primary bg-primary/8 text-primary'
                      : 'border-gray-100 bg-gray-50 text-app-sub hover:border-gray-200'
                    }
                  `}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 訪問日 */}
          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-app-sub uppercase tracking-wider mb-2">
              <Calendar size={13} />
              訪問日
            </label>
            <input
              type="date"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-app-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* メモ */}
          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-semibold text-app-sub uppercase tracking-wider mb-2">
              <FileText size={13} />
              メモ（任意）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="思い出や感想を残そう..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] text-app-text resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-gray-300"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-2 pt-1 pb-1">
            {existingRecord && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-xl border border-red-200 text-red-400 text-[13px] font-medium hover:bg-red-50 transition-colors"
              >
                削除
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-app-sub text-[13px] font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60 shadow-[0_2px_8px_rgba(95,139,139,0.3)]"
            >
              {isSubmitting ? '保存中...' : existingRecord ? '更新する' : '記録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
