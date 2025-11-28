import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Users, TrendingUp, Activity } from 'lucide-react'
import { KPITile } from '@/components/admin/kpi-tile'

export default function DiscordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Discord Community</h1>
        <p className="text-slate-400 mt-1">Monitor community engagement and activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPITile title="Total Members" value="1,234" icon={Users} trend={{ value: 8, label: 'this week', isPositive: true }} />
        <KPITile title="Active Today" value="487" icon={Activity} />
        <KPITile title="Messages Today" value="1,052" icon={MessageSquare} />
        <KPITile title="New Joins (7d)" value="89" icon={TrendingUp} />
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Discord Integration</CardTitle>
          <CardDescription>Connect Discord bot to display real-time stats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Discord integration coming soon</p>
            <p className="text-sm text-slate-500 mt-2">Add DISCORD_BOT_TOKEN to environment variables</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
