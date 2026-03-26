import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDateOnly(dateStr?: string | null): string {
    if (!dateStr) return '—';

    // Coba parse langsung — handles ISO dan YYYY-MM-DD
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    // Fallback untuk format DD-MM-YYYY (dari VIDA OCR)
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
        const iso = `${parts[2]}-${parts[1]}-${parts[0]}`;
        const d2 = new Date(iso);
        if (!isNaN(d2.getTime())) {
            return d2.toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
        }
    }

    // Kembalikan apa adanya jika tidak bisa di-parse
    return dateStr;
}