import { Card, CardContent } from "@/components/ui/card";
import { AdminPageHeader } from "@/layouts/AdminLayout";

export function AdminPlaceholderPage({ title, description, endpoints }: { title: string; description: string; endpoints: string[] }) {
  return (
    <section>
      <AdminPageHeader description={description} title={title} />
      <Card className="mt-6">
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground">
            This admin screen is ready for UI integration, but the backend endpoints are not available yet.
            See <span className="font-medium text-foreground">ADMIN_TODO.md</span> for the implementation checklist.
          </p>
          <div className="mt-5 overflow-x-auto rounded-md border">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Needed endpoint</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint) => (
                  <tr className="border-t" key={endpoint}>
                    <td className="px-4 py-3 font-mono">{endpoint}</td>
                    <td className="px-4 py-3 text-muted-foreground">Pending backend</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
