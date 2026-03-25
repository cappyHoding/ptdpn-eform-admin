import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { listApplications, AppStatus, ProductType } from '@/lib/api/adminApi';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<AppStatus, string> = {
    DRAFT: 'Draft',
    PENDING_REVIEW: 'Menunggu',
    IN_REVIEW: 'Dalam Review',
    RECOMMENDED: 'Direkomendasikan',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
};

const STATUS_COLOR: Record<AppStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
    IN_REVIEW: 'bg-blue-100 text-blue-700',
    RECOMMENDED: 'bg-purple-100 text-purple-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
};

const PRODUCT_LABEL: Record<ProductType, string> = {
    SAVING: 'Tabungan',
    DEPOSIT: 'Deposito',
    LOAN: 'Pinjaman',
};

export default function ApplicationListPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<AppStatus | 'ALL'>('ALL');
    const [product, setProduct] = useState<ProductType | 'ALL'>('ALL');

    const { data, isLoading } = useQuery({
        queryKey: ['applications', page, search, status, product],
        queryFn: () => listApplications({
            page,
            per_page: 15,
            search: search || undefined,
            status: status !== 'ALL' ? status : undefined,
            product_type: product !== 'ALL' ? product : undefined,
        }),
        keepPreviousData: true,
    });

    return (
        <AdminLayout title="Daftar Pengajuan">
            <div className="space-y-6">
                {/* Filter bar */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari NIK atau nama..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <Select value={status} onValueChange={(v) => { setStatus(v as any); setPage(1); }}>
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Status</SelectItem>
                                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={product} onValueChange={(v) => { setProduct(v as any); setPage(1); }}>
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Semua Produk" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Semua Produk</SelectItem>
                                    <SelectItem value="DEPOSIT">Deposito</SelectItem>
                                    <SelectItem value="SAVING">Tabungan</SelectItem>
                                    <SelectItem value="LOAN">Pinjaman</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Pemohon</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">NIK</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Produk</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                        <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <tr key={i} className="border-b">
                                                {Array.from({ length: 6 }).map((_, j) => (
                                                    <td key={j} className="px-4 py-3">
                                                        <Skeleton className="h-4 w-full" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : data?.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                                Tidak ada pengajuan ditemukan
                                            </td>
                                        </tr>
                                    ) : (
                                        data?.data.map((app) => (
                                            <tr
                                                key={app.id}
                                                className="border-b hover:bg-gray-50 cursor-pointer"
                                                onClick={() => navigate(`/applications/${app.id}`)}
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    {app.customer.full_name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                                                    {app.customer.nik ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {PRODUCT_LABEL[app.product_type]}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[app.status]}`}>
                                                        {STATUS_LABEL[app.status]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 text-xs">
                                                    {app.submitted_at
                                                        ? formatDate(app.submitted_at)
                                                        : formatDate(app.created_at)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Button size="icon" variant="ghost">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data && data.total_pages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <p className="text-sm text-muted-foreground">
                                    {data.total} pengajuan • Halaman {data.page} dari {data.total_pages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => p - 1)}
                                        disabled={page <= 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page >= data.total_pages}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}