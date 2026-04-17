import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
})

export const metadata: Metadata = {
  title: '삼산타운1차 소식지',
  description: '입주민이 알아야 할 우리 단지 이야기',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.className} bg-white`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
