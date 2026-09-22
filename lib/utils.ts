import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip zero-width, direction-override, and homoglyph-attack unicode characters
 * from user-supplied strings before display or storage.
 */
export function stripDangerousUnicode(input: string): string {
  return input
    // Zero-width characters
    .replace(/[​-‍﻿]/g, '')
    // Bidirectional control characters (pastejacking / direction override)
    .replace(/[‪-‮⁦-⁩‎‏]/g, '')
}

/** Whole days elapsed since an ISO timestamp. */
export function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86400000
}

/**
 * Compact relative-time label ("3d ago", "just now") for activity/timeline
 * rows — deliberately terse (no "Xh Ym" precision) since these are
 * scannable list items, not a detail page.
 */
export function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

/**
 * True only for absolute https URLs. Project media and links are user-entered
 * strings rendered as <img src>/<a href>, so anything else (javascript:, data:,
 * plain http:) is rejected both when saving and when rendering.
 */
export function isHttpsUrl(value: string | null | undefined): value is string {
  if (!value) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Plain-text preview of markdown for list rows. Heading lines are dropped
 * (they otherwise run into the following sentence, e.g. "The honest
 * post-mortem The original combat system…"); if a post is nothing but
 * headings, their text is used instead.
 */
export function markdownExcerpt(content: string, max = 200): string {
  const strip = (t: string) =>
    t.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*`>_~|]/g, '').replace(/\s+/g, ' ').trim()
  const lines = content.split('\n')
  const body = strip(lines.filter((l) => !/^\s{0,3}#{1,6}\s/.test(l)).join(' '))
  const plain = body || strip(lines.join(' '))
  return plain.length > max ? plain.slice(0, max).replace(/\s\S*$/, '') + '…' : plain
}

/** Up to two initials from a display name or username, for avatar fallbacks. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/[\s_.-]+/).filter(Boolean)
  const letters = (parts.length > 1 ? parts.slice(0, 2).map((p) => p[0]) : [parts[0]?.slice(0, 2) ?? '?']).join('')
  return letters.toUpperCase()
}
