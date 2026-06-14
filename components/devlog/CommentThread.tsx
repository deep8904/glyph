'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Trash2, Edit2, Check, X, CornerDownRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MAX_COMMENT = 5000

type CommentAuthor = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export type CommentData = {
  id: string
  author_id: string
  parent_comment_id: string | null
  content: string
  created_at: string
  author: CommentAuthor
  replies?: CommentData[]
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CommentItem({
  comment,
  currentUserId,
  devlogPostId,
  depth = 0,
}: {
  comment: CommentData
  currentUserId: string | null
  devlogPostId: string
  depth?: number
}) {
  const router = useRouter()
  const supabase = createClient()
  const isOwn = currentUserId === comment.author_id

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(comment.content)
  const [replying, setReplying] = useState(false)
  const [replyValue, setReplyValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const authorName = comment.author.display_name || comment.author.username

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return
    setLoading(true)
    await supabase.from('comments').delete().eq('id', comment.id)
    setLoading(false)
    router.refresh()
  }

  const handleEdit = async () => {
    if (!editValue.trim()) return
    setLoading(true)
    await supabase.from('comments').update({ content: editValue.trim() }).eq('id', comment.id)
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  const handleReply = async () => {
    if (!replyValue.trim() || !currentUserId) return
    setError('')
    if (replyValue.length > MAX_COMMENT) {
      setError(`Reply must be under ${MAX_COMMENT} characters.`)
      return
    }
    setLoading(true)
    const { error: dbError } = await supabase.from('comments').insert({
      author_id: currentUserId,
      devlog_post_id: devlogPostId,
      parent_comment_id: comment.id,
      content: replyValue.trim(),
    })
    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    setReplyValue('')
    setReplying(false)
    router.refresh()
  }

  return (
    <div className={depth > 0 ? 'pl-6 border-l-2 border-gray-100' : ''}>
      <div className="flex gap-3">
        <Link href={`/dev/${comment.author.username}`} className="shrink-0">
          {comment.author.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={comment.author.avatar_url} alt="" className="h-8 w-8 rounded-xl object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 font-mono text-xs font-semibold text-indigo-600">
              {initials(authorName)}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link href={`/dev/${comment.author.username}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
              {authorName}
            </Link>
            <span className="text-[11px] font-mono text-gray-400">{formatRelative(comment.created_at)}</span>
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
                rows={3}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                maxLength={MAX_COMMENT}
              />
              <div className="flex gap-2">
                <button onClick={handleEdit} disabled={loading} className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                </button>
                <button onClick={() => { setEditing(false); setEditValue(comment.content) }} className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  <X className="h-3 w-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          )}

          {!editing && (
            <div className="mt-2 flex items-center gap-3">
              {currentUserId && depth === 0 && (
                <button
                  onClick={() => setReplying((r) => !r)}
                  className="text-[11px] font-mono text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  <CornerDownRight className="h-3 w-3 inline mr-1" />Reply
                </button>
              )}
              {isOwn && (
                <>
                  <button onClick={() => setEditing(true)} className="text-[11px] font-mono text-gray-400 hover:text-gray-700 transition-colors">
                    <Edit2 className="h-3 w-3 inline mr-1" />Edit
                  </button>
                  <button onClick={handleDelete} disabled={loading} className="text-[11px] font-mono text-gray-400 hover:text-red-500 transition-colors">
                    {loading ? <Loader2 className="h-3 w-3 inline animate-spin" /> : <Trash2 className="h-3 w-3 inline mr-1" />}Delete
                  </button>
                </>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-3 space-y-2">
              <textarea
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
                rows={3}
                value={replyValue}
                onChange={(e) => setReplyValue(e.target.value)}
                placeholder="Write a reply…"
                maxLength={MAX_COMMENT}
              />
              {error && <p className="text-xs text-red-500 font-mono">{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleReply} disabled={loading || !replyValue.trim()} className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Reply
                </button>
                <button onClick={() => { setReplying(false); setReplyValue('') }} className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* One level of replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 ml-11 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              devlogPostId={devlogPostId}
              depth={1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CommentThread({
  devlogPostId,
  currentUserId,
  comments,
}: {
  devlogPostId: string
  currentUserId: string | null
  comments: CommentData[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !value.trim()) return
    if (value.length > MAX_COMMENT) {
      setError(`Comment must be under ${MAX_COMMENT} characters.`)
      return
    }
    setError('')
    setLoading(true)
    const { error: dbError } = await supabase.from('comments').insert({
      author_id: currentUserId,
      devlog_post_id: devlogPostId,
      content: value.trim(),
    })
    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    setValue('')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <h3 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        Comments {comments.length > 0 ? `(${comments.length})` : ''}
      </h3>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            className="w-full rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Share your thoughts…"
            maxLength={MAX_COMMENT}
          />
          <div className="flex items-center justify-between">
            {error ? (
              <p className="text-xs font-mono text-red-500">{error}</p>
            ) : (
              <p className="text-[11px] font-mono text-gray-400">{value.length}/{MAX_COMMENT}</p>
            )}
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-500">
          <a href="/login" className="text-indigo-600 hover:underline">Sign in</a> to leave a comment.
        </p>
      )}

      {comments.length > 0 ? (
        <div className="space-y-6 divide-y divide-gray-100">
          {comments.map((comment) => (
            <div key={comment.id} className="pt-6 first:pt-0 first:border-none">
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                devlogPostId={devlogPostId}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No comments yet. Be the first.</p>
      )}
    </div>
  )
}
