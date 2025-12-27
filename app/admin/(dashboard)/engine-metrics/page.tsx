'use client'

import { useEffect, useState } from 'react'
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

  const renderTradesTable = (engine: EngineMetric) => {
    if (!engine.recent_trades || engine.recent_trades.length === 0) {
      return <p className="text-muted-foreground">No closed trades yet.</p>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticker</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Entry → Exit</TableHead>
            <TableHead>PnL ($)</TableHead>
            <TableHead>PnL (R)</TableHead>
            <TableHead>Closed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {engine.recent_trades.map((trade, idx) => (
            <TableRow key={`${engine.engine_version}-trade-${idx}`}>
              <TableCell className="font-medium">{trade.ticker || '—'}</TableCell>
              <TableCell>{trade.side || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                ${trade.entry_price?.toFixed(2) ?? '—'} → ${trade.exit_price?.toFixed(2) ?? '—'}
              </TableCell>
              <TableCell className={Number(trade.realized_pnl_dollars) >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${Number(trade.realized_pnl_dollars ?? 0).toFixed(2)}
              </TableCell>
              <TableCell className={Number(trade.realized_pnl_r) >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Number(trade.realized_pnl_r ?? 0).toFixed(2)}R
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDateTime(trade.exit_timestamp)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

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
                  <TableHead>Total PnL</TableHead>
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
                    <TableCell className={engine.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${engine.total_pnl.toFixed(2)}
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
                  <TableHead>Total PnL</TableHead>
                  <TableHead>Net Return</TableHead>
                  <TableHead>Max DD</TableHead>
                  <TableHead>Current Equity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shadowEngines.map((engine) => (
                  <TableRow key={engine.engine_version}>
                    <TableCell className="font-medium">{engine.engine_version}</TableCell>
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
                    <TableCell className={engine.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${engine.total_pnl.toFixed(2)}
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((engine) => (
          <Card key={engine.engine_version}>
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"text-sm font-medium\">{getEngineLabel(engine)}</CardTitle>
              <CardDescription>
                <Badge variant={engine.run_mode === 'PRIMARY' ? 'default' : 'outline'}>
                  {engine.run_mode}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {engine.net_return >= 0 ? '+' : ''}
                  {engine.net_return.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {engine.total_trades} trades | {engine.win_rate.toFixed(1)}% WR
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Trades */}
      <div className="space-y-4">
        {[...primaryEngines, ...shadowEngines].map((engine) => (
          <Card key={`${engine.engine_version}-${engine.run_mode}-trades`}>
            <CardHeader>
              <CardTitle>
                Recent Trades — {getEngineLabel(engine)} ({engine.run_mode})
              </CardTitle>
              <CardDescription>
                Pulled directly from {engine.run_mode === 'PRIMARY' ? 'live_trades' : 'engine_trades'} (max 10)
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTradesTable(engine)}</CardContent>
          </Card>
        ))}
      </div>

      {/* Engine Configuration Differences */}
      <Card>
        <CardHeader>
          <CardTitle>Engine Configuration Differences</CardTitle>
          <CardDescription>Key parameter differences between V1 and V2</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* V1 Configuration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-blue-600">
                  V1 (PRIMARY)
                </Badge>
                <span className="text-sm font-medium">SWING_V1_EXPANSION</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Trailing Stop Activation:</span>
                  <span className="font-medium">1.5R profit</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Trailing Stop Distance:</span>
                  <span className="font-medium">0.75R below peak</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Time Exit Threshold:</span>
                  <span className="font-medium">0.6R minimum</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Universe Filter:</span>
                  <span className="font-medium">All SWING signals</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Profile:</span>
                  <span className="font-medium">Conservative exits</span>
                </div>
              </div>
            </div>

            {/* V2 Configuration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-emerald-600 text-emerald-600">
                  V2 (SHADOW)
                </Badge>
                <span className="text-sm font-medium">SWING_V2_ROBUST</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Trailing Stop Activation:</span>
                  <span className="font-medium text-emerald-600">1.0R profit ↓ (faster)</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Trailing Stop Distance:</span>
                  <span className="font-medium text-emerald-600">0.5R below peak ↓ (tighter)</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Time Exit Threshold:</span>
                  <span className="font-medium text-emerald-600">0.4R minimum ↓ (earlier)</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">Universe Filter:</span>
                  <span className="font-medium text-emerald-600">Top 20 promoted tickers only</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Profile:</span>
                  <span className="font-medium text-emerald-600">Aggressive profit protection</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              <strong>V2 Strategy:</strong> Locks in profits faster with tighter trailing stops,
              exits sideways trades earlier, and focuses on highest-quality tickers. Designed to
              reduce drawdowns and maximize profit capture while filtering out low-quality signals.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Engine Versioning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>PRIMARY:</strong> The live engine executing real trades with real capital. Only
            one PRIMARY engine can be active at a time per engine key.
          </p>
          <p>
            <strong>SHADOW:</strong> Virtual engines running in parallel using separate virtual
            portfolios (engine_* tables). These test new strategies without risking real capital.
          </p>
          <p className="text-muted-foreground">
            Shadow engines with consistently superior metrics can be promoted to PRIMARY after
            validation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
