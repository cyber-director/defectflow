import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeImageOnServer } from '@/lib/inference/server/detect'

// onnxruntime-node and sharp need the Node runtime, not Edge.
export const runtime = 'nodejs'

// Used two ways: (1) as the browser's fallback preview when client-side
// ONNX can't load (CLAUDE.md §16), and (2) available for any future
// server-rendered preview needs. Never the source of truth for a saved
// complaint — that's POST /api/complaints, which re-runs this same
// server detector itself rather than trusting a client-supplied result.
export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const formData = await request.formData()
  const imageFile = formData.get('image')
  if (!(imageFile instanceof File)) {
    return NextResponse.json({ error: 'An image file is required.' }, { status: 400 })
  }

  const buffer = Buffer.from(await imageFile.arrayBuffer())
  const analysis = await analyzeImageOnServer(buffer)
  return NextResponse.json(analysis)
}
