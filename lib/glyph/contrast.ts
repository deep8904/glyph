/** WCAG relative-luminance contrast ratio helper — used by the token contrast test. Pure math. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const num = parseInt(n, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const f = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) }
  const [R, G, B] = [f(r), f(g), f(b)]
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

export function contrastRatio(fg: string, bg: string): number {
  const L1 = relLuminance(hexToRgb(fg))
  const L2 = relLuminance(hexToRgb(bg))
  const [lighter, darker] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (lighter + 0.05) / (darker + 0.05)
}
