import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

interface Student {
    _id: string;
    name: string;
    email: string;
    rollNumber: string;
    hostel: string;
    roomNumber: string;
    role: 'student' | 'admin';
}

interface AuthContextType {
    student: Student | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    googleLogin: (credential: string, formData?: any) => Promise<any>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    isAdmin: boolean;
}

interface RegisterData {
    name: string;
    email: string;
    rollNumber: string;
    hostel: string;
    roomNumber: string;
    phone: string;
    password: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [student, setStudent] = useState<Student | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState<boolean>(() => Boolean(localStorage.getItem('token')));

    useEffect(() => {
        if (!token) {
            return;
        }

        let isMounted = true;
        api
            .get('/auth/profile')
            .then((res) => {
                if (isMounted) setStudent(res.data.student);
            })
            .catch(() => {
                localStorage.removeItem('token');
                if (isMounted) {
                    setToken(null);
                    setStudent(null);
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [token]);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setStudent(res.data.student);
    };

    const googleLogin = async (credential: string, formData?: any) => {
        const payload = formData ? { credential, ...formData } : { credential };
        const res = await api.post('/auth/google', payload);

        if (res.status === 202) {
            // Needs more info
            return res.data;
        }

        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setStudent(res.data.student);
        return res.data;
    };

    const register = async (data: RegisterData) => {
        const res = await api.post('/auth/register', data);
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setStudent(res.data.student);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setStudent(null);
    };

    return (
        <AuthContext.Provider
            value={{ student, token, loading, login, googleLogin, register, logout, isAdmin: student?.role === 'admin' }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
