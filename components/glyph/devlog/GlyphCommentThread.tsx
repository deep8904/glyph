'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { stripDangerousUnicode, relativeTime, cn } from '@/lib/utils'
import { shouldRestoreFailureFocus } from '@/lib/glyph/focusRestore'
import { GAvatar, GButton } from '@/components/glyph/ui/primitives'
import { GEmptyState, GErrorState } from '@/components/glyph/ui/States'

const MAX_COMMENT = 5000

type CommentAuthor = { id: string; username: string; display_name: string | null; avatar_url: string | null }

export type CommentData = {
  id: string
  author_id: string
  parent_comment_id: string | null
  content: string
  created_at: string
  author: CommentAuthor
  replies?: CommentData[]
}

function GTextarea({ value, onChange, maxLength, rows, placeholder, label }: {
  value: string
  onChange: (v: string) => void
  maxLength: number
  rows: number
  placeholder?: string
  label: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-[10px] border border-hair-strong bg-panel px-3.5 py-2.5 text-body text-ink outline-none transition-colors placeholder:text-ink-3 focus-visible:border-ember focus-visible:ring-2 focus-visible:ring-ember"
      />
      <p className="mt-1 text-right text-micro text-ink-3">{value.length}/{maxLength}</p>
    </div>
  )
}

/**
 * One comment. Replies are one level deep (the existing data model). Edit/delete belong to the
 * author (RLS enforces it); anyone signed in can reply. A destructive delete needs one explicit
 * confirm step first — no modal, just an inline "are you sure" that replaces the action row.
 */
function CommentItem({ comment, currentUserId, devlogPostId, depth = 0 }: {
  comment: CommentData
  currentUserId: string | null
  devlogPostId: string
  depth?: number
}) {
  const router = useRouter()
  const isOwn = currentUserId === comment.author_id
  const repliesId = useId()

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(comment.content)
  const [replying, setReplying] = useState(false)
  const [replyValue, setReplyValue] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Set on a failed delete, cleared once we've actually moved focus. A plain post-`await` call to
  // `.focus()` can land while the confirmation Delete button is still disabled (loading hasn't
  // committed to `false` yet) — a disabled button can't reliably take focus. Routing the failure
  // through this flag + an effect means the focus attempt only runs after React has committed the
  // render where the button is enabled again, with no `setTimeout` guesswork.
  const [pendingFailureFocus, setPendingFailureFocus] = useState(false)
  const deleteTriggerRef = useRef<HTMLButtonElement>(null)
  const keepRef = useRef<HTMLButtonElement>(null)
  const confirmDeleteRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)
  const confirmDescId = useId()

  // Focus follows the confirmation's lifecycle: opening moves focus to the safe "Keep" action;
  // cancelling (Keep, or Escape) returns it to the Delete button that opened it. A failed delete
  // does *not* close the panel, so it never hits the "cancel" branch here — see the effect below.
  useEffect(() => {
    if (confirmDelete) {
      keepRef.current?.focus()
    } else if (wasConfirming.current) {
      deleteTriggerRef.current?.focus()
      setPendingFailureFocus(false) // the panel closed (success or otherwise) — nothing left to restore
    }
    wasConfirming.current = confirmDelete
  }, [confirmDelete])

  // Post-commit focus restoration for a failed delete. Runs after every render this component
  // makes, but only acts once all four conditions hold — confirmation still open, not mid-request,
  // an error is actually present, and the confirm Delete button is a real, enabled, connected node
  // — then focuses it exactly once and clears the flag so an unrelated later render can't steal
  // focus back to it.
  useEffect(() => {
    const btn = confirmDeleteRef.current
    const shouldFocus = shouldRestoreFailureFocus({
      pendingFailureFocus,
      confirmDelete,
      loading,
      error,
      buttonDisabled: btn?.disabled ?? true,
      buttonConnected: btn?.isConnected ?? false,
    })
    if (shouldFocus) {
      btn!.focus()
      setPendingFailureFocus(false)
    }
  }, [pendingFailureFocus, confirmDelete, loading, error])

  const authorName = comment.author.display_name || comment.author.username
  const replies = comment.replies ?? []

  const handleDelete = async () => {
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: dbError } = await supabase.from('comments').delete().eq('id', comment.id)
    setLoading(false)
    if (dbError) {
      // Stay in the confirmation state on failure — don't drop the user back to the action row.
      // Focus restoration itself happens in the effect above, once the enabled button has actually
      // committed to the DOM.
      setError('Could not delete the comment. Try again.')
      setPendingFailureFocus(true)
      return
    }
    setConfirmDelete(false)
    router.refresh()
  }

  const handleEdit = async () => {
    if (!editValue.trim()) return
    setLoading(true); setError('')
    const supabase = createClient()
    const { error: dbError } = await supabase.from('comments').update({ content: stripDangerousUnicode(editValue.trim()) }).eq('id', comment.id)
    setLoading(false)
    if (dbError) { setError('Could not save your edit. Your text is still here.'); return }
    setEditing(false)
    router.refresh()
  }

  const handleReply = async () => {
    if (!replyValue.trim() || !currentUserId) return
    if (replyValue.length > MAX_COMMENT) { setError(`Reply must be under ${MAX_COMMENT} characters.`); return }
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error: dbError } = await supabase.from('comments').insert({
      author_id: currentUserId, devlog_post_id: devlogPostId, parent_comment_id: comment.id, content: stripDangerousUnicode(replyValue.trim()),
    })
    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    if (comment.author_id !== currentUserId) {
      await supabase.from('notifications').insert({ recipient_id: comment.author_id, actor_id: currentUserId, type: 'reply', entity_type: 'devlog_post', entity_id: devlogPostId })
    }
    setReplyValue(''); setReplying(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex gap-3">
        <Link href={`/dev/${comment.author.username}`} aria-label={`${authorName}'s profile`} className="mt-0.5 flex size-11 shrink-0 items-center justify-center self-start rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ember sm:size-8">
          <GAvatar name={authorName} src={comment.author.avatar_url} size={32} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Link href={`/dev/${comment.author.username}`} className="text-small font-semibold text-ink outline-none hover:text-ember-ink focus-visible:ring-2 focus-visible:ring-ember">{authorName}</Link>
            <time dateTime={comment.created_at} className="text-micro text-ink-3">{relativeTime(comment.created_at)}</time>
          </p>

          {editing ? (
            <div className="mt-2 space-y-2">
              <GTextarea label="Edit comment" value={editValue} onChange={setEditValue} maxLength={MAX_COMMENT} rows={3} />
              {error && <p role="alert" className="text-small text-gdanger">{error}</p>}
              <div className="flex gap-2">
                <GButton size="sm" variant="ember" onClick={handleEdit} disabled={loading || !editValue.trim()}>Save</GButton>
                <GButton size="sm" variant="ghost" onClick={() => { setEditing(false); setEditValue(comment.content); setError('') }}>Cancel</GButton>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap text-body text-ink-2 [overflow-wrap:anywhere]">{comment.content}</p>
          )}

          {!editing && !confirmDelete && (
            <div className="-ml-2.5 mt-1 flex flex-wrap items-center">
              {currentUserId && depth === 0 && (
                <button type="button" onClick={() => setReplying((r) => !r)} aria-expanded={replying} className="inline-flex min-h-11 items-center gap-1.5 rounded-[8px] px-2.5 text-small font-medium text-ink-3 outline-none hover:bg-sunken hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-ember sm:min-h-9">
                  <CornerDownRight aria-hidden strokeWidth={1.75} className="size-3.5" /> Reply
                </button>
              )}
              {isOwn && (
                <>
                  <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center rounded-[8px] px-2.5 text-small font-medium text-ink-3 outline-none hover:bg-sunken hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-ember sm:min-h-9">Edit</button>
                  <button ref={deleteTriggerRef} type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-11 items-center rounded-[8px] px-2.5 text-small font-medium text-ink-3 outline-none hover:bg-sunken hover:text-gdanger focus-visible:ring-2 focus-visible:ring-ember sm:min-h-9">Delete</button>
                </>
              )}
              {replies.length > 0 && (
                <button type="button" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed} aria-controls={repliesId} className="inline-flex min-h-11 items-center gap-1 rounded-[8px] px-2.5 text-small font-medium text-ink-3 outline-none hover:bg-sunken hover:text-ink-2 focus-visible:ring-2 focus-visible:ring-ember sm:min-h-9">
                  {collapsed ? <ChevronRight aria-hidden strokeWidth={1.75} className="size-3.5" /> : <ChevronDown aria-hidden strokeWidth={1.75} className="size-3.5" />}
                  {collapsed ? `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : 'Hide replies'}
                </button>
              )}
            </div>
          )}

          {confirmDelete && (
            <div
              role="group"
              aria-label="Confirm delete comment"
              aria-describedby={confirmDescId}
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setConfirmDelete(false); setError('') } }}
              className="mt-2 flex flex-wrap items-center gap-3 rounded-[10px] border border-hair bg-sunken px-3 py-2.5"
            >
              <p id={confirmDescId} role="alert" className="text-small text-ink-2">
                {replies.length > 0 ? 'Delete this comment and its replies? This cannot be undone.' : 'Delete this comment? This cannot be undone.'}
              </p>
              <div className="ml-auto flex gap-2">
                <GButton ref={keepRef} size="sm" variant="ghost" onClick={() => { setConfirmDelete(false); setError('') }}>Keep</GButton>
                <GButton ref={confirmDeleteRef} size="sm" variant="outline" onClick={handleDelete} disabled={loading} className="border-gdanger/40 text-gdanger hover:bg-gdanger/10">Delete</GButton>
              </div>
              {error && <p role="alert" className="w-full text-small text-gdanger">{error}</p>}
            </div>
          )}
          {!editing && !confirmDelete && error && <p role="alert" className="mt-1 text-small text-gdanger">{error}</p>}

          {replying && (
            <div className="mt-3 space-y-2">
              <GTextarea label={`Reply to ${authorName}`} value={replyValue} onChange={setReplyValue} maxLength={MAX_COMMENT} rows={3} />
              {error && <p role="alert" className="text-small text-gdanger">{error}</p>}
              <div className="flex gap-2">
                <GButton size="sm" variant="ember" onClick={handleReply} disabled={loading || !replyValue.trim()}>Reply</GButton>
                <GButton size="sm" variant="ghost" onClick={() => { setReplying(false); setReplyValue(''); setError('') }}>Cancel</GButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div id={repliesId} hidden={collapsed} className="ml-4 mt-4 space-y-4 border-l border-hair pl-4 sm:ml-5">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId} devlogPostId={devlogPostId} depth={1} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Feedback on a devlog: a composer and threaded replies, in chronological order — no votes, scores,
 * or ranking. Same `comments` table contract and notification behavior as the legacy thread.
 */
export function GlyphCommentThread({ devlogPostId, devlogAuthorId, currentUserId, comments, loadFailed = false }: {
  devlogPostId: string
  devlogAuthorId: string
  currentUserId: string | null
  comments: CommentData[]
  loadFailed?: boolean
}) {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !value.trim()) return
    if (value.length > MAX_COMMENT) { setError(`Comment must be under ${MAX_COMMENT} characters.`); return }
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error: dbError } = await supabase.from('comments').insert({ author_id: currentUserId, devlog_post_id: devlogPostId, content: stripDangerousUnicode(value.trim()) })
    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    if (devlogAuthorId !== currentUserId) {
      await supabase.from('notifications').insert({ recipient_id: devlogAuthorId, actor_id: currentUserId, type: 'comment', entity_type: 'devlog_post', entity_id: devlogPostId })
    }
    setValue('')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <GTextarea label="Add feedback" value={value} onChange={setValue} maxLength={MAX_COMMENT} rows={4} placeholder="What worked, what didn't, what you'd try next…" />
          {error && <p role="alert" className="text-small text-gdanger">{error}</p>}
          <GButton type="submit" variant="ember" size="sm" disabled={loading || !value.trim()}>Post comment</GButton>
        </form>
      ) : (
        <p className="text-small text-ink-2">
          <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-ember-ink underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ember sm:min-h-0">Sign in</Link> to leave feedback.
        </p>
      )}

      {loadFailed ? (
        <GErrorState title="We couldn't load the comments" description="This may be temporary. Reload the page to try again." />
      ) : comments.length > 0 ? (
        <ul className={cn('space-y-5')}>
          {comments.map((comment) => (
            <li key={comment.id}>
              <CommentItem comment={comment} currentUserId={currentUserId} devlogPostId={devlogPostId} />
            </li>
          ))}
        </ul>
      ) : (
        <GEmptyState title="No feedback yet" description={currentUserId ? 'Be the first to respond to this devlog.' : 'Sign in to be the first to respond.'} />
      )}
    </div>
  )
}
