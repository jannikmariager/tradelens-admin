'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface EngineTrade {
  ticker: string | null
  side: 'LONG' | 'SHORT' | null
  entry_price: number | null
  exit_price: number | null
  entry_timestamp: string | null
  exit_timestamp: string | null
  realized_pnl_dollars: number | null
  realized_pnl_r: number | null
}

interface EngineMetric {
  engine_version: string
  run_mode: 'PRIMARY' | 'SHADOW'
  is_enabled: boolean
  is_user_visible: boolean
  started_at: string | null
  stopped_at: string | null
  total_trades: number
  winners: number
  losers: number
  win_rate: number
  total_pnl: number
  todays_pnl?: number
  avg_r: number
  max_drawdown: number
  current_equity: number
  net_return: number
  equity_curve: Array<{ timestamp: string; equity: number }>
  recent_trades?: EngineTrade[]
  display_label?: string
}

interface JournalTotals {
  starting_equity: number
  current_equity: number
  since_inception_realized_pnl: number
  current_unrealized_pnl: number
  net_return_pct: number
}

export default function EngineMetricsPage() {
  const [metrics, setMetrics] = useState<EngineMetric[]>([])
  const [journalTotals, setJournalTotals] = useState<JournalTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/admin/engine-metrics')
        if (!response.ok) {
          throw new Error('Failed to fetch metrics')
        }
        const data = await response.json()
        setMetrics(data.metrics || [])
        setJournalTotals(data.journal_totals || null)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Engine Performance</h1>
          <p className="text-muted-foreground mt-2">Loading metrics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Engine Performance</h1>
          <p className="text-red-600 mt-2">Error: {error}</p>
        </div>
      </div>
    )
  }

  const primaryEngines = metrics.filter((m) => m.run_mode === 'PRIMARY')
  const shadowEngines = metrics.filter((m) => m.run_mode === 'SHADOW')
  const activePrimary = primaryEngines.find((engine) => engine.is_enabled) ?? primaryEngines[0] ?? null

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }
  const getEngineLabel = (engine: EngineMetric) => engine.display_label || engine.engine_version

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Engine Performance</h1>
        <p className="text-muted-foreground mt-2">
          Compare live (PRIMARY) and shadow (SHADOW) engine versions
        </p>
      </div>

      {/* PRIMARY Engines */}
      <Card>
        <CardHeader>
          <CardTitle>Live Engines (PRIMARY)</CardTitle>
          <CardDescription>Engines running in production and executing real trades</CardDescription>
        </CardHeader>
        <CardContent>
          {primaryEngines.length === 0 ? (
            <p className="text-muted-foreground">No primary engines found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>Win Rate</TableHead>
                  <TableHead>Avg R</TableHead>
                  <TableHead>Today&apos;s PnL</TableHead>
                  <TableHead>Net Return</TableHead>
                  <TableHead>Max DD</TableHead>
                  <TableHead>Current Equity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {primaryEngines.map((engine) => (
                  <TableRow key={engine.engine_version}>
                    <TableCell className="font-medium">{getEngineLabel(engine)}</TableCell>

                    <TableCell>
                      {engine.is_enabled ? (
                        <Badge variant="default" className="bg-green-600">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {engine.total_trades} ({engine.winners}W / {engine.losers}L)
                    </TableCell>
                    <TableCell>{engine.win_rate.toFixed(1)}%</TableCell>
                    <TableCell className={engine.avg_r >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {engine.avg_r.toFixed(2)}R
                    </TableCell>
                    <TableCell className={(engine.todays_pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${ (engine.todays_pnl ?? 0).toFixed(2) }
                    </TableCell>
                    <TableCell className={engine.net_return >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {engine.net_return.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-red-600">-{engine.max_drawdown.toFixed(2)}%</TableCell>
                    <TableCell>${engine.current_equity.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* SHADOW Engines */}
      <Card>
        <CardHeader>
          <CardTitle>Shadow Engines (SHADOW)</CardTitle>
          <CardDescription>
            Virtual engines running in parallel with live trading, testing new strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shadowEngines.length === 0 ? (
            <p className="text-muted-foreground">No shadow engines found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trades</TableHead>
                  <TableHead>Win Rate</TableHead>
                  <TableHead>Avg R</TableHead>
                  <TableHead>Today&apos;s PnL</TableHead>
                  <TableHead>Net Return</TableHead>
                  <TableHead>Max DD</TableHead>
                  <TableHead>Current Equity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shadowEngines.map((engine) => {
                  const engineSlug =
                    engine.engine_key?.toUpperCase() === 'CRYPTO_V1_SHADOW'
                      ? 'crypto-v1-shadow'
                      : engine.engine_version.toLowerCase().replace(/_/g, '-')
                  return (
                    <TableRow key={`${engine.engine_key}-${engine.engine_version}`}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/engine-metrics/${engineSlug}`} className="hover:underline text-blue-600">
                          {getEngineLabel(engine)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {engine.is_enabled ? (
                          <Badge variant="outline" className="border-emerald-600 text-emerald-600">
                            Running
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Stopped</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {engine.total_trades} ({engine.winners}W / {engine.losers}L)
                      </TableCell>
                      <TableCell>{engine.win_rate.toFixed(1)}%</TableCell>
                      <TableCell className={engine.avg_r >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {engine.avg_r.toFixed(2)}R
                      </TableCell>
                      <TableCell className={(engine.todays_pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ${ (engine.todays_pnl ?? 0).toFixed(2) }
                      </TableCell>
                      <TableCell className={engine.net_return >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {engine.net_return.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-red-600">-{engine.max_drawdown.toFixed(2)}%</TableCell>
                      <TableCell>${engine.current_equity.toLocaleString()}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {journalTotals && activePrimary && (
        <Card>
          <CardHeader>
            <CardTitle>Live Journal vs Admin (SWING)</CardTitle>
            <CardDescription>
              Journal stats include every SWING trade (any engine version) plus current unrealized PnL. Admin stats on
              this page are scoped to the active engine_version ({getEngineLabel(activePrimary)}). Any delta therefore
              represents historical trades or open positions outside the current engine.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Admin (Primary Engine)</TableHead>
                  <TableHead>Journal (Strategy)</TableHead>
                  <TableHead>Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Current Equity</TableCell>
                  <TableCell>
                    ${activePrimary.current_equity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    ${journalTotals.current_equity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    ${(activePrimary.current_equity - journalTotals.current_equity).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Net Return %</TableCell>
                  <TableCell>{activePrimary.net_return.toFixed(2)}%</TableCell>
                  <TableCell>{journalTotals.net_return_pct.toFixed(2)}%</TableCell>
                  <TableCell>
                    {(activePrimary.net_return - journalTotals.net_return_pct).toFixed(2)}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Realized PnL</TableCell>
                  <TableCell>${activePrimary.total_pnl.toFixed(2)}</TableCell>
                  <TableCell>${journalTotals.since_inception_realized_pnl.toFixed(2)}</TableCell>
                  <TableCell>
                    {(activePrimary.total_pnl - journalTotals.since_inception_realized_pnl).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <Card className="border-l-4 border-l-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">View Shadow Engine Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Click on any shadow engine name above to view its detailed configuration, parameters, and complete trade history.
        </CardContent>
      </Card>
    </div>
  )
}
