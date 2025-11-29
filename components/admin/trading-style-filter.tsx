'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface TradingStyleFilterProps {
  currentStyle?: string
}

export function TradingStyleFilter({ currentStyle = 'all' }: TradingStyleFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleStyleChange = (style: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (style === 'all') {
      params.delete('tradingStyle')
    } else {
      params.set('tradingStyle', style)
    }
    
    router.push(`?${params.toString()}`)
  }

  const isActive = (style: string) => {
    return (currentStyle || 'all') === style
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400 mr-2">Trading Style:</span>
      <Button
        variant={isActive('all') ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleStyleChange('all')}
        className={isActive('all') ? '' : 'text-slate-400 border-slate-700 hover:bg-slate-800'}
      >
        All
      </Button>
      <Button
        variant={isActive('daytrade') ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleStyleChange('daytrade')}
        className={
          isActive('daytrade')
            ? 'bg-red-500/20 text-red-400 border-red-500/20 hover:bg-red-500/30'
            : 'text-slate-400 border-slate-700 hover:bg-slate-800'
        }
      >
        ⚡ Daytrade
      </Button>
      <Button
        variant={isActive('swing') ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleStyleChange('swing')}
        className={
          isActive('swing')
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/20 hover:bg-blue-500/30'
            : 'text-slate-400 border-slate-700 hover:bg-slate-800'
        }
      >
        🔁 Swingtrade
      </Button>
      <Button
        variant={isActive('invest') ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleStyleChange('invest')}
        className={
          isActive('invest')
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/20 hover:bg-purple-500/30'
            : 'text-slate-400 border-slate-700 hover:bg-slate-800'
        }
      >
        🏦 Investing
      </Button>
    </div>
  )
}
