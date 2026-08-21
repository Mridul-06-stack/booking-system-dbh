import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        rollNumber: '',
        hostel: 'Dhauladhar Boys Hostel',
        roomNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

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
                password: formData.password
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Create Account</h1>
                    <p style={{ color: 'rgba(232,232,240,0.6)' }}>Join to book laundry slots</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(245,87,108,0.1)', color: '#f5576c', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(245,87,108,0.3)', fontSize: '0.9rem' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'rgba(232,232,240,0.8)' }}>Full Name</label>
                        <input type="text" name="name" required className="input-field" value={formData.name} onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'rgba(232,232,240,0.8)' }}>Email (@nith.ac.in)</label>
                            <input type="email" name="email" required className="input-field" value={formData.email} onChange={handleChange} />
                        </div>
                        <div style={{ width: '120px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'rgba(232,232,240,0.8)' }}>Roll Number</label>
                            <input type="text" name="rollNumber" required className="input-field" value={formData.rollNumber} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'rgba(232,232,240,0.8)' }}>Hostel</label>
                            <input type="text" name="hostel" className="input-field" value={formData.hostel} readOnly style={{ background: 'rgba(255,255,255,0.02)', cursor: 'not-allowed' }} />
                        </div>
                        <div style={{ width: '120px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'rgba(232,232,240,0.8)' }}>Room</label>
                            <input type="text" name="roomNumber" required className="input-field" value={formData.roomNumber} onChange={handleChange} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'rgba(232,232,240,0.8)' }}>Password</label>
                        <input type="password" name="password" required className="input-field" value={formData.password} onChange={handleChange} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', color: 'rgba(232,232,240,0.8)' }}>Confirm Password</label>
                        <input type="password" name="confirmPassword" required className="input-field" value={formData.confirmPassword} onChange={handleChange} />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
                        {loading ? 'Creating...' : 'Register'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'rgba(232,232,240,0.6)' }}>
                    Already have an account? <Link to="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
}
