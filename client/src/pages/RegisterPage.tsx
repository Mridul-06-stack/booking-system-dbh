import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin, googleLogout } from '@react-oauth/google';

export default function RegisterPage() {
    const location = useLocation();
    const googleState = location.state?.googleData;
    const googleCredential = location.state?.credential;

    const [formData, setFormData] = useState({
        name: googleState?.name || '',
        email: googleState?.email || '',
        rollNumber: '',
        hostel: 'Dhauladhar Boys Hostel',
        roomNumber: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [infoMsg, setInfoMsg] = useState(googleState?.message || '');
    const [loading, setLoading] = useState(false);
    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Reset Google Identity Services auto-selection so it always presents the account chooser popup
        googleLogout();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (googleCredential) {
            // Completing Google registration
            setLoading(true);
            try {
                await googleLogin(googleCredential, {
                    rollNumber: formData.rollNumber,
                    roomNumber: formData.roomNumber,
                    phone: formData.phone,
                    hostel: formData.hostel
                });
                navigate('/dashboard');
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to complete registration');
            } finally {
                setLoading(false);
            }
            return;
        }

        // Standard local registration
        if (!formData.email.endsWith('@nith.ac.in')) {
            return setError('Email must end with @nith.ac.in');
        }
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);
        try {
            await register({
                name: formData.name,
                email: formData.email,
                rollNumber: formData.rollNumber,
                hostel: formData.hostel,
                roomNumber: formData.roomNumber,
                phone: formData.phone,
                password: formData.password
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setError('');
        if (credentialResponse.credential) {
            try {
                const res = await googleLogin(credentialResponse.credential);
                if (res.requireExtraDetails) {
                    setFormData(prev => ({ ...prev, name: res.name || '', email: res.email || '' }));
                    setInfoMsg(res.message);
                    navigate('/register', { state: { googleData: res, credential: credentialResponse.credential }, replace: true });
                } else {
                    navigate('/dashboard');
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Google Auth failed');
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div className="panel" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 className="page-title" style={{ marginBottom: '10px' }}>Create Account</h1>
                    <p className="page-subtitle">Register your hostel details to start booking cycles.</p>
                </div>

                {error && (
                    <div className="alert" style={{ marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                {infoMsg && (
                    <div className="alert" style={{ marginBottom: '20px', backgroundColor: 'var(--detergent-blue)20', border: '1px solid var(--detergent-blue)', color: 'var(--detergent-blue)' }}>
                        {infoMsg}
                    </div>
                )}

                {!googleCredential && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setError('Google Sign up failed.')}
                                hosted_domain="nith.ac.in"
                                auto_select={false}
                                use_fedcm_for_button={false}
                                use_fedcm_for_prompt={false}
                                text="signup_with"
                                shape="pill"
                                theme="outline"
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                            <span style={{ padding: '0 10px', fontSize: '14px', color: 'var(--steel)' }}>OR ACCOUNT</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                        </div>
                    </>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--steel)' }}>Full Name</label>
                        <input type="text" name="name" required className="input-field" value={formData.name} onChange={handleChange} readOnly={!!googleCredential} />
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--steel)' }}>Email (@nith.ac.in)</label>
                            <input type="email" name="email" required className="input-field" value={formData.email} onChange={handleChange} readOnly={!!googleCredential} />
                        </div>
                        <div style={{ width: '120px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--steel)' }}>Roll Number</label>
                            <input type="text" name="rollNumber" required className="input-field" value={formData.rollNumber} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--steel)' }}>Hostel</label>
                            <input type="text" name="hostel" className="input-field" value={formData.hostel} readOnly style={{ cursor: 'not-allowed' }} />
                        </div>
                        <div style={{ width: '120px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--steel)' }}>Room</label>
                            <input type="text" name="roomNumber" required className="input-field" value={formData.roomNumber} onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--steel)' }}>Phone Number</label>
                        <input type="tel" name="phone" required className="input-field" placeholder="e.g. 9876543210" value={formData.phone} onChange={handleChange} />
                    </div>

                    {!googleCredential && (
                        <>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--steel)' }}>Password</label>
                                <input type="password" name="password" required className="input-field" value={formData.password} onChange={handleChange} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--steel)' }}>Confirm Password</label>
                                <input type="password" name="confirmPassword" required className="input-field" value={formData.confirmPassword} onChange={handleChange} />
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                        {loading ? 'Creating...' : 'Register'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--steel)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--detergent-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
