import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Bug, Smartphone, AlertTriangle, TrendingDown } from 'lucide-react'
import { KPITile } from '@/components/admin/kpi-tile'
import { formatDistanceToNow } from 'date-fns'

async function getCrashStats() {
  const supabase = await createAdminClient()

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Get crashes today
  const { count: crashesToday } = await supabase
    .from('crashlogs')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', oneDayAgo)

  // Get crashes by platform
  const { data: crashesData } = await supabase
    .from('crashlogs')
    .select('platform')
    .gte('timestamp', oneDayAgo)

  const iosCrashes = crashesData?.filter(c => c.platform === 'ios').length || 0
  const androidCrashes = crashesData?.filter(c => c.platform === 'android').length || 0

  // Get recent crashes
  const { data: recentCrashes } = await supabase
    .from('crashlogs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100)

  return {
    crashesToday: crashesToday || 0,
    iosCrashes,
    androidCrashes,
    recentCrashes: recentCrashes || [],
  }
}

export default async function CrashesPage() {
  const stats = await getCrashStats()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Crash Reports</h1>
        <p className="text-slate-400 mt-1">Monitor mobile app crashes and stability</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPITile
          title="Crashes Today"
          value={stats.crashesToday}
          icon={Bug}
          trend={{ value: -15, label: 'vs yesterday', isPositive: true }}
        />

        <KPITile
          title="iOS Crashes"
          value={stats.iosCrashes}
          icon={Smartphone}
        />

        <KPITile
          title="Android Crashes"
          value={stats.androidCrashes}
          icon={Smartphone}
        />

        <KPITile
          title="Crash Rate"
          value="0.02%"
          icon={TrendingDown}
        />
      </div>

      {/* Crashes Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Crashes</CardTitle>
          <CardDescription>Latest mobile app crash reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead className="text-slate-300">Platform</TableHead>
                <TableHead className="text-slate-300">Device</TableHead>
                <TableHead className="text-slate-300">OS Version</TableHead>
                <TableHead className="text-slate-300">Error</TableHead>
                <TableHead className="text-slate-300">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentCrashes.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                    No crashes found 🎉
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentCrashes.map((crash: any) => (
                  <TableRow key={crash.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          crash.platform === 'ios'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                        }
                      >
                        {crash.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">
                      {crash.device || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {crash.os_version || 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-400 max-w-md">
                      <div className="truncate">{crash.error_message || 'No message'}</div>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {crash.timestamp
                        ? formatDistanceToNow(new Date(crash.timestamp), { addSuffix: true })
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
