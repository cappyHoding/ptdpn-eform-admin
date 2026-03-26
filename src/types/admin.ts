export interface AdminUser {
    id: string;
    username: string;  // ← tambah
    full_name: string; // ← ganti dari 'name'
    email: string;
    role: 'admin' | 'supervisor' | 'operator';
    is_active: boolean;
    created_at: string;
}

export const ROLE_ID_MAP: Record<AdminUser['role'], number> = {
    admin: 1,
    supervisor: 2,
    operator: 3,
};

export async function createUser(payload: {
    username: string;  // ← tambah
    full_name: string; // ← ganti dari 'name'
    email: string;
    password: string;
    role: AdminUser['role'];
}): Promise<AdminUser> {
    const res = await adminClient.post<ApiResponse<AdminUser>>('/admin/users', {
        username: payload.username,
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
        role_id: ROLE_ID_MAP[payload.role], // ← konversi ke number
    });
    return res.data.data;
}