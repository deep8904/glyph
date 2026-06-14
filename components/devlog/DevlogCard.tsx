import Link from 'next/link'
import { Calendar } from 'lucide-react'
import type { DevlogPost } from '@/lib/supabase/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function excerpt(content: string, max = 180) {
  const plain = content.replace(/[#*`>_~\[\]!|]/g, '').replace(/\s+/g, ' ').trim()
  return plain.length > max ? plain.slice(0, max).replace(/\s\S*$/, '') + '…' : plain
}

export function DevlogCard({
  post,
  href,
}: {
  post: Pick<DevlogPost, 'title' | 'content' | 'published_at' | 'slug'>
  href: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300"
    >
      <h3 className="text-base font-medium tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
        {post.title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
        {excerpt(post.content)}
      </p>
      {post.published_at && (
        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-gray-400">
          <Calendar className="h-3 w-3" />
          {formatDate(post.published_at)}
        </div>
      )}
    </Link>
  )
}
