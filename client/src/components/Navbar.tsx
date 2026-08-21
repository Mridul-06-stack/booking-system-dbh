import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { student, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => location.pathname === path;

    if (!student) return null;

    return (
        <nav style={{
            background: 'rgba(10, 10, 26, 0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 100,
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '64px',
            }}>
                {/* Logo */}
                <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>🧺</span>
                    <span style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>LaundrySlot</span>
                </Link>

                {/* Nav Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[
                        { to: '/dashboard', label: '📊 Dashboard' },
                        { to: '/book', label: '📅 Book Slot' },
                        { to: '/history', label: '📋 History' },
                    ].map(link => (
                        <Link key={link.to} to={link.to} style={{
                            textDecoration: 'none',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: isActive(link.to) ? '#fff' : 'rgba(232,232,240,0.6)',
                            background: isActive(link.to) ? 'rgba(102,126,234,0.2)' : 'transparent',
                            border: isActive(link.to) ? '1px solid rgba(102,126,234,0.3)' : '1px solid transparent',
                            transition: 'all 0.2s ease',
                        }}>{link.label}</Link>
                    ))}

                    {isAdmin && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid rgba(255,255,255,0.1)', marginLeft: '6px', paddingLeft: '12px' }}>
                            {[
                                { to: '/admin/analytics', label: '📈 Analytics' },
                                { to: '/admin/machines', label: '⚙️ Machines' },
                                { to: '/admin/students', label: '👥 Students' },
                                { to: '/admin/scanner', label: '📷 Scanner' },
                            ].map(link => (
                                <Link key={link.to} to={link.to} style={{
                                    textDecoration: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: isActive(link.to) ? '#ffc107' : 'rgba(255,193,7,0.6)',
                                    background: isActive(link.to) ? 'rgba(255,193,7,0.1)' : 'transparent',
                                    border: isActive(link.to) ? '1px solid rgba(255,193,7,0.3)' : '1px solid transparent',
                                    transition: 'all 0.2s ease',
                                }}>{link.label}</Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* User + Logout */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '0.8rem',
                        color: 'rgba(232,232,240,0.7)',
                    }}>
                        {student.name} · {student.rollNumber}
                    </div>
                    <button onClick={handleLogout} style={{
                        background: 'rgba(245,87,108,0.1)',
                        border: '1px solid rgba(245,87,108,0.3)',
                        color: '#f5576c',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}>Logout</button>
                </div>
            </div>
        </nav>
    );
}
