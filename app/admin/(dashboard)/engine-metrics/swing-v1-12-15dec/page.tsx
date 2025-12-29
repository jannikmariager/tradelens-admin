'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EngineTrade {
  ticker: string | null;
  side: 'LONG' | 'SHORT' | null;
  entry_price: number | null;
  exit_price: number | null;
  entry_timestamp: string | null;
  exit_timestamp: string | null;
  realized_pnl_dollars: number | null;
  realized_pnl_r: number | null;
}

interface EngineMetric {
  engine_version: string;
  run_mode: 'PRIMARY' | 'SHADOW';
  is_enabled: boolean;
  total_trades: number;
  winners: number;
  losers: number;
  win_rate: number;
  total_pnl: number;
  avg_r: number;
  max_drawdown: number;
  current_equity: number;
  net_return: number;
  recent_trades?: EngineTrade[];
  display_label?: string;
}

export default function SwingV1DiagnosticsPage() {
  const [engine, setEngine] = useState<EngineMetric | null>(null);
  const [allTrades, setAllTrades] = useState<EngineTrade[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/engine-metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        
        const shadowEngines = (data.metrics || []).filter(
          (m: EngineMetric) => m.run_mode === 'SHADOW' && m.engine_version === 'SWING_V1_12_15DEC'
        );
        
        if (shadowEngines.length === 0) {
          throw new Error('Engine not found');
        }
        
        setEngine(shadowEngines[0]);
        setAllTrades(shadowEngines[0].recent_trades || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Engine Metrics</h1><p className="text-muted-foreground mt-2">Loading...</p></div></div>;
  }

  if (error || !engine) {
    return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Engine Metrics</h1><p className="text-red-600 mt-2">Error: {error}</p></div></div>;
  }

  const recentTrades = (engine.recent_trades || []).slice(0, 25);

  const tradesByDay: { [key: string]: EngineTrade[] } = {};
  allTrades.forEach(trade => {
    if (trade.exit_timestamp) {
      const day = new Date(trade.exit_timestamp).toLocaleDateString();
      if (!tradesByDay[day]) tradesByDay[day] = [];
      tradesByDay[day].push(trade);
    }
  });

  const last7Days = Object.keys(tradesByDay)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 7);

  const toggleDay = (day: string) => {
    const newExpanded = new Set(expandedDays);
    newExpanded.has(day) ? newExpanded.delete(day) : newExpanded.add(day);
    setExpandedDays(newExpanded);
  };

  const TradesTable = ({ trades }: { trades: EngineTrade[] }) => {
    const sorted = [...trades].sort((a, b) => 
      Number(b.realized_pnl_dollars ?? 0) - Number(a.realized_pnl_dollars ?? 0)
    );

    return (
      <Table className="text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-16">Ticker</TableHead>
            <TableHead className="w-12">Side</TableHead>
            <TableHead className="text-right">Entry</TableHead>
            <TableHead className="text-right">Exit</TableHead>
            <TableHead className="text-right">PnL $</TableHead>
            <TableHead className="text-right">R</TableHead>
            <TableHead className="text-xs">Closed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((trade, idx) => {
            const pnl = Number(trade.realized_pnl_dollars ?? 0);
            const isWinner = pnl >= 0;
            return (
              <TableRow key={idx} className={isWinner ? 'bg-green-50/30' : 'bg-red-50/30'}>
                <TableCell className="font-semibold">{trade.ticker || '—'}</TableCell>
                <TableCell>
                  <Badge variant={trade.side === 'LONG' ? 'default' : 'secondary'} className="text-xs">
                    {trade.side || '—'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">${trade.entry_price?.toFixed(2) ?? '—'}</TableCell>
                <TableCell className="text-right font-mono text-xs">${trade.exit_price?.toFixed(2) ?? '—'}</TableCell>
                <TableCell className={`text-right font-mono font-semibold ${isWinner ? 'text-green-700' : 'text-red-700'}`}>
                  {isWinner ? '+' : ''}{pnl.toFixed(2)}
                </TableCell>
                <TableCell className={`text-right font-mono font-semibold ${Number(trade.realized_pnl_r) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {Number(trade.realized_pnl_r ?? 0).toFixed(2)}R
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {trade.exit_timestamp ? new Date(trade.exit_timestamp).toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SWING_V1_12_15DEC</h1>
        <p className="text-muted-foreground mt-2">Shadow engine - swing trading diagnostics baseline</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engine.win_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{engine.winners}W / {engine.losers}L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg R</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${engine.avg_r >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {engine.avg_r.toFixed(2)}R
            </div>
            <p className="text-xs text-muted-foreground">{engine.total_trades} trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${engine.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${engine.total_pnl.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">{engine.net_return.toFixed(2)}% return</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${engine.current_equity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Max DD: -{engine.max_drawdown.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Last 25 Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades (Last 25)</CardTitle>
          <CardDescription>Most recent closed trades on this engine</CardDescription>
        </CardHeader>
        <CardContent>
          <TradesTable trades={recentTrades} />
        </CardContent>
      </Card>

      {/* Last 7 Days Expandable */}
      <Card>
        <CardHeader>
          <CardTitle>Last 7 Days</CardTitle>
          <CardDescription>Daily breakdown of trades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {last7Days.length === 0 ? (
            <p className="text-muted-foreground">No trades in last 7 days</p>
          ) : (
            last7Days.map(day => {
              const dayTrades = tradesByDay[day];
              const dayWins = dayTrades.filter(t => Number(t.realized_pnl_dollars ?? 0) >= 0).length;
              const dayPnL = dayTrades.reduce((sum, t) => sum + Number(t.realized_pnl_dollars ?? 0), 0);
              const isExpanded = expandedDays.has(day);

              return (
                <div key={day}>
                  <button
                    onClick={() => toggleDay(day)}
                    className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 text-sm">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span className="font-medium">{day}</span>
                      <span className="text-muted-foreground">{dayTrades.length} trades</span>
                      <span className={dayPnL >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        {dayPnL >= 0 ? '+' : ''} ${dayPnL.toFixed(2)}
                      </span>
                      <Badge variant="outline" className="text-xs">{dayWins}W / {dayTrades.length - dayWins}L</Badge>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-2 pl-4 border-l-2 border-muted">
                      <TradesTable trades={dayTrades} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
