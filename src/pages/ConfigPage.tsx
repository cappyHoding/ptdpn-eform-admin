import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { listConfig, updateConfig, SystemConfig } from '@/lib/api/adminApi';
import { Pencil, Check, X, Loader2, Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Beberapa config mungkin berisi nilai sensitif — sembunyikan
const SENSITIVE_KEYS = ['jwt_secret', 'api_key', 'webhook_secret', 'vida_api_key'];

function isSensitive(key: string): boolean {
  return SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k));
}

// ─── Config Row Component ─────────────────────────────────────────────────────

interface ConfigRowProps {
  cfg: SystemConfig;
  isEditing: boolean;
  editValue: string;
  isSaving: boolean;
  onEdit: (key: string, value: string) => void;
  onSave: (key: string) => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}

function ConfigRow({
  cfg, isEditing, editValue, isSaving,
  onEdit, onSave, onCancel, onChange,
}: ConfigRowProps) {
  const [showValue, setShowValue] = useState(false);
  const sensitive = isSensitive(cfg.config_key);
  const displayValue = sensitive && !showValue && !isEditing
    ? '••••••••••••'
    : cfg.config_value;

  return (
    <tr className="border-b hover:bg-gray-50 align-top">
      {/* Key */}
      <td className="px-4 py-3 w-72">
        <div className="flex items-start gap-2">
          <span className="font-mono text-xs text-gray-800 break-all">{cfg.config_key}</span>
          {cfg.is_public && (
            <Badge variant="outline" className="text-[10px] shrink-0 h-4 px-1">
              public
            </Badge>
          )}
        </div>
        {cfg.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {cfg.description}
          </p>
        )}
      </td>

      {/* Value */}
      <td className="px-4 py-3">
        {isEditing ? (
          <Input
            value={editValue}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-sm font-mono"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSave(cfg.config_key);
              if (e.key === 'Escape') onCancel();
            }}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono break-all ${sensitive && !showValue ? 'tracking-widest text-gray-400' : 'text-gray-800'}`}>
              {displayValue}
            </span>
            {sensitive && (
              <button
                onClick={() => setShowValue((v) => !v)}
                className="shrink-0 text-gray-400 hover:text-gray-600"
              >
                {showValue
                  ? <EyeOff className="w-3.5 h-3.5" />
                  : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}
      </td>

      {/* Last updated */}
      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap hidden lg:table-cell">
        {formatDateTime(cfg.updated_at)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 w-28">
        {isEditing ? (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="default"
              className="h-7 w-7"
              onClick={() => onSave(cfg.config_key)}
              disabled={isSaving || editValue === cfg.config_value}
            >
              {isSaving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Check className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onCancel}
              disabled={isSaving}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => onEdit(cfg.config_key, cfg.config_value)}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
        )}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConfigPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: listConfig,
  });

  const mutUpdate = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateConfig(key, value),
    onSuccess: () => {
      toast.success('Konfigurasi berhasil diperbarui');
      setEditing(null);
      qc.invalidateQueries({ queryKey: ['config'] });
    },
    onError: (err: any) => toast.error('Gagal memperbarui', { description: err.message }),
  });

  const startEdit = (key: string, value: string) => { setEditing(key); setEditValue(value); };
  const cancelEdit = () => { setEditing(null); setEditValue(''); };
  const saveEdit = (key: string) => {
    if (editValue === configs.find((c) => c.config_key === key)?.config_value) {
      cancelEdit();
      return;
    }
    mutUpdate.mutate({ key, value: editValue });
  };

  // Pisahkan config publik dan internal
  const publicConfigs = configs.filter((c) => c.is_public);
  const internalConfigs = configs.filter((c) => !c.is_public);

  return (
    <AdminLayout title="Konfigurasi Sistem">

      {/* ── Info banner ───────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 mb-5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <Settings className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          Perubahan konfigurasi akan langsung berlaku. Hati-hati saat mengubah nilai
          yang berdampak pada integrasi seperti API key dan URL.
          Setiap perubahan tercatat di audit log.
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4 border-b">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-7 w-14" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">

          {/* ── Public config ────────────────────────────────── */}
          {publicConfigs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Parameter Publik
                </CardTitle>
                <CardDescription className="text-xs">
                  Nilai ini aman untuk diekspos ke frontend (nama produk, batas, dll.)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Parameter</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Nilai</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs hidden lg:table-cell">Diperbarui</th>
                      <th className="px-4 py-2.5 w-28" />
                    </tr>
                  </thead>
                  <tbody>
                    {publicConfigs.map((cfg) => (
                      <ConfigRow
                        key={cfg.config_key}
                        cfg={cfg}
                        isEditing={editing === cfg.config_key}
                        editValue={editValue}
                        isSaving={mutUpdate.isPending}
                        onEdit={startEdit}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        onChange={setEditValue}
                      />
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* ── Internal config ───────────────────────────────── */}
          {internalConfigs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Parameter Internal
                </CardTitle>
                <CardDescription className="text-xs">
                  Hanya digunakan oleh backend. Nilai sensitif akan disembunyikan secara default.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Parameter</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Nilai</th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs hidden lg:table-cell">Diperbarui</th>
                      <th className="px-4 py-2.5 w-28" />
                    </tr>
                  </thead>
                  <tbody>
                    {internalConfigs.map((cfg) => (
                      <ConfigRow
                        key={cfg.config_key}
                        cfg={cfg}
                        isEditing={editing === cfg.config_key}
                        editValue={editValue}
                        isSaving={mutUpdate.isPending}
                        onEdit={startEdit}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        onChange={setEditValue}
                      />
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {configs.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center text-sm text-muted-foreground">
                Belum ada konfigurasi tersedia.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AdminLayout>
  );
}