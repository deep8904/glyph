'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, ChevronRight, CornerDownRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { stripDangerousUnicode, relativeTime } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogClose, DialogContent, DialogFooter } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/controls'

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

/**
 * One comment. Replies are one level deep (the existing data model); a thread with replies can be
 * collapsed. Edit/delete belong to the author (RLS enforces it), reply to any signed-in viewer.
 * Every failed write is shown inline instead of being dropped.
 */
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
  const repliesId = useId()

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(comment.content)
  const [replying, setReplying] = useState(false)
  const [replyValue, setReplyValue] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const authorName = comment.author.display_name || comment.author.username
  const replies = comment.replies ?? []

  const handleDelete = async () => {
    setLoading(true)
    setError('')
    const { error: dbError } = await supabase.from('comments').delete().eq('id', comment.id)
    setLoading(false)
    if (dbError) { setError('Could not delete the comment. Try again.'); setConfirmDelete(false); return }
    setConfirmDelete(false)
    router.refresh()
  }

  const handleEdit = async () => {
    if (!editValue.trim()) return
    setLoading(true)
    setError('')
    const { error: dbError } = await supabase.from('comments').update({ content: stripDangerousUnicode(editValue.trim()) }).eq('id', comment.id)
    setLoading(false)
    if (dbError) { setError('Could not save your edit. Your text is still here.'); return }
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
      content: stripDangerousUnicode(replyValue.trim()),
    })
    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    if (comment.author_id !== currentUserId) {
      await supabase.from('notifications').insert({
        recipient_id: comment.author_id,
        actor_id: currentUserId,
        type: 'reply',
        entity_type: 'devlog_post',
        entity_id: devlogPostId,
      })
    }
    setReplyValue('')
    setReplying(false)
    router.refresh()
  }

  return (
    <div>
      <div className="flex gap-3">
        <Link href={`/dev/${comment.author.username}`} aria-label={`${authorName}'s profile`} className="mt-0.5 shrink-0">
          <Avatar name={authorName} src={comment.author.avatar_url} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <Link href={`/dev/${comment.author.username}`} className="min-h-0 text-small font-semibold text-fg hover:text-link">{authorName}</Link>
            <time dateTime={comment.created_at} className="text-micro text-fg-muted">{relativeTime(comment.created_at)}</time>
          </p>

          {editing ? (
            <div className="mt-2 space-y-2">
              <Field label="Edit comment" error={error || null}>
                {(p) => <Textarea {...p} value={editValue} onChange={(e) => setEditValue(e.target.value)} maxLength={MAX_COMMENT} rows={3} />}
              </Field>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={handleEdit} loading={loading} disabled={!editValue.trim()}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setEditValue(comment.content); setError('') }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap text-body text-fg-secondary [overflow-wrap:anywhere]">{comment.content}</p>
          )}

          {!editing && (
            <div className="-ml-2 mt-1 flex flex-wrap items-center">
              {currentUserId && depth === 0 && (
                <Button size="sm" variant="ghost" onClick={() => setReplying((r) => !r)} aria-expanded={replying}>
                  <CornerDownRight aria-hidden strokeWidth={1.75} className="size-3.5" /> Reply
                </Button>
              )}
              {isOwn && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} className="hover:text-danger">Delete</Button>
                </>
              )}
              {replies.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed} aria-controls={repliesId}>
                  {collapsed ? <ChevronRight aria-hidden strokeWidth={1.75} className="size-3.5" /> : <ChevronDown aria-hidden strokeWidth={1.75} className="size-3.5" />}
                  {collapsed ? `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : 'Hide replies'}
                </Button>
              )}
            </div>
          )}
          {!editing && error && <p role="alert" className="mt-1 text-small text-danger">{error}</p>}

          {replying && (
            <div className="mt-3 space-y-2">
              <Field label={`Reply to ${authorName}`} error={error || null}>
                {(p) => <Textarea {...p} value={replyValue} onChange={(e) => setReplyValue(e.target.value)} maxLength={MAX_COMMENT} rows={3} />}
              </Field>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={handleReply} loading={loading} disabled={!replyValue.trim()}>Reply</Button>
                <Button size="sm" variant="ghost" onClick={() => { setReplying(false); setReplyValue(''); setError('') }}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div id={repliesId} hidden={collapsed} className="ml-4 mt-4 space-y-4 border-l border-line pl-4 sm:ml-5">
          {replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId} devlogPostId={devlogPostId} depth={1} />
          ))}
        </div>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent title="Delete this comment?" description={replies.length > 0 ? 'Its replies will be deleted with it. This cannot be undone.' : 'This cannot be undone.'}>
          <DialogFooter>
            <DialogClose asChild><Button variant="ghost">Keep comment</Button></DialogClose>
            <Button variant="danger" onClick={handleDelete} loading={loading}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Feedback on a devlog: a composer and threaded replies. Useful feedback, not engagement — there are no
 * votes, scores or rankings; comments stay in the order they were written.
 */
export function CommentThread({
  devlogPostId,
  devlogAuthorId,
  currentUserId,
  comments,
  loadFailed = false,
}: {
  devlogPostId: string
  devlogAuthorId: string
  currentUserId: string | null
  comments: CommentData[]
  loadFailed?: boolean
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
      content: stripDangerousUnicode(value.trim()),
    })
    setLoading(false)
    if (dbError) { setError(dbError.message); return }
    if (devlogAuthorId !== currentUserId) {
      await supabase.from('notifications').insert({
        recipient_id: devlogAuthorId,
        actor_id: currentUserId,
        type: 'comment',
        entity_type: 'devlog_post',
        entity_id: devlogPostId,
      })
    }
    setValue('')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Add feedback" hint={`${value.length}/${MAX_COMMENT}`} error={error || null}>
            {(p) => <Textarea {...p} value={value} onChange={(e) => setValue(e.target.value)} maxLength={MAX_COMMENT} rows={4} placeholder="What worked, what did not, what you would try next…" />}
          </Field>
          <Button type="submit" variant="primary" loading={loading} disabled={!value.trim()}>Post comment</Button>
        </form>
      ) : (
        <p className="text-small text-fg-secondary">
          <Link href="/login" className="inline-flex min-h-11 items-center font-medium text-link underline-offset-2 hover:underline">Sign in</Link> to leave feedback.
        </p>
      )}

      {loadFailed ? (
        <ErrorState inline title="We couldn't load the comments" description="This may be temporary. Reload the page to try again." />
      ) : comments.length > 0 ? (
        <ul className="divide-y divide-line-subtle">
          {comments.map((comment) => (
            <li key={comment.id} className="py-5 first:pt-0">
              <CommentItem comment={comment} currentUserId={currentUserId} devlogPostId={devlogPostId} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          kind="first-use"
          className="border-y-0 py-2"
          title="No feedback yet"
          description={currentUserId ? 'Be the first to respond to this devlog.' : 'Sign in to be the first to respond.'}
        />
      )}
    </div>
  )
}
