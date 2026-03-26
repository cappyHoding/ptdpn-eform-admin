import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardStats } from '@/lib/api/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
    FileText, Clock, Eye, ThumbsUp,
    CheckCircle, XCircle, RefreshCw, ArrowRight,
} from 'lucide-react';

const STATUS_CONFIG = [
    { key: 'PENDING_REVIEW', label: 'Menunggu Review', icon: Clock, color: 'text-warning', bg: 'bg-warning/10', bar: 'hsl(38 92% 50%)' },
    { key: 'IN_REVIEW', label: 'Dalam Review', icon: Eye, color: 'text-primary', bg: 'bg-primary/10', bar: 'hsl(214 85% 35%)' },
    { key: 'RECOMMENDED', label: 'Direkomendasikan', icon: ThumbsUp, color: 'text-secondary', bg: 'bg-secondary/10', bar: 'hsl(195 75% 45%)' },
    { key: 'APPROVED', label: 'Disetujui', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', bar: 'hsl(142 76% 36%)' },
    { key: 'REJECTED', label: 'Ditolak', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', bar: 'hsl(0 72% 51%)' },
    { key: 'DRAFT', label: 'Draft', icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted', bar: 'hsl(215 15% 50%)' },
] as const;

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: stats, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: getDashboardStats,
        refetchInterval: 60_000,
    });

    const total = stats?.['TOTAL'] ?? 0;
    const chartData = STATUS_CONFIG.map((s) => ({
        name: s.label,
        value: stats?.[s.key] ?? 0,
        color: s.bar,
    }));

    return (
        <AdminLayout title="Dashboard">

            {/* ── Page heading ─────────────────────────────────────────── */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Selamat datang kembali,{' '}
                        <span className="font-medium text-foreground">
                            {user?.full_name ?? user?.username}
                        </span>
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* ── Total card ───────────────────────────────────────────── */}
            <Card className="mb-6 bg-gradient-primary text-white border-0 shadow-md">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-white/70 text-sm font-medium mb-1">Total Semua Pengajuan</p>
                        {isLoading
                            ? <Skeleton className="h-10 w-20 bg-white/20" />
                            : <p className="text-5xl font-bold">{total}</p>
                        }
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <FileText className="w-10 h-10 text-white/30" />
                        <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white/15 hover:bg-white/25 text-white border-0"
                            onClick={() => navigate('/applications')}
                        >
                            Lihat Semua
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Stat cards grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {STATUS_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
                    <Card
                        key={key}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/applications?status=${key}`)}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {label}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${bg}`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading
                                ? <Skeleton className="h-8 w-16" />
                                : <div className="text-2xl font-bold text-foreground">
                                    {stats?.[key] ?? 0}
                                </div>
                            }
                            {!isLoading && total > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {(((stats?.[key] ?? 0) / total) * 100).toFixed(0)}% dari total
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Bar chart ────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Distribusi Status Pengajuan</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading
                        ? <Skeleton className="h-56 w-full" />
                        : (
                            <ResponsiveContainer width="100%" height={224}>
                                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barSize={36}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 25% 88%)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(210 30% 94%)' }}
                                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(214 25% 88%)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )
                    }
                </CardContent>
            </Card>

        </AdminLayout>
    );
}