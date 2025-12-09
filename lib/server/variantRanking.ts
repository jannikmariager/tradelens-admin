export interface VariantAggregateRow {
  filter_variant: string
  engine_version: string
  avg_win_rate: number | null
  avg_expectancy: number | null
  avg_avg_rr: number | null
  avg_total_return: number | null
  avg_drawdown: number | null
  avg_sharpe: number | null
  signals_per_ticker: number | null
  trades_per_ticker: number | null
}

export interface RankedVariantRow extends VariantAggregateRow {
  score: number
}

export function scoreVariant(v: VariantAggregateRow): number {
  const win = v.avg_win_rate ?? 0
  const exp = v.avg_expectancy ?? 0
  const rr = v.avg_avg_rr ?? 0
  const sharpe = v.avg_sharpe ?? 0
  const dd = v.avg_drawdown ?? 50
  const trades = v.trades_per_ticker ?? 0

  return (
    win * 0.25 +
    exp * 0.25 +
    rr * 0.15 +
    sharpe * 0.2 -
    dd * 0.1 +
    Math.min(trades / 30, 0.05)
  )
}

export function rankVariants(list: VariantAggregateRow[]): RankedVariantRow[] {
  return list
    .map((v) => ({ ...v, score: scoreVariant(v) }))
    .sort((a, b) => b.score - a.score)
}
