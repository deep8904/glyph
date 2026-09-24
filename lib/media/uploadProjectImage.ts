import type { SupabaseClient } from '@supabase/supabase-js'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB — matches the bucket's own file_size_limit
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const
const EXT_FOR_TYPE: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }

export type UploadValidationError = 'type' | 'size'

/** Fast, client-side pre-check — the bucket itself enforces the same limits server-side (a
 *  bypassed client can't get past them), this just fails fast with a specific reason. */
export function validateImageFile(file: File): UploadValidationError | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) return 'type'
  if (file.size > MAX_IMAGE_BYTES) return 'size'
  return null
}

export const VALIDATION_MESSAGE: Record<UploadValidationError, string> = {
  type: 'That file type isn’t supported. Use PNG, JPEG, WebP, or GIF.',
  size: 'That file is too large. Images must be 5MB or smaller.',
}

/**
 * Uploads one image to the project's own media folder and returns its public URL. Path is
 * {projectId}/{kind}/{uuid}.{ext} — a fresh UUID per upload, never overwritten, so this is always
 * a plain insert (no upsert, matching the write RLS policy's minimal required grant).
 */
export async function uploadProjectImage(
  supabase: SupabaseClient,
  projectId: string,
  kind: 'cover' | 'screenshots',
  file: File
): Promise<{ url: string; path: string } | { error: string }> {
  const invalid = validateImageFile(file)
  if (invalid) return { error: VALIDATION_MESSAGE[invalid] }

  const ext = EXT_FOR_TYPE[file.type] ?? 'bin'
  const path = `${projectId}/${kind}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('project-media').upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000', // media is content-addressed by a fresh UUID per upload, safe to cache hard
    upsert: false,
  })

  if (error) {
    // Network failure and a real server rejection look the same to this SDK; give a generic,
    // honest message rather than guessing which one happened.
    return { error: 'Upload failed. Check your connection and try again.' }
  }

  const { data } = supabase.storage.from('project-media').getPublicUrl(path)
  return { url: data.publicUrl, path }
}

/** Best-effort cleanup — if this fails, the object is simply an orphan (no data-integrity impact,
 *  since the DB's cover_url/screenshots columns are the source of truth for what's "attached"). */
export async function removeProjectImage(supabase: SupabaseClient, path: string): Promise<void> {
  await supabase.storage.from('project-media').remove([path]).catch(() => {})
}

/** Recovers the storage object path from a public URL this same helper minted, so "remove" can
 *  target the right object even though the form only carries the URL string (matching the
 *  existing cover_url/screenshots data shape — no new columns needed). */
export function pathFromPublicUrl(url: string): string | null {
  const marker = '/object/public/project-media/'
  const i = url.indexOf(marker)
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length))
}
