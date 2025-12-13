// Server-only functions for universe data loading
import { createAdminClient } from '@/lib/supabase/server'
import type { TickerStats } from './universeRules'

export * from './universeRules'

export type Horizon = 'day' | 'swing' | 'invest'

export function getUniverseName(horizon: Horizon): string {
  return `performance_${horizon}`
}

async function getSupabase() {
  const supabase = await createAdminClient()
  return supabase
}

export async function loadTickerStats(
  engineVersion: string,
  horizon: Horizon | null = null
): Promise<TickerStats[]> {
  const supabase = await getSupabase()

  const { data, error } = await supabase.rpc('engine_ticker_stats', {
    engine_version_arg: engineVersion,
    horizon_arg: horizon,
  })

  if (error) {
    console.error('[admin/loadTickerStats] rpc error', error)
    throw error
  }

  return (data || []) as TickerStats[]
}

export async function loadUniverse(name: string): Promise<string[]> {
  const supabase = await getSupabase()

  const { data, error } = await supabase
    .from('engine_universe')
    .select('tickers')
    .eq('universe_name', name)
    .maybeSingle()

  if (error) {
    console.error('[admin/loadUniverse] error', error)
    throw error
  }

  return ((data?.tickers as string[]) || []).map((t) => t.toUpperCase())
}
