'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createStudio } from '@/app/actions/studios'
import { STUDIO_SIZES } from '@/lib/supabase/types'

export function NewStudioForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createStudio(formData)
      if ('error' in result) {
        setError(result.error)
      } else if (result.success && result.slug) {
        router.push(`/dashboard/studios/${result.slug}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">
          Studio Name <span className="text-red-400">*</span>
        </label>
        <input
          name="name"
          required
          maxLength={200}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          placeholder="Midnight Pixel Games"
        />
      </div>

      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">Description</label>
        <textarea
          name="description"
          maxLength={5000}
          rows={4}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition resize-none"
          placeholder="What does your studio make?"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">Team Size</label>
          <select
            name="size"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          >
            {STUDIO_SIZES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">Founded Year</label>
          <input
            name="founded_year"
            type="number"
            min={1970}
            max={2100}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            placeholder={String(new Date().getFullYear())}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">Location</label>
        <input
          name="location"
          maxLength={100}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          placeholder="Montreal, QC"
        />
      </div>

      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-1.5">Website</label>
        <input
          name="website"
          type="url"
          maxLength={500}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
          placeholder="https://yourstudio.com"
        />
      </div>

      {error && (
        <p className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
      >
        {isPending ? 'Creating…' : 'Create Studio'}
      </button>
    </form>
  )
}
