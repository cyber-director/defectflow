import { redirect } from 'next/navigation'

// The brief's target structure has both /staff/dashboard and
// /staff/queue; since a category queue IS the staff dashboard, this
// just points at the real page instead of duplicating it.
export default function StaffDashboardPage() {
  redirect('/staff/queue')
}
