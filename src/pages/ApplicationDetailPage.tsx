import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  getApplicationDetail, openApplication, recommendApplication,
  approveApplication, rejectApplication, addNote, AppStatus,
} from '@/lib/api/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft, CheckCircle2, XCircle, ThumbsUp,
  FolderOpen, MessageSquarePlus, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLOR: Record<AppStatus, string> = {
  DRAFT:          'bg-gray-100 text-gray-600',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  IN_REVIEW:      'bg-blue-100 text-blue-700',
  RECOMMENDED:    'bg-purple-100 text-purple-700',
  APPROVED:       'bg-green-100 text-green-700',
  REJECTED:       'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<AppStatus, string> = {
  DRAFT:          'Draft',
  PENDING_REVIEW: 'Menunggu Review',
  IN_REVIEW:      'Dalam Review',
  RECOMMENDED:    'Direkomendasikan',
  APPROVED:       'Disetujui',
  REJECTED:       'Ditolak',
};

type DialogType = 'approve' | 'reject' | 'recommend' | 'note' | null;

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value ?? '—'}</span>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isRole } = useAuth();

  const [dialog, setDialog] = useState<DialogType>(null);
  const [notes, setNotes]   = useState('');

  const { data: app, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn:  () => getApplicationDetail(id!),
    enabled:  !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['application', id] });
    qc.invalidateQueries({ queryKey: ['applications'] });
  };

  const mutOpen     = useMutation({ mutationFn: () => openApplication(id!),               onSuccess: () => { toast.success('Pengajuan dibuka'); invalidate(); } });
  const mutRecommend = useMutation({ mutationFn: () => recommendApplication(id!, notes),  onSuccess: () => { toast.success('Direkomendasikan'); setDialog(null); invalidate(); } });
  const mutApprove  = useMutation({ mutationFn: () => approveApplication(id!, notes),     onSuccess: () => { toast.success('Pengajuan disetujui'); setDialog(null); invalidate(); } });
  const mutReject   = useMutation({ mutationFn: () => rejectApplication(id!, notes),      onSuccess: () => { toast.success('Pengajuan ditolak'); setDialog(null); invalidate(); } });
  const mutNote     = useMutation({ mutationFn: () => addNote(id!, notes),                onSuccess: () => { toast.success('Catatan ditambahkan'); setDialog(null); invalidate(); setNotes(''); } });

  const openDialog = (type: DialogType) => { setNotes(''); setDialog(type); };

  if (isLoading) {
    return (
      <AdminLayout title="Detail Pengajuan">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </AdminLayout>
    );
  }

  if (!app) return null;

  const status = app.status as AppStatus;
  const canOpen      = status === 'PENDING_REVIEW' && isRole('admin', 'operator');
  const canRecommend = status === 'IN_REVIEW'       && isRole('admin', 'operator');
  const canApprove   = status === 'RECOMMENDED'     && isRole('admin', 'supervisor');
  const canReject    = (status === 'IN_REVIEW' || status === 'RECOMMENDED') && isRole('admin', 'supervisor');

  return (
    <AdminLayout title="Detail Pengajuan">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground font-mono">{app.id.slice(0, 8).toUpperCase()}</p>
            <h2 className="font-bold text-lg">{app.customer?.full_name ?? 'Nama belum tersedia'}</h2>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openDialog('note')} className="gap-1">
            <MessageSquarePlus className="w-4 h-4" /> Catatan
          </Button>
          {canOpen && (
            <Button size="sm" onClick={() => mutOpen.mutate()} disabled={mutOpen.isPending} className="gap-1">
              {mutOpen.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
              Buka Review
            </Button>
          )}
          {canRecommend && (
            <Button size="sm" onClick={() => openDialog('recommend')} className="gap-1 bg-purple-600 hover:bg-purple-700">
              <ThumbsUp className="w-4 h-4" /> Rekomendasikan
            </Button>
          )}
          {canReject && (
            <Button size="sm" variant="destructive" onClick={() => openDialog('reject')} className="gap-1">
              <XCircle className="w-4 h-4" /> Tolak
            </Button>
          )}
          {canApprove && (
            <Button size="sm" onClick={() => openDialog('approve')} className="gap-1 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4" /> Setujui
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom kiri — data customer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Pribadi */}
          <Card>
            <CardHeader><CardTitle className="text-base">Data Pribadi (KTP)</CardTitle></CardHeader>
            <CardContent className="divide-y">
              <InfoRow label="NIK"           value={app.ocr_result?.nik} />
              <InfoRow label="Nama Lengkap"  value={app.ocr_result?.full_name} />
              <InfoRow label="Tempat Lahir"  value={app.ocr_result?.birth_place} />
              <InfoRow label="Tanggal Lahir" value={app.ocr_result?.birth_date} />
              <InfoRow label="Jenis Kelamin" value={app.ocr_result?.gender} />
              <InfoRow label="Alamat"        value={app.ocr_result?.address} />
              <InfoRow label="Agama"         value={app.ocr_result?.religion} />
              <InfoRow label="Status Kawin"  value={app.ocr_result?.marital_status} />
              <InfoRow label="Pekerjaan"     value={app.ocr_result?.occupation} />
            </CardContent>
          </Card>

          {/* Kontak */}
          <Card>
            <CardHeader><CardTitle className="text-base">Kontak</CardTitle></CardHeader>
            <CardContent className="divide-y">
              <InfoRow label="Email"       value={app.customer?.email} />
              <InfoRow label="No. HP"      value={app.customer?.phone_number} />
            </CardContent>
          </Card>

          {/* Detail Produk */}
          <Card>
            <CardHeader><CardTitle className="text-base">Detail Produk — {app.product_type}</CardTitle></CardHeader>
            <CardContent className="divide-y">
              {app.product_type === 'DEPOSIT' && app.deposit_detail && <>
                <InfoRow label="Produk"          value={app.deposit_detail.product_name} />
                <InfoRow label="Jumlah"          value={formatCurrency(app.deposit_detail.placement_amount)} />
                <InfoRow label="Tenor"           value={`${app.deposit_detail.tenor_months} bulan`} />
                <InfoRow label="Jenis Rollover"  value={app.deposit_detail.rollover_type} />
                <InfoRow label="Sumber Dana"     value={app.deposit_detail.source_of_funds} />
              </>}
              {app.product_type === 'SAVING' && app.saving_detail && <>
                <InfoRow label="Produk"         value={app.saving_detail.product_name} />
                <InfoRow label="Setoran Awal"   value={formatCurrency(app.saving_detail.initial_deposit)} />
                <InfoRow label="Sumber Dana"    value={app.saving_detail.source_of_funds} />
                <InfoRow label="Tujuan"         value={app.saving_detail.saving_purpose} />
              </>}
              {app.product_type === 'LOAN' && app.loan_detail && <>
                <InfoRow label="Produk"         value={app.loan_detail.product_name} />
                <InfoRow label="Jumlah"         value={formatCurrency(app.loan_detail.requested_amount)} />
                <InfoRow label="Tenor"          value={`${app.loan_detail.tenor_months} bulan`} />
                <InfoRow label="Tujuan"         value={app.loan_detail.loan_purpose} />
                <InfoRow label="Sumber Bayar"   value={app.loan_detail.payment_source} />
              </>}
            </CardContent>
          </Card>

          {/* Rekening Pencairan */}
          {app.disbursement_data && (
            <Card>
              <CardHeader><CardTitle className="text-base">Rekening Pencairan</CardTitle></CardHeader>
              <CardContent className="divide-y">
                <InfoRow label="Bank"         value={app.disbursement_data.bank_name} />
                <InfoRow label="No. Rekening" value={app.disbursement_data.account_number} />
                <InfoRow label="Atas Nama"    value={app.disbursement_data.account_holder} />
              </CardContent>
            </Card>
          )}

          {/* Agunan */}
          {app.collateral_items?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Agunan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {app.collateral_items.map((item: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50 text-sm space-y-1">
                    <div className="font-medium">{item.collateral_type}</div>
                    {item.estimated_value && <div className="text-muted-foreground">Nilai: {formatCurrency(item.estimated_value)}</div>}
                    {item.description && <div className="text-muted-foreground">{item.description}</div>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Kolom kanan — verifikasi + timeline */}
        <div className="space-y-6">
          {/* Hasil Liveness */}
          <Card>
            <CardHeader><CardTitle className="text-base">Verifikasi Identitas</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {app.liveness_result ? <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${app.liveness_result.liveness_status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`}>
                    {app.liveness_result.liveness_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Face Match</span>
                  <span className="font-medium">{app.liveness_result.face_match_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-medium">
                    {app.liveness_result.face_match_score
                      ? `${(app.liveness_result.face_match_score * 100).toFixed(1)}%`
                      : '—'}
                  </span>
                </div>
              </> : <p className="text-muted-foreground text-xs">Belum diverifikasi</p>}
            </CardContent>
          </Card>

          {/* Catatan */}
          {app.notes?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Catatan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {app.notes.map((note: any) => (
                  <div key={note.id} className="text-sm p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-xs text-muted-foreground mb-1">
                      {note.author} · {formatDateTime(note.created_at)}
                    </p>
                    <p>{note.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Audit Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {app.audit_logs?.slice(0, 8).map((log: any) => (
                  <div key={log.id} className="flex gap-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-muted-foreground">{log.description}</p>
                      <p className="text-muted-foreground">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === 'approve'   && 'Setujui Pengajuan'}
              {dialog === 'reject'    && 'Tolak Pengajuan'}
              {dialog === 'recommend' && 'Rekomendasikan Pengajuan'}
              {dialog === 'note'      && 'Tambah Catatan'}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={dialog === 'reject' ? 'Alasan penolakan (wajib)...' : 'Catatan (opsional)...'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Batal</Button>
            <Button
              onClick={() => {
                if (dialog === 'approve')   mutApprove.mutate();
                if (dialog === 'reject')    mutReject.mutate();
                if (dialog === 'recommend') mutRecommend.mutate();
                if (dialog === 'note')      mutNote.mutate();
              }}
              disabled={
                (dialog === 'reject' && !notes.trim()) ||
                mutApprove.isPending || mutReject.isPending ||
                mutRecommend.isPending || mutNote.isPending
              }
              className={dialog === 'reject' ? 'bg-red-600 hover:bg-red-700' : dialog === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {(mutApprove.isPending || mutReject.isPending || mutRecommend.isPending || mutNote.isPending)
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
