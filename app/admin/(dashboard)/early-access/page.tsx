import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type EarlyAccessRow = { id: string; email: string; created_at: string };
type FoundingCircleRow = { id: string; email: string; status: string; created_at: string };

async function getData() {
  const [{ data: signups }, { data: applications }] = await Promise.all([
    supabaseAdmin
      .from("early_access_signups")
      .select("id, email, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("founding_circle_applications")
      .select("id, email, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return {
    signups: (signups as EarlyAccessRow[] | null) ?? [],
    applications: (applications as FoundingCircleRow[] | null) ?? [],
  };
}

export default async function EarlyAccessAdminPage() {
  const { signups, applications } = await getData();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Early access &amp; Founding Circle</h1>
        <p className="text-sm text-muted-foreground">
          Internal view of early access signups and Founding Circle applications. Data is read-only here;
          status updates should be done via SQL or a dedicated workflow.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Early access signups</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card/80">
          <table className="min-w-full text-xs">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Created at</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((row) => (
                <tr key={row.id} className="border-t border-border/60">
                  <td className="px-3 py-2 align-top">{row.email}</td>
                  <td className="px-3 py-2 align-top text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {signups.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={2}>
                    No early access signups yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Founding Circle applications</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-card/80">
          <table className="min-w-full text-xs">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-left font-medium">Created at</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((row) => (
                <tr key={row.id} className="border-t border-border/60">
                  <td className="px-3 py-2 align-top">{row.email}</td>
                  <td className="px-3 py-2 align-top">{row.status}</td>
                  <td className="px-3 py-2 align-top text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-muted-foreground" colSpan={3}>
                    No applications submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}