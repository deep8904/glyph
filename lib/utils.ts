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
