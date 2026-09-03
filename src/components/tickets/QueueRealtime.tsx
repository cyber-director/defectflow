'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import type { StaffCategory } from '@/types/domain'

// Renders nothing — just keeps the (server-rendered) queue list fresh
// when a new complaint is routed into this category, or an existing
// one is claimed/resolved by a teammate (CLAUDE.md §27, §49).
export function QueueRealtime({ category }: { category: StaffCategory }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`queue-${category}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'complaints', filter: `category=eq.${category}` },
        () => router.refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [category, router])

  return null
}
