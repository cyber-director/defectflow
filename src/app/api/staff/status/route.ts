import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canTransition } from '@/types/domain'
import type { ComplaintStatus } from '@/types/domain'

// Staff mutation security pattern from CLAUDE.md §25: verify identity +
// role + category server-side with the RLS-respecting client, THEN use
// the admin client for the actual write (complaints has no UPDATE
// policy for `authenticated` — every write goes through here, never
// directly from the browser).
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
  const newStatus = body?.newStatus as ComplaintStatus | undefined

  if (!complaintId || !newStatus) {
    return NextResponse.json(
      { error: 'complaintId and newStatus are required.' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data: complaint }: any = await admin
    .from('complaints')
    .select('id, status, category, assigned_staff_id')
    .eq('id', complaintId)
    .single()

  if (!complaint) {
    return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 })
  }
  if ((complaint as any).category !== profile.staff_category) {
    return NextResponse.json({ error: 'This complaint is outside your category.' }, { status: 403 })
  }
  if (!canTransition((complaint as any).status, newStatus)) {
    return NextResponse.json(
      { error: `Cannot move a complaint from ${(complaint as any).status} to ${newStatus}.` },
      { status: 400 }
    )
  }

  const update: { status: ComplaintStatus; assigned_staff_id?: string; assigned_staff_name?: string } = {
    status: newStatus,
  }
  // The first transition out of Submitted also assigns the acting
  // staff member, so "Assign" doesn't need a separate picker. With
  // multiple staff per category now possible, this is also the
  // moment a name becomes visible to everyone else viewing the ticket.
  if (newStatus === 'Assigned' && !complaint.assigned_staff_id) {
    update.assigned_staff_id = user.id
    update.assigned_staff_name = profile.full_name
  }

  // Multi-staff race condition: two staff in the same category could
  // both click "Assign to me" on the same Submitted ticket at nearly
  // the same moment. Guarding the update on the status we already
  // fetched means only the first one actually lands — the second
  // matches zero rows (status has already moved on) and gets a clear
  // conflict instead of silently overwriting the first staffer's claim.
  const { data: updated, error } = await admin
    .from('complaints')
    .update(update)
    .eq('id', complaintId)
    .eq('status', complaint.status)
    .select('id')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Failed to update status.' }, { status: 500 })
  }
  if (!updated) {
    return NextResponse.json(
      { error: 'Someone else already updated this ticket. Refresh to see the latest status.' },
      { status: 409 }
    )
  }

  // The trigger (011_multi_staff.sql) only manages resolved_at now —
  // attribution has to happen here, since this route is the only place
  // that actually knows who is making the request. Recording it
  // explicitly (rather than inferring it from assigned_staff_id) is
  // what makes the timeline accurate once more than one staff member
  // can act on tickets in the same category.
  await admin.from('ticket_updates').insert({
    complaint_id: complaintId,
    actor_id: user.id,
    actor_name: profile.full_name,
    type: 'status',
    old_status: complaint.status,
    new_status: newStatus,
  })

  return NextResponse.json({ ok: true })
}
