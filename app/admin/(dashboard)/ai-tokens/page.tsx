import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Cpu, DollarSign, TrendingUp, Zap } from 'lucide-react'
import { KPITile } from '@/components/admin/kpi-tile'
import { formatDistanceToNow } from 'date-fns'

async function getAITokenStats() {
  const supabase = await createAdminClient()

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get today's usage
  const { data: todayData } = await supabase
    .from('ai_token_usage')
    .select('tokens_input, tokens_output, total_cost_usd')
    .gte('created_at', oneDayAgo)

  const tokensToday = todayData?.reduce(
    (sum, row) => sum + (row.tokens_input || 0) + (row.tokens_output || 0),
    0
  ) || 0

  const costToday = todayData?.reduce((sum, row) => sum + (row.total_cost_usd || 0), 0) || 0

  // Get 7-day usage
  const { data: weekData } = await supabase
    .from('ai_token_usage')
    .select('tokens_input, tokens_output, total_cost_usd')
    .gte('created_at', sevenDaysAgo)

  const tokensWeek = weekData?.reduce(
    (sum, row) => sum + (row.tokens_input || 0) + (row.tokens_output || 0),
    0
  ) || 0

  const costWeek = weekData?.reduce((sum, row) => sum + (row.total_cost_usd || 0), 0) || 0

  // Get request count today
  const { count: requestsToday } = await supabase
    .from('ai_token_usage')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo)

  // Get recent usage
  const { data: recentUsage } = await supabase
    .from('ai_token_usage')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return {
    tokensToday,
    costToday,
    tokensWeek,
    costWeek,
    requestsToday: requestsToday || 0,
    recentUsage: recentUsage || [],
  }
}

export default async function AITokensPage() {
  const stats = await getAITokenStats()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">AI Token Usage</h1>
        <p className="text-slate-400 mt-1">Monitor AI model usage and costs</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPITile
          title="Tokens Today"
          value={stats.tokensToday.toLocaleString()}
          icon={Cpu}
        />

        <KPITile
          title="Cost Today"
          value={`$${stats.costToday.toFixed(2)}`}
          icon={DollarSign}
          trend={{ value: -8, label: 'vs yesterday', isPositive: true }}
        />

        <KPITile
          title="Tokens (7d)"
          value={stats.tokensWeek.toLocaleString()}
          icon={TrendingUp}
        />

        <KPITile
          title="Requests Today"
          value={stats.requestsToday.toLocaleString()}
          icon={Zap}
        />
      </div>

      {/* Usage Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Token Usage</CardTitle>
          <CardDescription>Latest AI model requests and costs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead className="text-slate-300">Model</TableHead>
                <TableHead className="text-slate-300">Function</TableHead>
                <TableHead className="text-slate-300 text-right">Input</TableHead>
                <TableHead className="text-slate-300 text-right">Output</TableHead>
                <TableHead className="text-slate-300 text-right">Cost</TableHead>
                <TableHead className="text-slate-300">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentUsage.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                    No AI token usage found
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentUsage.map((usage: any) => (
                  <TableRow key={usage.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          usage.model_name?.includes('gpt-4o-mini')
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        }
                      >
                        {usage.model_name || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {usage.origin_function || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {(usage.tokens_input || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {(usage.tokens_output || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-emerald-400 font-medium">
                      ${(usage.total_cost_usd || 0).toFixed(4)}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {usage.created_at
                        ? formatDistanceToNow(new Date(usage.created_at), { addSuffix: true })
                        : 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
