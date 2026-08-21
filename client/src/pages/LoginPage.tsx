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
            <div className="panel" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 className="page-title" style={{ marginBottom: '10px' }}>Sign In</h1>
                    <p className="page-subtitle">Use your hostel account to reserve slots.</p>
                </div>

                {error && (
                    <div className="alert" style={{ marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--steel)' }}>NIT Email</label>
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
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--steel)' }}>Password</label>
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

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--steel)' }}>
                    Do not have an account? <Link to="/register" style={{ color: 'var(--detergent-blue)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
                </p>
            </div>
        </div>
    );
}
