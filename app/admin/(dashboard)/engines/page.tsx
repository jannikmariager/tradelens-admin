import { EngineEvolutionDashboard } from '@/components/admin/engines/EngineEvolutionDashboard';
import { QueryProvider } from '@/components/providers/query-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchAllVariantResults, fetchVariantAggregate } from '@/lib/server/engineVariantQueries';
import { rankVariants, type RankedVariantRow, type VariantAggregateRow } from '@/lib/server/variantRanking';
import { VariantDashboardClient } from '@/components/admin/engines/VariantDashboardClient';
import { UniverseTab } from './UniverseTab';

interface PageProps {
  searchParams?: {
    engineVersion?: string;
  };
}

export default async function EnginesDashboardPage({ searchParams }: PageProps) {
  const [aggregateRaw, allRuns] = await Promise.all([
    fetchVariantAggregate(),
    fetchAllVariantResults(),
  ]);

  const engineVersion = searchParams?.engineVersion ?? 'v7.4';

  const aggregate = (aggregateRaw as VariantAggregateRow[]) || [];
  const ranked: RankedVariantRow[] = rankVariants(aggregate);

  return (
    <QueryProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Engine Performance</h1>
          <p className="text-muted-foreground mt-1">
            Compare engine versions, filter variants and manage universes.
          </p>
        </div>

        <Tabs defaultValue="versions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="versions">Engine versions</TabsTrigger>
            <TabsTrigger value="variants">Filter variants (V7.x)</TabsTrigger>
            <TabsTrigger value="day">⚡ Daytrade</TabsTrigger>
            <TabsTrigger value="swing">📈 Swing</TabsTrigger>
            <TabsTrigger value="invest">🎯 Investor</TabsTrigger>
          </TabsList>
          <TabsContent value="versions" className="space-y-4">
            <EngineEvolutionDashboard />
          </TabsContent>
          <TabsContent value="variants" className="space-y-4">
            <VariantDashboardClient aggregates={aggregate} ranked={ranked} runs={allRuns} />
          </TabsContent>
          <TabsContent value="day" className="space-y-4">
            <UniverseTab engineVersion={engineVersion} horizon="day" />
          </TabsContent>
          <TabsContent value="swing" className="space-y-4">
            <UniverseTab engineVersion={engineVersion} horizon="swing" />
          </TabsContent>
          <TabsContent value="invest" className="space-y-4">
            <UniverseTab engineVersion={engineVersion} horizon="invest" />
          </TabsContent>
        </Tabs>
      </div>
    </QueryProvider>
  );
}
