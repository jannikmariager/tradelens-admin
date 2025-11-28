import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users as UsersIcon, TrendingUp } from 'lucide-react'
import { KPITile } from '@/components/admin/kpi-tile'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

async function getUsers() {
  const supabase = await createAdminClient()

  // Get total user count
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  // Get users from last 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: newUsersToday } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo)

  // Get recent users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching users:', error)
    return { totalUsers: 0, newUsersToday: 0, users: [] }
  }

  return {
    totalUsers: totalUsers || 0,
    newUsersToday: newUsersToday || 0,
    users: users || [],
  }
}

export default async function UsersPage() {
  const { totalUsers, newUsersToday, users } = await getUsers()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <p className="text-slate-400 mt-1">Manage user accounts and subscriptions</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2">
        <KPITile
          title="Total Users"
          value={totalUsers.toLocaleString()}
          icon={UsersIcon}
          trend={{ value: 12, label: 'vs last week', isPositive: true }}
        />

        <KPITile
          title="New Users (24h)"
          value={newUsersToday.toLocaleString()}
          icon={TrendingUp}
        />
      </div>

      {/* Users Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Users</CardTitle>
          <CardDescription>Latest user signups and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead className="text-slate-300">Email</TableHead>
                <TableHead className="text-slate-300">Role</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={4} className="text-center text-slate-400 py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: any) => (
                  <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-white font-medium">
                      {user.email || 'No email'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className={
                          user.role === 'admin'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : user.role === 'pro'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : user.role === 'premium'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-slate-700 text-slate-300'
                        }
                      >
                        {user.role || 'user'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {user.created_at
                        ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
                          View
                        </Button>
                      </Link>
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
