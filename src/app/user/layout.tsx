import { redirect } from 'next/navigation'
import { LayoutDashboard, FileText, PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Sidebar, type NavItem } from '@/components/shell/Sidebar'

const NAV_ITEMS: NavItem[] = [
  { href: '/user/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { href: '/user/complaints', label: 'My Complaints', icon: <FileText size={20} /> },
  { href: '/user/complaints/new', label: 'Report Defect', icon: <PlusCircle size={20} /> },
]

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'user') {
    redirect('/staff/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-app">
      <Sidebar items={NAV_ITEMS} subtitle={profile.full_name || user.email || ''} />
      <main className="flex-1 p-4 lg:p-6 w-full">{children}</main>
    </div>
  )
}
