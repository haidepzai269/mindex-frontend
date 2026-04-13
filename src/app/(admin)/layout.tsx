import type { Metadata } from 'next'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata: Metadata = {
  title: 'Mindex Admin',
  description: 'Mindex Administration Dashboard',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen bg-[#080808] text-white overflow-hidden flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto scrollbar-premium">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 border-b border-white/10 bg-[#080808]/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div className="text-sm font-medium text-zinc-300">Admin Panel</div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-zinc-500">Live · Auto-refresh 30s</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
