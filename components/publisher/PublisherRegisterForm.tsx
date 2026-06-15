'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPublisherAccount } from '@/app/actions/publisher'

export function PublisherRegisterForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createPublisherAccount(formData)
      if ('error' in result) setError(result.error)
      else router.push('/dashboard/publisher')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">
          Company Name <span className="text-red-400">*</span>
        </label>
        <input
          name="company_name"
          required
          maxLength={200}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          placeholder="Acme Publishing Inc."
        />
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
        <p className="text-xs text-amber-700">
          Publisher accounts require manual verification by the Glyph team. Your account will be reviewed within 2–3 business days.
        </p>
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
      >
        {isPending ? 'Registering…' : 'Register as Publisher'}
      </button>
    </form>
  )
}
