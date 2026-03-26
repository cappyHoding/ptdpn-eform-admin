import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, AdminUser } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    allowedRoles?: AdminUser['role'][];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    // src/components/ProtectedRoute.tsx — bagian loading
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}