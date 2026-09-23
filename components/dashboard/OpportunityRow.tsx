import Link from 'next/link'

/** One open opportunity elsewhere on Glyph — plain text row, not a repeat of Collaborate/Playtests' own listing anatomy. */
export function OpportunityRow({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="group flex min-h-11 items-center py-2 text-body text-fg-secondary group-hover:text-fg hover:text-fg [overflow-wrap:anywhere]">
        {children}
      </Link>
    </li>
  )
}
