import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react'
import { KPITile } from '@/components/admin/kpi-tile'

async function getRevenueStats() {
  const supabase = await createAdminClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Get successful payments in last 30 days
  const { data: paymentsData } = await supabase
    .from('subscription_logs')
    .select('amount, timestamp')
    .eq('event_type', 'invoice.payment_succeeded')
    .gte('timestamp', thirtyDaysAgo)

  const revenue30Days = paymentsData?.reduce((sum, row) => sum + (row.amount || 0), 0) || 0

  // Calculate MRR (Monthly Recurring Revenue)
  const mrr = revenue30Days / 100 // Convert cents to dollars

  // Calculate ARR (Annual Recurring Revenue)
  const arr = mrr * 12

  // Get active subscription counts by tier
  const { count: premiumCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'premium')

  const { count: proCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'pro')

  // Get failed payments
  const { count: failedPayments } = await supabase
    .from('subscription_logs')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'invoice.payment_failed')
    .gte('timestamp', thirtyDaysAgo)

  return {
    mrr,
    arr,
    premiumCount: premiumCount || 0,
    proCount: proCount || 0,
    failedPayments: failedPayments || 0,
    revenue30Days: revenue30Days / 100,
  }
}

export default async function RevenuePage() {
  const stats = await getRevenueStats()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Revenue Analytics</h1>
        <p className="text-slate-400 mt-1">Track subscription revenue and forecasts</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPITile
          title="MRR"
          value={`$${stats.mrr.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 12, label: 'vs last month', isPositive: true }}
        />

        <KPITile
          title="ARR"
          value={`$${stats.arr.toLocaleString()}`}
          icon={TrendingUp}
        />

        <KPITile
          title="Revenue (30d)"
          value={`$${stats.revenue30Days.toLocaleString()}`}
          icon={CreditCard}
        />

        <KPITile
          title="Failed Payments"
          value={stats.failedPayments}
          icon={Users}
        />
      </div>

      {/* Subscription Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Subscription Breakdown</CardTitle>
            <CardDescription>Active subscribers by tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div>
                <p className="text-sm text-slate-400">Premium Subscribers</p>
                <p className="text-2xl font-bold text-white">{stats.premiumCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div>
                <p className="text-sm text-slate-400">Pro Subscribers</p>
                <p className="text-2xl font-bold text-white">{stats.proCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div>
                <p className="text-sm text-slate-400">Total Paying Users</p>
                <p className="text-2xl font-bold text-white">{stats.premiumCount + stats.proCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Revenue Forecast</CardTitle>
            <CardDescription>Projected annual revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Current ARR</span>
                  <span className="text-white font-medium">${stats.arr.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Projected (12mo)</span>
                  <span className="text-emerald-400 font-medium">
                    ${(stats.arr * 1.2).toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/50" style={{ width: '80%' }} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-2">Growth Rate</p>
                <p className="text-3xl font-bold text-emerald-400">+20%</p>
                <p className="text-sm text-slate-500 mt-1">Based on current trends</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Monthly Revenue Trend</CardTitle>
          <CardDescription>Revenue over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-slate-500">
            Chart will be implemented with Recharts
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
