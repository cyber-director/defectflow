import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, staff_category, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'staff') {
    return NextResponse.json({ error: 'Staff access required.' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const complaintId = body?.complaintId as string | undefined
  const message = String(body?.message || '').trim()

  if (!complaintId || !message) {
    return NextResponse.json({ error: 'complaintId and message are required.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: complaint } = await admin
    .from('complaints')
    .select('id, category')
    .eq('id', complaintId)
    .single()

  if (!complaint || complaint.category !== profile.staff_category) {
    return NextResponse.json({ error: 'This complaint is outside your category.' }, { status: 403 })
  }

  const { error } = await admin.from('ticket_updates').insert({
    complaint_id: complaintId,
    actor_id: user.id,
    actor_name: profile.full_name,
    type: 'staff_note',
    message,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to post the update.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
