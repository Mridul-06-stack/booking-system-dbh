import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin, googleLogout } from '@react-oauth/google';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Reset Google Identity Services auto-selection so it always presents the account chooser popup
        googleLogout();
    }, []);

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

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setError('');
        try {
            if (credentialResponse.credential) {
                const res = await googleLogin(credentialResponse.credential);
                if (res.requireExtraDetails) {
                    navigate('/register', { state: { googleData: res, credential: credentialResponse.credential } });
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Google Auth failed');
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

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Log in failed.')}
                        hosted_domain="nith.ac.in"
                        auto_select={false}
                        use_fedcm_for_button={false}
                        use_fedcm_for_prompt={false}
                        text="signin_with"
                        shape="pill"
                        theme="outline"
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                    <span style={{ padding: '0 10px', fontSize: '14px', color: 'var(--steel)' }}>OR ACCOUNT</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                </div>

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
