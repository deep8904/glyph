/**
 * Simple in-memory rate limiter.
 * Works within a single Vercel function instance (Fluid Compute).
 * For multi-instance production: replace with Upstash Redis.
 */

type Bucket = { count: number; reset: number }

const store = new Map<string, Bucket>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = store.get(key)

  if (!bucket || now > bucket.reset) {
    store.set(key, { count: 1, reset: now + windowMs })
    return true
  }

  if (bucket.count >= limit) return false

  bucket.count += 1
  return true
}

export function getIP(request: Request): string {
  const forwarded = request instanceof Request
    ? (request.headers.get('x-forwarded-for') ?? '')
    : ''
  return forwarded.split(',')[0].trim() || 'unknown'
}
