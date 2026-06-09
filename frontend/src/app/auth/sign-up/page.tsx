'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Sprout } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp, isLoggedIn, isLoading } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ログイン済みなら /events へリダイレクト
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/events')
    }
  }, [isLoggedIn, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== passwordConfirmation) {
      setError('パスワードと確認用パスワードが一致しません。')
      return
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。')
      return
    }

    setIsSubmitting(true)
    try {
      await signUp(email, password, passwordConfirmation, name)
      router.push('/events')
    } catch {
      setError('登録に失敗しました。入力内容をご確認ください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 mb-3">
            <Sprout size={24} className="text-primary" />
          </span>
          <h1 className="text-[22px] font-bold text-app-text">新規登録</h1>
          <p className="text-[13px] text-app-sub mt-1">Fukushima Event Finder に参加しよう</p>
        </div>

        {/* フォームカード */}
        <div className="
          bg-white/70 backdrop-blur-xl
          border border-white/60
          rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)]
          px-6 py-7
        ">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* 名前 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-app-text">
                名前
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="福島 太郎"
                required
                className="
                  w-full px-3.5 py-2.5 rounded-xl
                  bg-white border border-app-border
                  text-[14px] text-app-text placeholder:text-app-sub/60
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors
                "
              />
            </div>

            {/* メールアドレス */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-app-text">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="
                  w-full px-3.5 py-2.5 rounded-xl
                  bg-white border border-app-border
                  text-[14px] text-app-text placeholder:text-app-sub/60
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors
                "
              />
            </div>

            {/* パスワード */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-app-text">
                パスワード
                <span className="text-app-sub font-normal ml-1">（6文字以上）</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  required
                  className="
                    w-full px-3.5 py-2.5 pr-10 rounded-xl
                    bg-white border border-app-border
                    text-[14px] text-app-text placeholder:text-app-sub/60
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                    transition-colors
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-sub hover:text-app-text"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* パスワード確認 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-app-text">
                パスワード（確認）
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="もう一度入力してください"
                required
                className="
                  w-full px-3.5 py-2.5 rounded-xl
                  bg-white border border-app-border
                  text-[14px] text-app-text placeholder:text-app-sub/60
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors
                "
              />
            </div>

            {/* 登録ボタン */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                mt-1 w-full py-2.5 rounded-xl
                bg-primary hover:bg-primary-dark
                text-white text-[14px] font-semibold
                shadow-[0_2px_8px_rgba(95,139,139,0.3)]
                transition-colors disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? '登録中...' : 'アカウントを作成'}
            </button>
          </form>
        </div>

        {/* ログインリンク */}
        <p className="text-center text-[13px] text-app-sub mt-5">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/auth/sign-in" className="text-primary font-semibold hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  )
}
