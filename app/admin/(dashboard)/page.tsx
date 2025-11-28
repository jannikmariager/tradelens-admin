import { createAdminClient } from '@/lib/supabase/server'
import { KPITile } from '@/components/admin/kpi-tile'
import { Users, DollarSign, TrendingUp, AlertTriangle, Cpu, Database } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

async function getDashboardStats() {
  const supabase = await createAdminClient()

  // Get user counts
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Get users from last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: newUsersToday } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo)

  // Get AI token usage today
  const { data: aiTokensToday } = await supabase
    .from('ai_token_usage')
    .select('total_cost_usd')
    .gte('created_at', oneDayAgo)

  const aiCostToday = aiTokensToday?.reduce((sum, row) => sum + (row.total_cost_usd || 0), 0) || 0

  // Get system alerts today
  const { count: alertsToday } = await supabase
    .from('system_alerts')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', oneDayAgo)
    .eq('resolved', false)

  // Get crashes today
  const { count: crashesToday } = await supabase
    .from('crashlogs')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', oneDayAgo)

  // Get data provider costs today
  const { data: dataCostsToday } = await supabase
    .from('data_source_costs')
    .select('cost_usd')
    .gte('timestamp', oneDayAgo)

  const dataProviderCostToday = dataCostsToday?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0

  return {
    totalUsers: totalUsers || 0,
    newUsersToday: newUsersToday || 0,
    aiCostToday,
    alertsToday: alertsToday || 0,
    crashesToday: crashesToday || 0,
    dataProviderCostToday,
  }
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Overview of TradeLens AI system metrics
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KPITile
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={{ value: 12, label: 'vs last week', isPositive: true }}
        />

        <KPITile
          title="New Users (24h)"
          value={stats.newUsersToday.toLocaleString()}
          icon={TrendingUp}
        />

        <KPITile
          title="AI Cost (Today)"
          value={`$${stats.aiCostToday.toFixed(2)}`}
          icon={Cpu}
          trend={{ value: -8, label: 'vs yesterday', isPositive: true }}
        />

        <KPITile
          title="Data Provider Cost"
          value={`$${stats.dataProviderCostToday.toFixed(2)}`}
          icon={Database}
        />

        <KPITile
          title="Active Alerts"
          value={stats.alertsToday}
          icon={AlertTriangle}
        />

        <KPITile
          title="Crashes (24h)"
          value={stats.crashesToday}
          icon={AlertTriangle}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">User Growth</CardTitle>
            <CardDescription>New users over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-500">
              Chart placeholder - Integrate Recharts
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend</CardTitle>
            <CardDescription>MRR over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-slate-500">
              Chart placeholder - Stripe integration
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription>Latest system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-slate-400 text-sm">
              Activity feed will be implemented with real-time data
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
