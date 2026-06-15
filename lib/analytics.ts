// Cookie-free analytics via Plausible or Umami.
// Configure ONE of the following in .env.local:
//   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=glyph.gg
//   NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-umami-website-id
//   NEXT_PUBLIC_UMAMI_URL=https://analytics.example.com/script.js

export function analyticsScriptProps():
  | { src: string; 'data-domain'?: string; 'data-website-id'?: string; defer: boolean; 'data-api'?: string }
  | null {
  if (typeof process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN === 'string' && process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) {
    return {
      src: 'https://plausible.io/js/script.js',
      'data-domain': process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
      defer: true,
    }
  }

  if (typeof process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID === 'string' && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID) {
    return {
      src: process.env.NEXT_PUBLIC_UMAMI_URL ?? 'https://umami.is/script.js',
      'data-website-id': process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
      defer: true,
    }
  }

  return null
}

// Track custom events (no-op if analytics not loaded)
export function trackEvent(name: string, props?: Record<string, string | number>) {
  if (typeof window === 'undefined') return
  // Plausible
  if ('plausible' in window) {
    // @ts-expect-error — plausible is injected at runtime
    window.plausible(name, { props })
  }
  // Umami
  if ('umami' in window) {
    // @ts-expect-error — umami is injected at runtime
    window.umami.track(name, props)
  }
}
