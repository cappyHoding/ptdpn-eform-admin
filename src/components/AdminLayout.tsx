import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, FileText, Users,
    ScrollText, Settings, LogOut, ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import bprLogo from '@/assets/bpr-logo.png';

interface NavItem {
    label: string;
    to: string;
    icon: React.ReactNode;
    roles?: ('admin' | 'supervisor' | 'operator')[];
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Pengajuan', to: '/applications', icon: <FileText className="w-5 h-5" /> },
    { label: 'Pengguna', to: '/users', icon: <Users className="w-5 h-5" />, roles: ['admin'] },
    { label: 'Audit Log', to: '/audit-logs', icon: <ScrollText className="w-5 h-5" />, roles: ['admin', 'supervisor'] },
    { label: 'Konfigurasi', to: '/config', icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
];

const ROLE_LABEL: Record<string, string> = {
    admin: 'Administrator',
    supervisor: 'Supervisor',
    operator: 'Operator',
};

const ROLE_COLOR: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-300 border-red-500/30',
    supervisor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    operator: 'bg-green-500/20 text-green-300 border-green-500/30',
};

interface AdminLayoutProps {
    children: React.ReactNode;
    title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
    const { user, logout, isRole } = useAuth();
    const navigate = useNavigate();

    const visibleNav = NAV_ITEMS.filter(
        (item) => !item.roles || item.roles.some((r) => isRole(r))
    );

    return (
        <div className="min-h-screen flex bg-background">

            {/* ── Sidebar ──────────────────────────────────────────────────── */}
            <aside className="w-64 bg-sidebar flex flex-col shrink-0 border-r border-sidebar-border">

                {/* Logo */}
                <div className="p-6 border-b border-sidebar-border">
                    <img
                        src={bprLogo}
                        alt="BPR Perdana"
                        className="h-10 w-auto mb-2"
                        onError={(e) => {
                            // Fallback kalau file belum ada
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    <p className="text-xs text-sidebar-foreground/60 mt-1">
                        Admin eForm Dashboard
                    </p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {/* Section label */}
                    <div className="px-4 pb-2 pt-1">
                        <span className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                            Menu Utama
                        </span>
                    </div>

                    {visibleNav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                )
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User profile */}
                <div className="p-4 border-t border-sidebar-border">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
                        <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                                {user?.full_name?.charAt(0).toUpperCase() ?? 'A'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                {user?.full_name ?? user?.username}
                            </p>
                            {user?.role && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'text-[10px] h-4 px-1.5 border mt-0.5',
                                        ROLE_COLOR[user.role]
                                    )}
                                >
                                    {ROLE_LABEL[user.role]}
                                </Badge>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
                            onClick={logout}
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ─────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top bar */}
                <header className="h-16 bg-card border-b border-border flex items-center px-8 shrink-0 shadow-sm">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}