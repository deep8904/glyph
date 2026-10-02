'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type Common = { label: string; error?: string; description?: string; optional?: boolean }

function FieldLabel({ id, label, optional }: { id: string; label: string; optional?: boolean }) {
  return (
    <label htmlFor={id} className="text-small font-medium text-ink">
      {label} {optional ? <span className="font-normal text-ink-3">(optional)</span> : <span className="sr-only">(required)</span>}
    </label>
  )
}

const controlClass = (error?: string) => cn(
  'w-full rounded-[10px] border bg-panel px-3.5 text-body text-ink outline-none transition-colors placeholder:text-ink-3 disabled:cursor-not-allowed disabled:opacity-50',
  'focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-1 focus-visible:ring-offset-paper',
  error ? 'border-gdanger' : 'border-hair-strong focus-visible:border-ember'
)

/** Every field states plainly whether it's required or optional — never left ambiguous — and wires
 * `aria-invalid`/`aria-describedby` so a screen reader announces the error and description together
 * with the control, not as disconnected text elsewhere on the page. */
export const OnboardingTextField = React.forwardRef<HTMLInputElement, Common & Omit<React.ComponentProps<'input'>, 'id' | 'className'>>(
  function OnboardingTextField({ label, error, description, optional, ...inputProps }, ref) {
    const id = React.useId()
    const descId = description ? `${id}-desc` : undefined
    const errorId = error ? `${id}-error` : undefined
    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel id={id} label={label} optional={optional} />
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={[descId, errorId].filter(Boolean).join(' ') || undefined}
          className={cn('h-11', controlClass(error))}
          {...inputProps}
        />
        {description && <p id={descId} className="text-micro text-ink-3">{description}</p>}
        {error && <p id={errorId} role="alert" className="text-small font-medium text-gdanger">{error}</p>}
      </div>
    )
  }
)

export const OnboardingTextarea = React.forwardRef<HTMLTextAreaElement, Common & Omit<React.ComponentProps<'textarea'>, 'id' | 'className'>>(
  function OnboardingTextarea({ label, error, description, optional, ...areaProps }, ref) {
    const id = React.useId()
    const descId = description ? `${id}-desc` : undefined
    const errorId = error ? `${id}-error` : undefined
    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel id={id} label={label} optional={optional} />
        <textarea
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={[descId, errorId].filter(Boolean).join(' ') || undefined}
          className={cn('min-h-24 resize-y py-2.5', controlClass(error))}
          {...areaProps}
        />
        {description && <p id={descId} className="text-micro text-ink-3">{description}</p>}
        {error && <p id={errorId} role="alert" className="text-small font-medium text-gdanger">{error}</p>}
      </div>
    )
  }
)

export const OnboardingSelect = React.forwardRef<HTMLSelectElement, Common & { placeholder?: string; options: readonly { value: string; label: string }[] } & Omit<React.ComponentProps<'select'>, 'id' | 'className'>>(
  function OnboardingSelect({ label, error, description, optional, placeholder = 'Select…', options, ...selectProps }, ref) {
    const id = React.useId()
    const descId = description ? `${id}-desc` : undefined
    const errorId = error ? `${id}-error` : undefined
    return (
      <div className="flex flex-col gap-1.5">
        <FieldLabel id={id} label={label} optional={optional} />
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={[descId, errorId].filter(Boolean).join(' ') || undefined}
          className={cn('h-11', controlClass(error))}
          {...selectProps}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {description && <p id={descId} className="text-micro text-ink-3">{description}</p>}
        {error && <p id={errorId} role="alert" className="text-small font-medium text-gdanger">{error}</p>}
      </div>
    )
  }
)
