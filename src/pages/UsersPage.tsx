import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { listUsers, createUser, deactivateUser, reactivateUser, AdminUser } from '@/lib/api/adminApi';
import { formatDate } from '@/lib/utils';
import { UserPlus, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABEL: Record<string, string> = {
  admin:      'Administrator',
  supervisor: 'Supervisor',
  operator:   'Operator',
};

const ROLE_COLOR: Record<string, string> = {
  admin:      'bg-red-100 text-red-700',
  supervisor: 'bg-blue-100 text-blue-700',
  operator:   'bg-green-100 text-green-700',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'operator' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  listUsers,
  });

  const mutCreate = useMutation({
    mutationFn: () => createUser(form as any),
    onSuccess: () => {
      toast.success('Pengguna berhasil dibuat');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'operator' });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error('Gagal', { description: err.message }),
  });

  const mutDeactivate = useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => { toast.success('Pengguna dinonaktifkan'); qc.invalidateQueries({ queryKey: ['users'] }); },
  });

  const mutReactivate = useMutation({
    mutationFn: (id: string) => reactivateUser(id),
    onSuccess: () => { toast.success('Pengguna diaktifkan'); qc.invalidateQueries({ queryKey: ['users'] }); },
  });

  return (
    <AdminLayout title="Manajemen Pengguna">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <UserPlus className="w-4 h-4" /> Tambah Pengguna
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Dibuat</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : users?.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLOR[user.role]}`}>
                        {ROLE_LABEL[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle2 className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-xs">
                          <XCircle className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      {user.is_active ? (
                        <Button size="sm" variant="outline" className="text-red-600 text-xs"
                          onClick={() => mutDeactivate.mutate(user.id)}
                          disabled={mutDeactivate.isPending}>
                          Nonaktifkan
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-green-600 text-xs"
                          onClick={() => mutReactivate.mutate(user.id)}
                          disabled={mutReactivate.isPending}>
                          Aktifkan
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama pengguna" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@bprperdana.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 karakter" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button
              onClick={() => mutCreate.mutate()}
              disabled={!form.name || !form.email || !form.password || mutCreate.isPending}
            >
              {mutCreate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buat Pengguna'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
