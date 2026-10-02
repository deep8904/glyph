'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type GAuthFieldProps = Omit<React.ComponentProps<'input'>, 'id' | 'className'> & {
  label: string
  error?: string
  description?: string
  endAdornment?: React.ReactNode
  inputClassName?: string
}

/**
 * One labeled auth-form input — label above, 44px-tall control, optional trailing adornment (the
 * password show/hide toggle), an optional helper description, and a field-level error. `aria-invalid`
 * and `aria-describedby` are wired so a screen reader announces the error and description together
 * with the field, not as disconnected text elsewhere on the page.
 */
export const GAuthField = React.forwardRef<HTMLInputElement, GAuthFieldProps>(function GAuthField(
  { label, error, description, endAdornment, inputClassName, ...inputProps },
  ref
) {
  const id = React.useId()
  const descId = description ? `${id}-desc` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-medium text-ink">{label}</label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={[descId, errorId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'h-11 w-full rounded-[10px] border bg-panel px-3.5 text-body text-ink outline-none transition-colors placeholder:text-ink-3 disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-1 focus-visible:ring-offset-paper',
            error ? 'border-gdanger' : 'border-hair-strong focus-visible:border-ember',
            endAdornment && 'pr-11',
            inputClassName
          )}
          {...inputProps}
        />
        {endAdornment}
      </div>
      {description && <p id={descId} className="text-micro text-ink-3">{description}</p>}
      {error && <p id={errorId} role="alert" className="text-small font-medium text-gdanger">{error}</p>}
    </div>
  )
})
