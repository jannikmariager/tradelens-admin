import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { KPITile } from '@/components/admin/kpi-tile'
import { formatDistanceToNow } from 'date-fns'

async function getSignalStats() {
  const supabase = await createAdminClient()

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Get signals generated today
  const { count: signalsToday } = await supabase
    .from('ai_signals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo)

  // Get average confidence score
  const { data: signalsData } = await supabase
    .from('ai_signals')
    .select('confidence_score, signal_type')
    .gte('created_at', oneDayAgo)

  const avgConfidence = signalsData?.length
    ? signalsData.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / signalsData.length
    : 0

  // Get signal type breakdown
  const buySignals = signalsData?.filter(s => s.signal_type === 'buy').length || 0
  const sellSignals = signalsData?.filter(s => s.signal_type === 'sell').length || 0

  // Get recent signals
  const { data: recentSignals } = await supabase
    .from('ai_signals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return {
    signalsToday: signalsToday || 0,
    avgConfidence,
    buySignals,
    sellSignals,
    recentSignals: recentSignals || [],
  }
}

export default async function SignalsPage() {
  const stats = await getSignalStats()

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

      {/* Signals Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Signals</CardTitle>
          <CardDescription>Latest AI-generated trading signals</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead className="text-slate-300">Symbol</TableHead>
                <TableHead className="text-slate-300">Signal</TableHead>
                <TableHead className="text-slate-300">Timeframe</TableHead>
                <TableHead className="text-slate-300 text-right">Confidence</TableHead>
                <TableHead className="text-slate-300 text-right">Risk</TableHead>
                <TableHead className="text-slate-300">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentSignals.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">
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
