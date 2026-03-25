/**
 * adminApi.ts
 *
 * Semua API call untuk admin dashboard.
 * Match 1:1 dengan backend admin routes.
 */

import { adminClient } from './client';

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppStatus =
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'IN_REVIEW'
    | 'RECOMMENDED'
    | 'APPROVED'
    | 'REJECTED';

export type ProductType = 'SAVING' | 'DEPOSIT' | 'LOAN';

export interface ApplicationListItem {
    id: string;
    product_type: ProductType;
    status: AppStatus;
    current_step: number;
    submitted_at: string | null;
    created_at: string;
    customer: {
        id: string;
        full_name: string | null;
        nik: string | null;
        phone_number: string | null;
        email: string | null;
    };
}

export interface ApplicationDetail extends ApplicationListItem {
    ocr_result: any | null;
    liveness_result: any | null;
    disbursement_data: any | null;
    collateral_items: any[];
    deposit_detail: any | null;
    saving_detail: any | null;
    loan_detail: any | null;
    audit_logs: AuditLog[];
    notes: ApplicationNote[];
}

export interface AuditLog {
    id: string;
    actor_type: string;
    actor_id: string | null;
    action: string;
    description: string | null;
    created_at: string;
}

export interface ApplicationNote {
    id: string;
    author: string;
    content: string;
    created_at: string;
}

export interface DashboardStats {
    total_applications: number;
    pending_review: number;
    in_review: number;
    approved_today: number;
    rejected_today: number;
    by_product: {
        SAVING: number;
        DEPOSIT: number;
        LOAN: number;
    };
}

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'supervisor' | 'operator';
    is_active: boolean;
    created_at: string;
}

export interface ListApplicationsParams {
    page?: number;
    per_page?: number;
    status?: AppStatus;
    product_type?: ProductType;
    search?: string;        // search by NIK atau nama
    date_from?: string;
    date_to?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
    const res = await adminClient.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return res.data.data;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function listApplications(
    params?: ListApplicationsParams
): Promise<PaginatedResponse<ApplicationListItem>> {
    const res = await adminClient.get<ApiResponse<PaginatedResponse<ApplicationListItem>>>(
        '/admin/applications',
        { params }
    );
    return res.data.data;
}

export async function getApplicationDetail(id: string): Promise<ApplicationDetail> {
    const res = await adminClient.get<ApiResponse<ApplicationDetail>>(
        `/admin/applications/${id}`
    );
    return res.data.data;
}

export async function openApplication(id: string): Promise<void> {
    await adminClient.patch(`/admin/applications/${id}/open`);
}

export async function recommendApplication(id: string, notes?: string): Promise<void> {
    await adminClient.patch(`/admin/applications/${id}/recommend`, { notes });
}

export async function approveApplication(id: string, notes?: string): Promise<void> {
    await adminClient.patch(`/admin/applications/${id}/approve`, { notes });
}

export async function rejectApplication(id: string, reason: string): Promise<void> {
    await adminClient.patch(`/admin/applications/${id}/reject`, { reason });
}

export async function addNote(id: string, content: string): Promise<void> {
    await adminClient.post(`/admin/applications/${id}/notes`, { content });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<AdminUser[]> {
    const res = await adminClient.get<ApiResponse<AdminUser[]>>('/admin/users');
    return res.data.data;
}

export async function createUser(payload: {
    name: string;
    email: string;
    password: string;
    role: AdminUser['role'];
}): Promise<AdminUser> {
    const res = await adminClient.post<ApiResponse<AdminUser>>('/admin/users', payload);
    return res.data.data;
}

export async function deactivateUser(id: string): Promise<void> {
    await adminClient.patch(`/admin/users/${id}/deactivate`);
}

export async function reactivateUser(id: string): Promise<void> {
    await adminClient.patch(`/admin/users/${id}/reactivate`);
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function listAuditLogs(params?: {
    page?: number;
    per_page?: number;
    action?: string;
    from?: string;
    to?: string;
}): Promise<PaginatedResponse<AuditLog>> {
    const res = await adminClient.get<ApiResponse<PaginatedResponse<AuditLog>>>(
        '/admin/audit-logs',
        { params }
    );
    return res.data.data;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export async function listConfig(): Promise<Record<string, string>> {
    const res = await adminClient.get<ApiResponse<Record<string, string>>>('/admin/config');
    return res.data.data;
}

export async function updateConfig(key: string, value: string): Promise<void> {
    await adminClient.patch(`/admin/config/${key}`, { value });
}