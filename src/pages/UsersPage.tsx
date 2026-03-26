import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  listUsers, createUser, deactivateUser, reactivateUser,
  AdminUser, ROLE_ID_MAP,
} from '@/lib/api/adminApi';
import { formatDate } from '@/lib/utils';
import { UserPlus, Loader2, CheckCircle2, XCircle, Users, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';

// ─── Lookup tables ────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  operator: 'Operator',
};

const ROLE_COLOR: Record<AdminUser['role'], string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  supervisor: 'bg-primary/10 text-primary border-primary/20',
  operator: 'bg-success/10 text-success border-success/20',
};

const ROLE_AVATAR_BG: Record<AdminUser['role'], string> = {
  admin: 'bg-destructive/10 text-destructive',
  supervisor: 'bg-primary/10 text-primary',
  operator: 'bg-success/10 text-success',
};

// ─── Default form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  username: '',
  full_name: '',
  email: '',
  password: '',
  role: 'operator' as AdminUser['role'],
};

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonUserCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });

  const users = data?.data ?? [];

  const mutCreate = useMutation({
    mutationFn: () => createUser({
      username: form.username,   // ← pastikan ada 'username'
      full_name: form.full_name,  // ← 'full_name', bukan 'name'
      email: form.email,
      password: form.password,
      role: form.role,       // ← ROLE_ID_MAP dikonversi di dalam createUser
    }),
    onSuccess: () => {
      toast.success('Pengguna berhasil dibuat');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error('Gagal membuat pengguna', { description: err.message }),
  });

  const mutDeactivate = useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => { toast.success('Pengguna dinonaktifkan'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => toast.error('Gagal', { description: err.message }),
  });

  const mutReactivate = useMutation({
    mutationFn: (id: string) => reactivateUser(id),
    onSuccess: () => { toast.success('Pengguna diaktifkan'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => toast.error('Gagal', { description: err.message }),
  });

  const isFormValid =
    form.username.trim().length >= 3 &&
    form.full_name.trim().length > 0 &&
    form.email.includes('@') &&
    form.password.length >= 8;

  const set = (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  // Group users by status
  const activeUsers = users.filter((u) => u.is_active);
  const inactiveUsers = users.filter((u) => !u.is_active);

  return (
    <AdminLayout title="Manajemen Pengguna">

      {/* ── Heading ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Manajemen Pengguna
          </h1>
          <p className="text-muted-foreground">
            Kelola akun internal operator, supervisor, dan administrator
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Tambah Pengguna
        </Button>
      </div>

      {/* ── Stats summary ─────────────────────────────────────────── */}
      {!isLoading && users.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Pengguna', value: users.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Aktif', value: activeUsers.length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Nonaktif', value: inactiveUsers.length, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── User list ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonUserCard key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground mb-1">Belum ada pengguna</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan pengguna pertama untuk memulai
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Tambah Pengguna
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Pengguna aktif */}
          {activeUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">

                  {/* Avatar + info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarFallback className={`font-semibold text-sm ${ROLE_AVATAR_BG[user.role]}`}>
                        {user.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">
                          {user.full_name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${ROLE_COLOR[user.role]}`}
                        >
                          {ROLE_LABEL[user.role]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span className="font-mono text-xs">{user.username}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status + action */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1.5 text-sm text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      Aktif
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/20 hover:bg-destructive/5"
                      onClick={() => mutDeactivate.mutate(user.id)}
                      disabled={mutDeactivate.isPending}
                    >
                      {mutDeactivate.isPending
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : 'Nonaktifkan'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pengguna nonaktif — tampil lebih redup */}
          {inactiveUsers.map((user) => (
            <Card key={user.id} className="opacity-60 hover:opacity-80 transition-opacity">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="w-12 h-12 shrink-0">
                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-sm">
                        {user.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate line-through decoration-muted-foreground">
                          {user.full_name}
                        </h3>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {ROLE_LABEL[user.role]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span className="font-mono text-xs">{user.username}</span>
                        <span>•</span>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1.5 text-sm text-destructive">
                      <XCircle className="w-4 h-4" />
                      Nonaktif
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-success border-success/20 hover:bg-success/5"
                      onClick={() => mutReactivate.mutate(user.id)}
                      disabled={mutReactivate.isPending}
                    >
                      {mutReactivate.isPending
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : 'Aktifkan'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create Dialog ─────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); setForm(EMPTY_FORM); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Isi detail pengguna baru. Mereka dapat login menggunakan username dan password ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username <span className="text-destructive">*</span></Label>
              <Input id="username" value={form.username} onChange={set('username')} placeholder="contoh: budi.operator" autoComplete="off" />
              <p className="text-xs text-muted-foreground">Min. 3 karakter, digunakan untuk login</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input id="full_name" value={form.full_name} onChange={set('full_name')} placeholder="Budi Santoso" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="budi@bprperdana.co.id" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <Input id="password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 karakter" autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label>Role <span className="text-destructive">*</span></Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as AdminUser['role'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">
                    <div className="flex flex-col">
                      <span>Operator</span>
                      <span className="text-xs text-muted-foreground">Review & rekomendasikan pengajuan</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="supervisor">
                    <div className="flex flex-col">
                      <span>Supervisor</span>
                      <span className="text-xs text-muted-foreground">Approve / tolak pengajuan final</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex flex-col">
                      <span>Administrator</span>
                      <span className="text-xs text-muted-foreground">Akses penuh termasuk manajemen user</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); }} disabled={mutCreate.isPending}>
              Batal
            </Button>
            <Button onClick={() => mutCreate.mutate()} disabled={!isFormValid || mutCreate.isPending}>
              {mutCreate.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                : 'Buat Pengguna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}