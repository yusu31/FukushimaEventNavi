import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="text-6xl mb-6">🌿</div>
      <h1 className="mb-4 text-center leading-none">
        <span className="block">
          <span className="text-[64px] font-black text-primary">F</span>
          <span className="text-[40px] font-bold text-app-text">ukushima</span>
        </span>
        <span className="block">
          <span className="text-[64px] font-black text-primary">E</span>
          <span className="text-[40px] font-bold text-app-text">vent </span>
          <span className="text-[64px] font-black text-primary">F</span>
          <span className="text-[40px] font-bold text-app-text">inder</span>
        </span>
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
