import { createClient } from "@/lib/supabase/server"

export async function fetchAllVariantResults() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("engine_filter_performance")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchAllVariantResults error", error)
    throw error
  }

  return data ?? []
}

export async function fetchVariantAggregate() {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("variant_aggregate_metrics")

  if (error) {
    console.error("fetchVariantAggregate error", error)
    throw error
  }

  return data ?? []
}
