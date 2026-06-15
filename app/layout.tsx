import type { Metadata } from 'next'
import { Geist, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'
import { DevDebugPanel } from '@/components/DevDebugPanel'
import { analyticsScriptProps } from '@/lib/analytics'

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
  const analyticsProps = analyticsScriptProps()

  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <head>
        {analyticsProps && <Script {...analyticsProps} strategy="afterInteractive" />}
      </head>
      <body className="font-sans bg-[#0f0e13] text-gray-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>
        <div id="main-content">
          {children}
        </div>
        <Analytics />
        {process.env.NODE_ENV === 'development' && <DevDebugPanel />}
      </body>
    </html>
  )
}
