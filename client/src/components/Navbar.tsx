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
        <nav
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                borderBottom: '1px solid var(--line)',
                background: 'rgba(236, 233, 222, 0.94)',
            }}
        >
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '62px',
                    padding: '10px 18px',
                    gap: '14px',
                    flexWrap: 'wrap',
                }}
            >
                <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                    <div style={{ fontFamily: 'Bitter, serif', letterSpacing: '0.06em', fontSize: '1.04rem' }}>DBH LAUNDRY BOARD</div>
                    <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--steel)' }}>Dhouladhar Hostel Utility Console</div>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                        { to: '/dashboard', label: 'Status Board' },
                        { to: '/book', label: 'Book Slot' },
                        { to: '/history', label: 'History' },
                    ].map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            style={{
                                textDecoration: 'none',
                                padding: '6px 11px',
                                fontSize: '0.82rem',
                                borderRadius: '6px',
                                border: isActive(link.to) ? '1px solid var(--detergent-blue)' : '1px solid var(--line)',
                                background: isActive(link.to) ? 'rgba(47, 103, 130, 0.12)' : 'rgba(255,255,255,0.3)',
                                color: isActive(link.to) ? 'var(--detergent-blue)' : 'var(--ink)',
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}

                    {isAdmin &&
                        [
                            { to: '/admin/settings', label: 'Settings & Whitelist' },
                            { to: '/admin/analytics', label: 'Analytics' },
                            { to: '/admin/machines', label: 'Machines' },
                            { to: '/admin/students', label: 'Students' },
                        ].map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                style={{
                                    textDecoration: 'none',
                                    padding: '6px 11px',
                                    fontSize: '0.82rem',
                                    borderRadius: '6px',
                                    border: isActive(link.to) ? '1px solid var(--service-amber)' : '1px solid var(--line)',
                                    background: isActive(link.to) ? 'rgba(138, 106, 47, 0.15)' : 'rgba(255,255,255,0.3)',
                                    color: isActive(link.to) ? 'var(--service-amber)' : 'var(--ink)',
                                }}
                            >
                                {link.label}
                            </Link>
                        ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="mono" style={{ fontSize: '0.77rem', padding: '6px 8px', border: '1px solid var(--line)', borderRadius: '6px' }}>
                        {student.rollNumber} | {student.name}
                    </div>
                    <button onClick={handleLogout} className="btn-danger" style={{ padding: '6px 10px', fontSize: '0.76rem' }}>
                        Sign Out
                    </button>
                </div>
            </div>
        </nav>
    );
}
