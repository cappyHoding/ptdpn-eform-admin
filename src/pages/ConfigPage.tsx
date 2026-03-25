import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { listConfig, updateConfig } from '@/lib/api/adminApi';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfigPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn:  listConfig,
  });

  const mutUpdate = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => updateConfig(key, value),
    onSuccess: () => {
      toast.success('Konfigurasi diperbarui');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['config'] });
    },
    onError: (err: any) => toast.error('Gagal', { description: err.message }),
  });

  const startEdit = (key: string, value: string) => {
    setEditing(key);
    setEditValue(value);
  };

  return (
    <AdminLayout title="Konfigurasi Sistem">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parameter Sistem</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-1/3">Parameter</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nilai</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : config && Object.entries(config).map(([key, value]) => (
                <tr key={key} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{key}</td>
                  <td className="px-4 py-3">
                    {editing === key ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-800">{value}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing === key ? (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600"
                          onClick={() => mutUpdate.mutate({ key, value: editValue })}
                          disabled={mutUpdate.isPending}>
                          {mutUpdate.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500"
                          onClick={() => setEditing(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-7 w-7"
                        onClick={() => startEdit(key, value)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
