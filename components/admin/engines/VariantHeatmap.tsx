'use client'

import type { VariantRunRowClient } from './VariantDashboardClient'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  rows: VariantRunRowClient[]
  metric: 'expectancy' | 'total_return_pct'
  selectedVariant: string | null
  onSelectVariant?: (variant: string | null) => void
}

export function VariantHeatmap({ rows, metric, selectedVariant, onSelectVariant }: Props) {
  const variants = Array.from(new Set(rows.map((r) => r.filter_variant))).sort()
  const tickers = Array.from(new Set(rows.map((r) => r.ticker))).sort()
  const timeframes = Array.from(new Set(rows.map((r) => r.timeframe))).sort()

  const activeVariant = selectedVariant ?? variants[0] ?? null

  const filtered = rows.filter((r) => r.filter_variant === activeVariant)

  const valueByKey = new Map<string, number | null>()
  filtered.forEach((r) => {
    const key = `${r.ticker}|${r.timeframe}`
    const val = metric === 'expectancy' ? r.expectancy : r.total_return_pct
    valueByKey.set(key, val ?? null)
  })

  const values = Array.from(valueByKey.values()).filter(
    (v): v is number => typeof v === 'number' && !Number.isNaN(v),
  )
  const max = values.length ? Math.max(...values) : 0
  const min = values.length ? Math.min(...values) : 0

  const classify = (v: number | null | undefined): string => {
    if (v == null || Number.isNaN(v)) return 'bg-slate-800'
    if (metric === 'expectancy') {
      if (v >= 0.15) return 'bg-green-500/20'
      if (v >= 0.05) return 'bg-yellow-500/20'
      if (v <= -0.05) return 'bg-red-500/20'
      return 'bg-yellow-500/20'
    }
    if (v >= 30) return 'bg-green-500/20'
    if (v >= 10) return 'bg-yellow-500/20'
    if (v <= -10) return 'bg-red-500/20'
    return 'bg-yellow-500/20'
  }

  return (
    <Card className="rounded-2xl shadow-md bg-slate-900/80 border-slate-800">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-base text-slate-50">Variant Heatmap</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            {metric === 'expectancy'
              ? 'Expectancy (R per trade) across tickers and timeframes.'
              : 'Total return (%) across tickers and timeframes.'}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Variant</span>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <Badge
                key={v}
                variant={v === activeVariant ? 'default' : 'outline'}
                className="cursor-pointer rounded-full"
                onClick={() => onSelectVariant?.(v)}
              >
                {v}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeVariant == null || tickers.length === 0 ? (
          <p className="text-sm text-slate-400">No data available yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
              <table className="min-w-full border-collapse text-xs text-slate-100">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left text-[11px] text-slate-400">Ticker / TF</th>
                    {timeframes.map((tf) => (
                      <th
                        key={tf}
                        className="px-2 py-1 text-center text-[11px] font-medium text-slate-400"
                      >
                        {tf}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickers.map((ticker) => (
                    <tr key={ticker} className="border-t border-slate-800/60">
                      <td className="px-2 py-1 text-[11px] font-medium text-slate-200">
                        {ticker}
                      </td>
                      {timeframes.map((tf) => {
                        const key = `${ticker}|${tf}`
                        const v = valueByKey.get(key) ?? null
                        const cls = classify(v)
                        return (
                          <td
                            key={key}
                            className="px-1 py-1 text-center align-middle"
                            title={
                              v == null
                                ? 'No data'
                                : metric === 'expectancy'
                                ? `${v.toFixed(3)} R`
                                : `${v.toFixed(1)}%`
                            }
                          >
                            <div
                              className={`flex h-8 items-center justify-center rounded-xl text-[11px] font-medium ${cls}`}
                            >
                              {v == null
                                ? '–'
                                : metric === 'expectancy'
                                ? v.toFixed(2)
                                : v.toFixed(1)}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Active variant: <span className="font-medium text-slate-100">{activeVariant}</span>
              </span>
              <span>
                Range: {min.toFixed(2)} – {max.toFixed(2)} {metric === 'expectancy' ? 'R' : '%'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}