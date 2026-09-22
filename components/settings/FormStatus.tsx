/** Result of a settings action, announced to assistive tech. The container is always mounted so the announcement is reliable. */
export function FormStatus({ error, notice, className }: { error?: string; notice?: string; className?: string }) {
  return (
    <div aria-live="polite" className={className}>
      {error && <p role="alert" className="text-small font-medium text-danger">{error}</p>}
      {notice && <p role="status" className="text-small text-success">{notice}</p>}
    </div>
  )
}
