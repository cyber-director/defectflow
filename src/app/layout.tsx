import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DefectFlow — Photo-Based Facility Maintenance Triage',
  description: 'Report a visible facility defect and get it routed and prioritized automatically.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
