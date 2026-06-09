'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, CalendarRange, Heart, Sprout } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navItems: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/', label: 'ホーム', Icon: Home },
  { href: '/events', label: 'イベント一覧', Icon: CalendarDays },
  { href: '/calendar', label: 'カレンダー', Icon: CalendarRange },
  { href: '/favorites', label: 'お気に入り', Icon: Heart },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { isLoggedIn, currentUser, signOut, isLoading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // サインアウト失敗時もUIはリセット済みなので何もしない
    }
  }

  return (
    <aside className="
      w-[240px] shrink-0 h-screen sticky top-0
      flex flex-col
      bg-white/65 backdrop-blur-xl
      border-r border-white/50
      shadow-[1px_0_20px_rgba(0,0,0,0.06)]
    ">
      {/* ロゴ */}
      <div className="px-5 pt-6 pb-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
        >
          <span className="
            w-8 h-8 rounded-xl flex items-center justify-center
            bg-primary/15 group-hover:bg-primary/25 transition-colors
          ">
            <Sprout size={17} className="text-primary" />
          </span>
          <span className="font-bold text-[14px] text-app-text tracking-wide leading-tight">
            Fukushima<br />Event Finder
          </span>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium
                    transition-all duration-150
                    ${isActive
                      ? 'bg-primary/12 text-primary shadow-[inset_0_1px_3px_rgba(95,139,139,0.1)]'
                      : 'text-app-sub hover:bg-white/60 hover:text-app-text'
                    }
                  `}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 下部：認証エリア */}
      <div className="px-3 pb-5 pt-3 border-t border-white/50">
        {!isLoading && (
          <>
            {isLoggedIn ? (
              <div className="flex flex-col gap-2">
                <div className="
                  flex items-center gap-2.5 px-3 py-2 rounded-xl
                  bg-white/50 border border-white/60
                ">
                  <span className="
                    w-7 h-7 rounded-full bg-primary/20
                    flex items-center justify-center text-[12px] font-bold text-primary
                  ">
                    {(currentUser?.name || currentUser?.email || '?')[0].toUpperCase()}
                  </span>
                  <span className="text-[12px] text-app-text font-medium truncate">
                    {currentUser?.name || currentUser?.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="
                    w-full text-[13px] text-app-sub hover:text-app-text
                    py-1.5 rounded-lg hover:bg-white/50 transition-colors
                  "
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Link
                  href="/auth/sign-in"
                  className="
                    w-full text-center text-[13px] font-semibold
                    bg-primary text-white py-2 rounded-xl
                    hover:bg-primary-dark transition-colors
                    shadow-[0_2px_8px_rgba(95,139,139,0.3)]
                  "
                >
                  ログイン
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="
                    w-full text-center text-[13px] font-medium
                    bg-white/60 hover:bg-white/80 text-app-text
                    py-2 rounded-xl border border-white/70 transition-colors
                  "
                >
                  新規登録
                </Link>
              </div>
            )}
          </>
        )}
        <p className="text-[10px] text-app-sub/60 text-center mt-4">
          © {new Date().getFullYear()} Fukushima Event Finder
        </p>
      </div>
    </aside>
  )
}
