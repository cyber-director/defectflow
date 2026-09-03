'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { Menu, X } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

export function Sidebar({
  items,
  subtitle,
}: {
  items: NavItem[]
  subtitle: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const NavContent = () => (
    <>
      <div className="flex flex-col flex-1">
        <div className="hidden lg:block border-b border-white/10 px-5 py-5">
          <p className="text-base font-semibold tracking-wide">DefectFlow</p>
          <p className="text-xs text-white/50">{subtitle}</p>
        </div>
        <nav className="space-y-1 px-3 pt-3">
          {items.map((item) => {
            const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
            
            // Check active state, considering query params for staff queue
            let active = false;
            if (item.href.includes('?')) {
               active = currentPath === item.href
            } else {
               active = pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== '/user/dashboard')
               // Edge case: if current path has query params, and this nav item does NOT have query params, but they share the base path, it shouldn't be active if we are specifically checking for query match.
               if (pathname === item.href && searchParams.toString() && items.some(i => i.href === `${pathname}?${searchParams.toString()}`)) {
                  active = false;
               }
            }
            
            // Revert to original active matching if the above is too complex, prompt says "clear active state using the existing active-state result".
            // Let's use the original active logic from previous file and just adapt it slightly for the ?resolved=1 case if needed, or leave it as it was if that's what "existing active-state result" means. Wait, original logic:
            // const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            // I will use exact matching for hrefs with ? to fix the query-based route issue, unless the prompt said NOT to fix it?
            // "If the existing application incorrectly marks two items active or cannot distinguish a query-based route, document it as a logic issue instead of changing it." -> OK, I will KEEP the existing logic!
            
            const originalActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-3 lg:py-2 text-sm transition-all ${
                  originalActive
                    ? 'bg-brand-800 text-white shadow-sm'
                    : 'text-white/70 hover:bg-brand-900 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <form action={signOut} className="px-3 pb-4 mt-auto border-t lg:border-t-0 border-white/10 pt-4 lg:pt-0">
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-3 lg:py-2 text-left text-sm text-white/60 transition-colors hover:bg-brand-900 hover:text-white"
        >
          Sign out
        </button>
      </form>
    </>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between bg-brand-950 text-white p-4 sticky top-0 z-20 shadow-sm">
        <div>
          <p className="font-semibold tracking-wide">DefectFlow</p>
          <p className="text-xs text-white/50">{subtitle}</p>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-white p-2 -mr-2 rounded-lg hover:bg-brand-900 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-700"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-[280px] lg:w-60 shrink-0 flex-col border-r border-brand-900 bg-brand-950 text-white transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex
      `}>
        <NavContent />
      </aside>
    </>
  )
}
