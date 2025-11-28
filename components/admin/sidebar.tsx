'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Cpu,
  Database,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  Bug,
  Send,
  FileText,
  Settings,
  BarChart3,
  Shield,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Revenue', href: '/admin/revenue', icon: DollarSign },
  { name: 'AI Tokens', href: '/admin/ai-tokens', icon: Cpu },
  { name: 'Data Costs', href: '/admin/data-costs', icon: Database },
  { name: 'SMC Engine', href: '/admin/smc-engine', icon: TrendingUp },
  { name: 'Signals', href: '/admin/signals', icon: BarChart3 },
  { name: 'Discord', href: '/admin/discord', icon: MessageSquare },
  { name: 'Crashes', href: '/admin/crashes', icon: Bug },
  { name: 'Errors', href: '/admin/errors', icon: AlertTriangle },
  { name: 'Push', href: '/admin/push', icon: Send },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <Shield className="h-8 w-8 text-emerald-500" />
        <div>
          <h1 className="text-lg font-bold text-white">TradeLens AI</h1>
          <p className="text-xs text-slate-400">Admin Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
