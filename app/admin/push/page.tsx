import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Users, TrendingUp, CheckCircle } from 'lucide-react'
import { KPITile } from '@/components/admin/kpi-tile'

export default function PushPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Push Notifications</h1>
        <p className="text-slate-400 mt-1">Send targeted push notifications to users</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPITile title="Sent Today" value="1,547" icon={Send} />
        <KPITile title="Delivery Rate" value="98.2%" icon={CheckCircle} />
        <KPITile title="Open Rate" value="42%" icon={TrendingUp} />
        <KPITile title="Active Devices" value="8,234" icon={Users} />
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Send Push Notification</CardTitle>
          <CardDescription>Broadcast message to app users</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300">Title</label>
              <Input
                placeholder="Market Alert"
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">Message</label>
              <Input
                placeholder="SPY broke above $450"
                className="mt-1 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">Audience</label>
              <select className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white">
                <option>All Users</option>
                <option>Premium Users</option>
                <option>Pro Users</option>
              </select>
            </div>

            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
