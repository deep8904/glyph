'use client'

import { useEffect, useRef } from 'react'

/**
 * Arrow-key roving focus over a results list — the "fast, keyboard-first retrieval" the job
 * calls for. Wraps the server-rendered result rows without changing them: ArrowDown/ArrowUp move
 * focus between each row's primary link (marked with `data-result-link`), so results are usable
 * exactly like a native list without any client-side re-render of the results themselves.
 */
export function ResultsKeyNav({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      const active = document.activeElement
      if (!root.contains(active)) return
      const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-result-link]'))
      if (links.length === 0) return
      const i = links.indexOf(active as HTMLAnchorElement)
      e.preventDefault()
      const next = e.key === 'ArrowDown' ? Math.min(i + 1, links.length - 1) : Math.max(i - 1, 0)
      links[i === -1 ? 0 : next]?.focus()
    }
    root.addEventListener('keydown', onKey)
    return () => root.removeEventListener('keydown', onKey)
  }, [])

  return <div ref={ref}>{children}</div>
}
