import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const STARTING_EQUITY = 100000

async function fetchJournalTotals(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: closedTrades, error: closedTradesError } = await supabase
    .from('live_trades')
    .select('realized_pnl_dollars')
    .eq('strategy', 'SWING')
    .not('exit_timestamp', 'is', null)

  if (closedTradesError) throw closedTradesError

  const { data: openPositions, error: openPositionsError } = await supabase
    .from('live_positions')
    .select('unrealized_pnl_dollars')
    .eq('strategy', 'SWING')

  if (openPositionsError) throw openPositionsError

  const sinceInceptionRealized = (closedTrades || []).reduce(
    (sum, trade) => sum + Number(trade.realized_pnl_dollars ?? 0),
    0,
  )
  const currentUnrealized = (openPositions || []).reduce(
    (sum, pos) => sum + Number(pos.unrealized_pnl_dollars ?? 0),
    0,
  )

  const currentEquity = STARTING_EQUITY + sinceInceptionRealized + currentUnrealized
  const netReturn = ((currentEquity - STARTING_EQUITY) / STARTING_EQUITY) * 100

  return {
    starting_equity: STARTING_EQUITY,
    current_equity: currentEquity,
    since_inception_realized_pnl: sinceInceptionRealized,
    current_unrealized_pnl: currentUnrealized,
    net_return_pct: netReturn,
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all engine versions (PRIMARY and SHADOW)
    const { data: engineVersions, error: versionsError } = await supabase
      .from('engine_versions')
      .select('*')
      .order('created_at', { ascending: false })

    if (versionsError) {
      console.error('Error fetching engine_versions:', versionsError)
      return NextResponse.json({ error: 'Failed to fetch engine versions' }, { status: 500 })
    }

    const metrics: any[] = []

    for (const version of engineVersions || []) {
      const isPrimary = version.run_mode === 'PRIMARY'

      let tradeData, portfolioData

      if (isPrimary) {
        // PRIMARY: get data from live_* tables
        const { data: trades, error: tradesError } = await supabase
          .from('live_trades')
          .select(
            'ticker, side, entry_timestamp, entry_price, exit_timestamp, exit_price, realized_pnl_dollars, realized_pnl_r',
          )
          .eq('engine_version', version.engine_version)
          .order('exit_timestamp', { ascending: false })

        if (tradesError) {
          console.error(`Error fetching live_trades for ${version.engine_version}:`, tradesError)
          continue
        }

        tradeData = (trades || []).map((trade) => ({
          ticker: trade.ticker,
          side: trade.side,
          entry_timestamp: trade.entry_timestamp,
          entry_price: trade.entry_price,
          exit_timestamp: trade.exit_timestamp,
          exit_price: trade.exit_price,
          realized_pnl_dollars: trade.realized_pnl_dollars,
          realized_pnl_r: trade.realized_pnl_r,
        }))

        // Get historical portfolio snapshots for equity curve
        const { data: portfolio, error: portfolioError } = await supabase
          .from('live_portfolio_state')
          .select('equity_dollars, timestamp')
          .eq('strategy', 'SWING')
          .order('timestamp', { ascending: false })
          .limit(1000) // Last 1000 snapshots (plenty for historical curve)

        if (portfolioError) {
          console.error(`Error fetching live_portfolio_state:`, portfolioError)
          continue
        }

        // Reverse to get chronological order for equity curve
        portfolioData = (portfolio || []).reverse()
      } else {
        // SHADOW: get data from engine_* tables
        const { data: trades, error: tradesError } = await supabase
          .from('engine_trades')
          .select('ticker, side, entry_price, exit_price, realized_pnl, realized_r, closed_at, opened_at')
          .eq('engine_key', version.engine_key)
          .eq('engine_version', version.engine_version)
          .eq('run_mode', version.run_mode)
          .order('closed_at', { ascending: false })

        if (tradesError) {
          console.error(`Error fetching engine_trades for ${version.engine_version}:`, tradesError)
          continue
        }

        tradeData = (trades || []).map((t: any) => ({
          ticker: t.ticker,
          side: t.side,
          entry_price: t.entry_price,
          exit_price: t.exit_price,
          realized_pnl_dollars: t.realized_pnl,
          realized_pnl_r: t.realized_r,
          exit_timestamp: t.closed_at,
          entry_timestamp: t.opened_at,
        }))

        const { data: portfolio, error: portfolioError } = await supabase
          .from('engine_portfolios')
          .select('equity, updated_at')
          .eq('engine_key', version.engine_key)
          .eq('engine_version', version.engine_version)
          .eq('run_mode', version.run_mode)

        if (portfolioError) {
          console.error(`Error fetching engine_portfolios for ${version.engine_version}:`, portfolioError)
          continue
        }

        // For shadow, we only have current snapshot, not historical
        portfolioData = portfolio?.[0]
          ? [
              {
                equity_dollars: portfolio[0].equity,
                timestamp: portfolio[0].updated_at,
              },
            ]
          : []
      }

      // Calculate metrics
      const totalTrades = tradeData.length
      const winners = tradeData.filter((t: any) => (t.realized_pnl_dollars || 0) > 0).length
      const losers = tradeData.filter((t: any) => (t.realized_pnl_dollars || 0) < 0).length
      const winRate = totalTrades > 0 ? (winners / totalTrades) * 100 : 0

      const totalPnl = tradeData.reduce((sum: number, t: any) => sum + (t.realized_pnl_dollars || 0), 0)
      const avgR = tradeData.length > 0
        ? tradeData.reduce((sum: number, t: any) => sum + (t.realized_pnl_r || 0), 0) / tradeData.length
        : 0

      // Calculate max drawdown (simplified)
      let maxDrawdown = 0
      if (portfolioData.length > 0) {
        let peak = portfolioData[0]?.equity_dollars || 100000
        for (const snapshot of portfolioData) {
          const equity = snapshot.equity_dollars || 0
          if (equity > peak) {
            peak = equity
          } else {
            const drawdown = ((peak - equity) / peak) * 100
            if (drawdown > maxDrawdown) {
              maxDrawdown = drawdown
            }
          }
        }
      }

      // Current equity - use the most recent portfolio snapshot
      let currentEquity = 100000
      if (portfolioData.length > 0) {
        // Get the most recent snapshot
        const mostRecent = portfolioData[portfolioData.length - 1] as any
        currentEquity = mostRecent?.equity_dollars || mostRecent?.equity || 100000
      }

      const netReturn = ((currentEquity - 100000) / 100000) * 100

      const recentTrades = [...tradeData]
        .sort((a: any, b: any) => {
          const aTime = a.exit_timestamp ? new Date(a.exit_timestamp).getTime() : 0
          const bTime = b.exit_timestamp ? new Date(b.exit_timestamp).getTime() : 0
          return bTime - aTime
        })
        .slice(0, 10)

      // Fetch engine parameters if applicable
      let engineParams: any = {}
      
      if (version.engine_version === 'SCALP_V1_MICROEDGE') {
        const { data: params, error: paramsError } = await supabase
          .from('scalp_engine_config')
          .select('*')
          .eq('engine_version', version.engine_version)
          .single()

        if (!paramsError && params) {
          engineParams = {
            min_stop_distance_r: params.min_stop_distance_r,
            atr_stop_distance_multiple: params.atr_stop_distance_multiple,
            max_risk_pct_per_trade: params.max_risk_pct_per_trade,
            max_total_open_risk_pct: params.max_total_open_risk_pct,
            max_positions_per_ticker: params.max_positions_per_ticker,
            max_daily_loss_pct: params.max_daily_loss_pct,
            hard_max_positions: params.hard_max_positions,
          }
        }
      } else if (version.engine_version === 'SWING_V2_ROBUST' || version.engine_version === 'SWING_V1_12_15DEC') {
        // Fetch promoted tickers for SWING engines
        const { data: promotedTickers, error: tickersError } = await supabase
          .from('promoted_tickers')
          .select('ticker, avg_confidence, signal_count')
          .eq('engine_version', version.engine_version)
          .eq('is_promoted', true)
          .order('signal_count', { ascending: false })

        if (!tickersError && promotedTickers) {
          const tickerList = promotedTickers.map((t: any) => t.ticker).join(', ')
          engineParams = {
            promoted_tickers: tickerList,
            promoted_ticker_count: promotedTickers.length,
            strategy_type: version.engine_version === 'SWING_V2_ROBUST' ? 'Aggressive profit-locking' : 'Conservative baseline',
          }
          
          // Add V2-specific parameters
          if (version.engine_version === 'SWING_V2_ROBUST') {
            engineParams.tp_activation = '1.0R (faster)'
            engineParams.trailing_distance = '0.5R (tighter)'
            engineParams.time_exit = '0.4R (earlier)'
            engineParams.overnight_hygiene = 'Enabled'
            engineParams.hygiene_actions = '50% close at market, SL to BE, ATR-based trail'
          }
        }
      }

      metrics.push({
        engine_version: version.engine_version,
        engine_key: version.engine_key,
        run_mode: version.run_mode,
        is_enabled: version.is_enabled,
        is_user_visible: version.is_user_visible,
        started_at: version.started_at,
        stopped_at: version.stopped_at,
        total_trades: totalTrades,
        winners,
        losers,
        win_rate: winRate,
        total_pnl: totalPnl,
        avg_r: avgR,
        max_drawdown: maxDrawdown,
        current_equity: currentEquity,
        net_return: netReturn,
        equity_curve: portfolioData.map((p: any) => ({
          timestamp: p.timestamp || p.updated_at,
          equity: p.equity_dollars || p.equity || 0,
        })),
        recent_trades: recentTrades,
        display_label: version.notes ?? version.engine_version,
        engine_params: engineParams,
      })
    }
    const journalTotals = await fetchJournalTotals(supabase)

    return NextResponse.json({ metrics, journal_totals: journalTotals }, { status: 200 })
  } catch (error) {
    console.error('Error in engine-metrics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
