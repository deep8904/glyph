/**
 * Deterministic identity tints — the one answer to media poverty, shared by every surface that
 * has to stand in for missing media: the project title-plate (ProjectMark), the coverless project
 * hero band, and developer avatars. A stable hash of a seed (id or name) picks one pastel `bg`
 * paired with a dark `ink` that clears ~4.5:1 on that bg, so text on the tint stays legible.
 *
 * One source of truth: change the palette here and every plate, band, and avatar moves together.
 */
export type Tint = { bg: string; ink: string }

export const TINTS: Tint[] = [
  { bg: '#edf0f5', ink: '#3b4557' }, // slate
  { bg: '#f4ece5', ink: '#6b4a2e' }, // clay
  { bg: '#e7f0ea', ink: '#285c3f' }, // moss
  { bg: '#efecf7', ink: '#45397a' }, // iris
  { bg: '#f1ece2', ink: '#5f4f30' }, // sand
  { bg: '#e8eef3', ink: '#2f4a63' }, // steel
  { bg: '#f7ecef', ink: '#7a3348' }, // rose
  { bg: '#eef2e5', ink: '#4c5c26' }, // olive
  { bg: '#ece9f6', ink: '#4a3d80' }, // violet
  { bg: '#f5efe4', ink: '#7a5620' }, // amber
  { bg: '#e6f0f0', ink: '#276160' }, // teal
  { bg: '#f2ecf2', ink: '#6b3d6b' }, // plum
]

export function tintFor(seed: string): Tint {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return TINTS[h % TINTS.length]
}
