/**
 * AdminLayout.tsx
 *
 * Layout utama admin dengan sidebar navigasi.
 * Wrap semua halaman admin yang butuh sidebar.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Users,
    ScrollText,
    Settings,
    LogOut,
    Building2,
    ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavItem {
    label: string;
    to: string;
    icon: React.ReactNode;
    roles?: ('admin' | 'supervisor' | 'operator')[];
}

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Dashboard',
        to: '/dashboard',
        icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
        label: 'Pengajuan',
        to: '/applications',
        icon: <FileText className="w-4 h-4" />,
    },
    {
        label: 'Pengguna',
        to: '/users',
        icon: <Users className="w-4 h-4" />,
        roles: ['admin'],
    },
    {
        label: 'Audit Log',
        to: '/audit-logs',
        icon: <ScrollText className="w-4 h-4" />,
        roles: ['admin', 'supervisor'],
    },
    {
        label: 'Konfigurasi',
        to: '/config',
        icon: <Settings className="w-4 h-4" />,
        roles: ['admin'],
    },
];

const ROLE_LABEL: Record<string, string> = {
    admin: 'Administrator',
    supervisor: 'Supervisor',
    operator: 'Operator',
};

const ROLE_COLOR: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    supervisor: 'bg-blue-100 text-blue-700',
    operator: 'bg-green-100 text-green-700',
};

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
    const { user, logout, isRole } = useAuth();

    const visibleNav = NAV_ITEMS.filter(
        (item) => !item.roles || item.roles.some((r) => isRole(r))
    );

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
                {/* Logo */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-gray-900">BPR Perdana</p>
                            <p className="text-xs text-gray-500">Admin Panel</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {visibleNav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                )
                            }
                        >
                            {item.icon}
                            {item.label}
                            {({ isActive }: { isActive: boolean }) =>
                                isActive ? (
                                    <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
                                ) : null
                            }
                        </NavLink>
                    ))}
                </nav>

                {/* User info */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {user?.name?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                            <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', ROLE_COLOR[user?.role ?? 'operator'])}>
                                {ROLE_LABEL[user?.role ?? 'operator']}
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={logout}
                        className="w-full gap-2 text-gray-600"
                    >
                        <LogOut className="w-3 h-3" />
                        Keluar
                    </Button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="bg-white border-b border-gray-200 px-8 py-4">
                    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                </header>

                <main className="flex-1 p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}