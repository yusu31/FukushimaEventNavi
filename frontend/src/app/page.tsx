import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-6">🌿</div>
      <h1 className="text-[32px] font-bold text-app-text mb-3">
        福島イベントナビ
      </h1>
      <p className="text-app-sub text-[16px] mb-10 max-w-md leading-relaxed">
        福島県内のイベント情報をひとつに。<br />
        郡山・いわき・福島市など、地域のイベントをまとめてチェック。
      </p>
      <Link
        href="/events"
        className="bg-primary hover:bg-primary-dark text-white text-[15px] font-semibold px-8 py-3.5 rounded-[12px] transition-colors shadow-md"
      >
        イベントを探す →
      </Link>
    </div>
  )
}
