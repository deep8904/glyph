import type { Metadata } from 'next'
import { Geist, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { DevDebugPanel } from '@/components/DevDebugPanel'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Glyph — Your home base before launch',
  description:
    'Glyph is the platform for indie game developers who are still building. Profile, devlogs, playtesting, events, and collaboration — all in one place, always free.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans bg-[#0f0e13] text-gray-900 antialiased">
        {children}
        <Analytics />
        {process.env.NODE_ENV === 'development' && <DevDebugPanel />}
      </body>
    </html>
  )
}
