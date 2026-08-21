import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import QRCode from 'react-qr-code';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/dashboard/stats'),
            api.get('/dashboard/upcoming')
        ]).then(([statsRes, upcomingRes]) => {
            setStats(statsRes.data.stats);
            setUpcoming(upcomingRes.data.bookings);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Dashboard</h1>
                        <p style={{ color: 'rgba(232,232,240,0.6)' }}>Welcome back. Manage your laundry slots here.</p>
                    </div>
                    <Link to="/book">
                        <button className="btn-primary">Book New Slot</button>
                    </Link>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div className="glass-card animate-slide-in" style={{ padding: '24px' }}>
                        <h3 style={{ color: 'rgba(232,232,240,0.6)', fontSize: '0.9rem', marginBottom: '12px' }}>Weekly Usage Limit</h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f5576c' }}>{stats?.weeklyUsed}</span>
                            <span style={{ fontSize: '1.2rem', color: 'rgba(232,232,240,0.5)' }}>/ 2 Used</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(232,232,240,0.5)', marginTop: '8px' }}>Resets on Sunday night.</p>
                    </div>

                    <div className="glass-card animate-slide-in" style={{ padding: '24px', animationDelay: '0.1s' }}>
                        <h3 style={{ color: 'rgba(232,232,240,0.6)', fontSize: '0.9rem', marginBottom: '12px' }}>Total Completed</h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: '#38ef7d' }}>{stats?.completedBookings}</span>
                            <span style={{ fontSize: '1.2rem', color: 'rgba(232,232,240,0.5)' }}>Washes</span>
                        </div>
                    </div>
                </div>

                {/* Upcoming Bookings */}
                <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Upcoming Bookings</h2>
                {upcoming.length === 0 ? (
                    <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'rgba(232,232,240,0.5)' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>No upcoming bookings.</p>
                        <Link to="/book"><button className="btn-outline">Book a machine now</button></Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                        {upcoming.map((b: any) => (
                            <div key={b._id} className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #667eea' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span className={`badge badge-${b.status}`}>{b.status}</span>
                                    <span style={{ fontSize: '0.9rem', color: 'rgba(232,232,240,0.5)' }}>Machine {b.machineId.machineNumber}</span>
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
                                    {new Date(b.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#667eea', marginBottom: '16px' }}>
                                    {b.startTime} - {b.endTime}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'rgba(232,232,240,0.8)', marginBottom: '16px' }}>
                                    Hostel: {b.machineId.hostel}
                                </div>
                                {b.status === 'confirmed' && (
                                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', textAlign: 'center', display: 'inline-block' }}>
                                        <QRCode value={b._id} size={100} style={{ margin: '0 auto' }} />
                                        <p style={{ marginTop: '8px', fontSize: '0.75rem', color: '#1a1a2e', fontFamily: 'monospace' }}>{b._id}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
