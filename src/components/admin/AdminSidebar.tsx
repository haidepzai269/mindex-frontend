'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Zap,
  MessageSquare,
  Activity,
  LogOut,
  Shield,
} from 'lucide-react'

const navItems = [
  { href: '/admin/system', label: 'System Health', icon: LayoutDashboard },
  { href: '/admin/tokens', label: 'Token Monitor', icon: Zap },
  { href: '/admin/feedbacks', label: 'User Feedbacks', icon: MessageSquare },
  { href: '/admin/chats', label: 'Chat Audit', icon: MessageSquare },
  { href: '/admin/queue', label: 'Queue Health', icon: Activity },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="h-screen w-[220px] border-r border-white/10 bg-[#0a0a0a] flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
        <Shield className="h-5 w-5 text-violet-400" />
        <span className="font-semibold text-white text-sm tracking-wide">Mindex</span>
        <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded-sm font-medium">
          admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/logout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </Link>
      </div>
    </aside>
  )
}
