import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { modelExists } from '@/lib/inference/server/detect'

export const runtime = 'nodejs'

// CLAUDE.md §53. Never leaks keys or exception details — just ok/error
// per subsystem, and whether the real model or the stub is active.
export async function GET() {
  const result: { app: string; database: string; storage: string; model: string } = {
    app: 'ok',
    database: 'unknown',
    storage: 'unknown',
    model: 'unknown',
  }

  try {
    const admin = createAdminClient()

    const { error: dbError } = await admin.from('profiles').select('id').limit(1)
    result.database = dbError ? 'error' : 'ok'

    const { error: storageError } = await admin.storage
      .from('complaint-images')
      .list('', { limit: 1 })
    result.storage = storageError ? 'error' : 'ok'
  } catch {
    result.database = 'error'
    result.storage = 'error'
  }

  result.model = modelExists() ? 'onnx' : 'stub'

  return NextResponse.json(result)
}
