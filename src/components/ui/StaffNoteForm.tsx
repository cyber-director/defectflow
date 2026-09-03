'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export function StaffNoteForm({ complaintId }: { complaintId: string }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) return

    setLoading(true)
    const res = await fetch('/api/staff/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaintId, message: trimmed }),
    })
    setLoading(false)

    if (res.ok) {
      setMessage('')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 flex flex-col">
      <div>
        <label htmlFor="staff-note" className="sr-only">Staff note</label>
        <textarea
          id="staff-note"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="Post an update…"
          className="input-field resize-y min-h-[60px]"
        />
      </div>
      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={loading || !message.trim()} 
          className="btn-secondary text-xs px-3 py-1.5 flex items-center justify-center gap-1.5"
          aria-live="polite"
        >
          {loading && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>}
          {loading ? 'Posting…' : 'Post update'}
        </button>
      </div>
    </form>
  )
}
