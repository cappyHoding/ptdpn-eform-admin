/**
 * client.ts — Admin API client
 *
 * Axios instance khusus admin dengan JWT Bearer token interceptor.
 */

import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api/v1';
const TOKEN_KEY = 'admin_token';

export const adminClient: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Request: inject Bearer token ────────────────────────────────────────────

adminClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && config.headers) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response: translate errors ──────────────────────────────────────────────

const STATUS_MESSAGES: Record<number, string> = {
    400: 'Data tidak valid.',
    401: 'Sesi berakhir. Silakan login kembali.',
    403: 'Anda tidak memiliki akses untuk tindakan ini.',
    404: 'Data tidak ditemukan.',
    500: 'Terjadi kesalahan server. Coba lagi.',
};

adminClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        const status = error.response?.status;
        const data = error.response?.data as any;

        if (status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            window.location.href = '/login';
        }

        const msg =
            data?.error ??
            data?.message ??
            (status ? STATUS_MESSAGES[status] : null) ??
            'Terjadi kesalahan. Coba lagi.';

        error.message = msg;
        return Promise.reject(error);
    }
);