import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Welcome Back</h1>
                    <p style={{ color: 'rgba(232,232,240,0.6)' }}>Login to book your laundry slot</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(245,87,108,0.1)', color: '#f5576c', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(245,87,108,0.3)', fontSize: '0.9rem' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'rgba(232,232,240,0.8)' }}>NIT Email</label>
                        <input
                            type="email"
                            required
                            className="input-field"
                            placeholder="rollno@nith.ac.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'rgba(232,232,240,0.8)' }}>Password</label>
                        <input
                            type="password"
                            required
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'rgba(232,232,240,0.6)' }}>
                    Don't have an account? <Link to="/register" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
                </p>
            </div>
        </div>
    );
}
