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
    | 'REJECTED'
    | 'SIGNING'
    | 'COMPLETED'
    | 'EXPIRED';

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

export interface SystemConfig {
    config_key: string;
    config_value: string;
    description: string | null;
    is_public: boolean;
    updated_by: string | null;
    updated_at: string;
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
    id: number;
    actor_type: 'customer' | 'internal_user' | 'system';
    actor_id: string | null;
    actor_username: string | null;
    actor_role: string | null;
    action: string;
    description: string | null;
    entity_type: string | null;
    entity_id: string | null;
    ip_address: string | null;
    created_at: string;
}

export interface ApplicationNote {
    id: string;
    author: string;
    content: string;
    created_at: string;
}

export type DashboardStats = Record<string, number>;


export interface AdminUser {
    id: string;
    name: string;
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
    // Backend returns: { success, message, data: { stats: {...} } }
    const res = await adminClient.get<ApiResponse<{ stats: DashboardStats }>>('/admin/dashboard/stats');
    return res.data.data.stats;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function listApplications(
    params?: ListApplicationsParams
): Promise<PaginatedResponse<ApplicationListItem>> {
    const res = await adminClient.get<ApiResponse<{
        applications: ApplicationListItem[]; // ← backend pakai 'applications', bukan 'data'
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    }>>('/admin/applications', { params });

    const raw = res.data.data;
    return {
        data: raw.applications, // ← normalize ke 'data' supaya konsisten
        total: raw.total,
        page: raw.page,
        per_page: raw.per_page,
        total_pages: raw.total_pages,
    };


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

export async function rejectApplication(id: string, notes: string): Promise<void> {
    await adminClient.patch(`/admin/applications/${id}/reject`, { notes }); // ← fix
}

export async function addNote(id: string, notes: string): Promise<void> {
    await adminClient.post(`/admin/applications/${id}/notes`, { notes }); // ← fix
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<PaginatedResponse<AdminUser>> {
    const res = await adminClient.get<ApiResponse<{
        users: AdminUser[];
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    }>>('/admin/users');

    const raw = res.data.data;
    return {
        data: raw.users, // ← normalize
        total: raw.total,
        page: raw.page,
        per_page: raw.per_page,
        total_pages: raw.total_pages,
    };
}

export async function createUser(payload: {
    username: string;
    full_name: string;
    email: string;
    password: string;
    role: AdminUser['role'];
}): Promise<AdminUser> {
    const res = await adminClient.post<ApiResponse<AdminUser>>('/admin/users', {
        username: payload.username,
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
        role_id: ROLE_ID_MAP[payload.role], // ← string 'operator' → number 3
    });
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
    actor_id?: string;
}): Promise<PaginatedResponse<AuditLog>> {
    const res = await adminClient.get<ApiResponse<{
        logs: AuditLog[];
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
    }>>('/admin/audit-logs', { params });

    const raw = res.data.data;
    return {
        data: raw.logs, // ← normalize
        total: raw.total,
        page: raw.page,
        per_page: raw.per_page,
        total_pages: raw.total_pages,
    };
}

// ─── Config ───────────────────────────────────────────────────────────────────

export async function listConfig(): Promise<SystemConfig[]> {
    const res = await adminClient.get<ApiResponse<{ configs: SystemConfig[] }>>('/admin/config');
    return res.data.data.configs;
}

export async function updateConfig(key: string, value: string): Promise<void> {
    await adminClient.patch(`/admin/config/${key}`, { value });
}

export interface ReviewAction {
    id: string;
    application_id: string;
    actor_id: string;
    actor_username: string;
    actor_role: 'admin' | 'supervisor' | 'operator';
    action: 'OPENED' | 'RECOMMENDED' | 'APPROVED' | 'REJECTED' | 'NOTE_ADDED' | 'REOPENED';
    notes: string | null;
    created_at: string;
}

export async function getApplicationTimeline(id: string): Promise<ReviewAction[]> {
    const res = await adminClient.get<ApiResponse<{ timeline: ReviewAction[] }>>(
        `/admin/applications/${id}/timeline`
    );
    return res.data.data.timeline;
}