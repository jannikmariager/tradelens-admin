import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { KPITile } from '@/components/admin/kpi-tile'
import { formatDistanceToNow } from 'date-fns'
import { TradingStyleFilter } from '@/components/admin/trading-style-filter'

async function getSignalStats(tradingStyleFilter?: string | null) {
  const supabase = await createAdminClient()

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Get signals generated today
  let todayQuery = supabase
    .from('ai_signals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo)
  
  if (tradingStyleFilter && tradingStyleFilter !== 'all') {
    todayQuery = todayQuery.eq('trading_style', tradingStyleFilter)
  }
  
  const { count: signalsToday } = await todayQuery

  // Get average confidence score
  let confidenceQuery = supabase
    .from('ai_signals')
    .select('confidence_score, signal_type, trading_style')
    .gte('created_at', oneDayAgo)
  
  if (tradingStyleFilter && tradingStyleFilter !== 'all') {
    confidenceQuery = confidenceQuery.eq('trading_style', tradingStyleFilter)
  }
  
  const { data: signalsData } = await confidenceQuery

  const avgConfidence = signalsData?.length
    ? signalsData.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / signalsData.length
    : 0

  // Get signal type breakdown
  const buySignals = signalsData?.filter(s => s.signal_type === 'buy').length || 0
  const sellSignals = signalsData?.filter(s => s.signal_type === 'sell').length || 0
  
  // Get trading style breakdown
  const daytrade = signalsData?.filter(s => s.trading_style === 'daytrade').length || 0
  const swing = signalsData?.filter(s => s.trading_style === 'swing').length || 0
  const invest = signalsData?.filter(s => s.trading_style === 'invest').length || 0

  // Get recent signals
  let recentQuery = supabase
    .from('ai_signals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  
  if (tradingStyleFilter && tradingStyleFilter !== 'all') {
    recentQuery = recentQuery.eq('trading_style', tradingStyleFilter)
  }
  
  const { data: recentSignals } = await recentQuery

  return {
    signalsToday: signalsToday || 0,
    avgConfidence,
    buySignals,
    sellSignals,
    daytrade,
    swing,
    invest,
    recentSignals: recentSignals || [],
  }
}

export default async function SignalsPage({
  searchParams,
}: {
  searchParams: { tradingStyle?: string }
}) {
  const stats = await getSignalStats(searchParams.tradingStyle)

  const getSignalColor = (signalType: string) => {
    if (signalType === 'buy') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    if (signalType === 'sell') return 'bg-red-500/10 text-red-400 border-red-500/20'
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  }

  const getSignalIcon = (signalType: string) => {
    if (signalType === 'buy') return TrendingUp
    if (signalType === 'sell') return TrendingDown
    return Activity
  }
  
  const getTradingStyleBadge = (style: string | null) => {
    if (!style) style = 'swing'
    
    switch (style) {
      case 'daytrade':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
            ⚡ DT
          </Badge>
        )
      case 'swing':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            🔁 SW
          </Badge>
        )
      case 'invest':
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
            🏦 INV
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20">
            {style}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Trading Signals</h1>
        <p className="text-slate-400 mt-1">AI-generated trading signals and performance</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPITile
          title="Signals Today"
          value={stats.signalsToday}
          icon={BarChart3}
        />

        <KPITile
          title="Avg Confidence"
          value={`${stats.avgConfidence.toFixed(1)}%`}
          icon={Activity}
        />

        <KPITile
          title="Buy Signals"
          value={stats.buySignals}
          icon={TrendingUp}
        />

        <KPITile
          title="Sell Signals"
          value={stats.sellSignals}
          icon={TrendingDown}
        />
      </div>
      
      {/* Trading Style Breakdown */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Trading Style Breakdown</CardTitle>
          <CardDescription>Signal distribution by trading style (last 24h)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <div>
                <div className="text-sm text-slate-400">Daytrade</div>
                <div className="text-2xl font-bold text-white">{stats.daytrade}</div>
              </div>
              <div className="text-red-400 text-3xl">⚡</div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div>
                <div className="text-sm text-slate-400">Swingtrade</div>
                <div className="text-2xl font-bold text-white">{stats.swing}</div>
              </div>
              <div className="text-blue-400 text-3xl">🔁</div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <div>
                <div className="text-sm text-slate-400">Investing</div>
                <div className="text-2xl font-bold text-white">{stats.invest}</div>
              </div>
              <div className="text-purple-400 text-3xl">🏦</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signals Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Signals</CardTitle>
              <CardDescription>Latest AI-generated trading signals</CardDescription>
            </div>
            <TradingStyleFilter currentStyle={searchParams.tradingStyle} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead className="text-slate-300">Symbol</TableHead>
                <TableHead className="text-slate-300">Signal</TableHead>
                <TableHead className="text-slate-300">Style</TableHead>
                <TableHead className="text-slate-300">Timeframe</TableHead>
                <TableHead className="text-slate-300 text-right">Confidence</TableHead>
                <TableHead className="text-slate-300 text-right">Risk</TableHead>
                <TableHead className="text-slate-300">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentSignals.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                    No signals found
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentSignals.map((signal: any) => {
                  const SignalIcon = getSignalIcon(signal.signal_type)
                  return (
                    <TableRow key={signal.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-white font-medium">
                        {signal.symbol}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getSignalColor(signal.signal_type)}>
                          <SignalIcon className="h-3 w-3 mr-1" />
                          {signal.signal_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getTradingStyleBadge(signal.trading_style)}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {signal.timeframe || '1h'}
                      </TableCell>
                      <TableCell className="text-right text-emerald-400 font-medium">
                        {signal.confidence_score?.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-yellow-400">
                        {signal.correction_risk?.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {signal.created_at
                          ? formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })
                          : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
