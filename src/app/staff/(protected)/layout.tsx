import { redirect } from 'next/navigation'
import { ListChecks, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Sidebar, type NavItem } from '@/components/shell/Sidebar'

const NAV_ITEMS: NavItem[] = [
  { href: '/staff/queue', label: 'Queue', icon: <ListChecks size={20} /> },
  { href: '/staff/queue?resolved=1', label: 'Resolved', icon: <CheckCircle2 size={20} /> },
]

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/staff/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, staff_category')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'staff') {
    redirect('/user/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-app">
      <Sidebar items={NAV_ITEMS} subtitle={`${profile.staff_category} · ${profile.full_name || user.email}`} />
      <main className="flex-1 p-4 lg:p-6 w-full">{children}</main>
    </div>
  )
}
