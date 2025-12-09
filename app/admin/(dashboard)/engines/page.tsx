import { EngineEvolutionDashboard } from '@/components/admin/engines/EngineEvolutionDashboard';
import { QueryProvider } from '@/components/providers/query-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchAllVariantResults, fetchVariantAggregate } from '@/lib/server/engineVariantQueries';
import { rankVariants, type RankedVariantRow, type VariantAggregateRow } from '@/lib/server/variantRanking';
import { VariantDashboardClient } from '@/components/admin/engines/VariantDashboardClient';

export default async function EnginesDashboardPage() {
  const [aggregateRaw, allRuns] = await Promise.all([
    fetchVariantAggregate(),
    fetchAllVariantResults(),
  ]);

  const aggregate = (aggregateRaw as VariantAggregateRow[]) || [];
  const ranked: RankedVariantRow[] = rankVariants(aggregate);

  return (
    <QueryProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Engines</h1>
          <p className="text-slate-400 mt-1">
            Compare engine versions across tickers, metrics, and timeframes.
          </p>
        </div>

        <Tabs defaultValue="versions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="versions">Engine versions</TabsTrigger>
            <TabsTrigger value="variants">Filter variants (V7.x)</TabsTrigger>
          </TabsList>
          <TabsContent value="versions" className="space-y-4">
            <EngineEvolutionDashboard />
          </TabsContent>
          <TabsContent value="variants" className="space-y-4">
            <VariantDashboardClient aggregates={aggregate} ranked={ranked} runs={allRuns} />
          </TabsContent>
        </Tabs>
      </div>
    </QueryProvider>
  );
}
