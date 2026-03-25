import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { listAuditLogs } from '@/lib/api/adminApi';
import { formatDateTime } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn:  () => listAuditLogs({ page, per_page: 20 }),
    keepPreviousData: true,
  });

  return (
    <AdminLayout title="Audit Log">
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Waktu</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aktor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Deskripsi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{log.actor_type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-700">{log.action}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{log.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                {data.total} log · Halaman {data.page} dari {data.total_pages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page <= 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.total_pages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
