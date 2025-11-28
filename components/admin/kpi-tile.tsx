import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPITileProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  className?: string
}

export function KPITile({ title, value, icon: Icon, trend, className }: KPITileProps) {
  return (
    <Card className={cn('bg-slate-900 border-slate-800', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white mt-2">{value}</p>
            {trend && (
              <p className="text-sm mt-2">
                <span
                  className={cn(
                    'font-medium',
                    trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                  )}
                >
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
                <span className="text-slate-400 ml-1">{trend.label}</span>
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-emerald-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
