/**
 * AuthContext.tsx
 *
 * Manages admin JWT auth state.
 * Token disimpan di localStorage dengan key 'admin_token'.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminClient } from '@/lib/api/client';

export interface AdminUser {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'supervisor' | 'operator';
}

interface AuthContextValue {
    user: AdminUser | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isRole: (...roles: AdminUser['role'][]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'admin_token';

export function AuthProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [loading, setLoading] = useState(true);

    // Load user dari /me saat mount jika ada token
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }
        adminClient.get<{ data: AdminUser }>('/admin/auth/me')
            .then((res) => setUser(res.data.data))
            .catch(() => {
                // Token invalid / expired — clear
                localStorage.removeItem(TOKEN_KEY);
                setToken(null);
            })
            .finally(() => setLoading(false));
    }, [token]);

    const login = async (email: string, password: string) => {
        const res = await adminClient.post<{ data: { token: string; user: AdminUser } }>(
            '/admin/auth/login',
            { email, password }
        );
        const { token: newToken, user: newUser } = res.data.data;
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(newUser);
        navigate('/dashboard');
    };

    const logout = () => {
        adminClient.post('/admin/auth/logout').catch(() => { });
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        navigate('/login');
    };

    const isRole = (...roles: AdminUser['role'][]) => {
        return !!user && roles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, isRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}