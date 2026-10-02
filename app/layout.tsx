import type { Metadata } from 'next'
import { Geist, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from 'next/script'
import './globals.css'
import { DevDebugPanel } from '@/components/DevDebugPanel'
import { Toaster } from '@/components/ui/Toast'
import { analyticsScriptProps } from '@/lib/analytics'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Glyph — Your home base before launch',
  description:
    'Glyph is the platform for indie game developers who are still building. Profile, devlogs, playtesting, events, and collaboration — all in one place, always free.',
}

// No-flash theme resolution: apply the saved/system theme before first paint.
const themeScript = `(function(){try{var t=localStorage.getItem('glyph-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var m=t==='dark'||t==='light'?t:(d?'dark':'light');document.documentElement.setAttribute('data-theme',m);}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Only on real Vercel deploys — the Insights/analytics endpoints 404 locally (even under
  // `next start`, which sets NODE_ENV=production), so gate on the Vercel env to keep local
  // previews console-clean.
  const onVercel = Boolean(process.env.VERCEL)
  const analyticsProps = onVercel ? analyticsScriptProps() : null

  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {analyticsProps && <Script {...analyticsProps} strategy="afterInteractive" />}
      </head>
      <body className="bg-canvas font-sans text-fg antialiased">
        {children}
        <Toaster />
        {onVercel && <Analytics />}
        {process.env.NODE_ENV === 'development' && <DevDebugPanel />}
      </body>
    </html>
  )
}
