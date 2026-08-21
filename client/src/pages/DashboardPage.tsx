import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import QRCode from 'react-qr-code';
import { io } from 'socket.io-client';

type Machine = {
    _id: string;
    machineNumber: string;
    hostel: string;
    location?: string;
    status: 'available' | 'in-use' | 'maintenance';
};

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.get('/dashboard/stats'), api.get('/dashboard/upcoming'), api.get('/machines')])
            .then(([statsRes, upcomingRes, machinesRes]) => {
                setStats(statsRes.data.stats);
                setUpcoming(upcomingRes.data.bookings);
                setMachines(machinesRes.data.machines);
            })
            .finally(() => setLoading(false));

        const socket = io();
        socket.on('machine-status-update', (machine: Machine) => {
            setMachines((prev) => prev.map((m) => (m._id === machine._id ? machine : m)));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    if (loading) return <div>Loading...</div>;

    const available = machines.filter((m) => m.status === 'available').length;
    const inUse = machines.filter((m) => m.status === 'in-use').length;
    const maintenance = machines.filter((m) => m.status === 'maintenance').length;

    return (
        <div>
            <Navbar />
            <div className="page-shell">
                <div className="board-header">
                    <div>
                        <h1 className="page-title">Machine Slot Booking Statusboard</h1>
                        <p className="page-subtitle">Live machine availability and your queue position for this week.</p>
                    </div>
                    <Link to="/book">
                        <button className="btn-primary">Reserve Next Slot</button>
                    </Link>
                </div>

                <div className="panel" style={{ padding: '14px', marginBottom: '18px' }}>
                    <div className="status-board">
                        <div>
                            <h2 className="section-title">Machine Board</h2>
                            <div className="machine-grid">
                                {machines.map((m) => (
                                    <div key={m._id} className="machine-tile">
                                        <div className="machine-tile-top">
                                            <span className="machine-code">M-{m.machineNumber}</span>
                                            <span className={`signal ${m.status}`} />
                                        </div>
                                        <div className="status-text">{m.status.replace('-', ' ')}</div>
                                        <div className="mono" style={{ marginTop: '6px', fontSize: '0.72rem', color: 'var(--steel)' }}>
                                            {m.location || m.hostel}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="board-note">Color signal updates in real time when an admin changes machine status.</div>
                        </div>

                        <div>
                            <h2 className="section-title">Usage and Quota</h2>
                            <div className="metric-list">
                                <div className="metric-item">
                                    <div className="metric-label">Weekly Quota</div>
                                    <div className="metric-value">{stats?.weeklyUsed} of 2 used</div>
                                </div>
                                <div className="metric-item">
                                    <div className="metric-label">Slots Remaining</div>
                                    <div className="metric-value">{stats?.weeklyRemaining}</div>
                                </div>
                                <div className="metric-item">
                                    <div className="metric-label">Completed Cycles</div>
                                    <div className="metric-value">{stats?.completedBookings}</div>
                                </div>
                                <div className="metric-item">
                                    <div className="metric-label">Room Status</div>
                                    <div className="mono" style={{ fontSize: '0.85rem' }}>
                                        {available} free | {inUse} in use | {maintenance} down
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="panel" style={{ padding: '14px' }}>
                    <h2 className="section-title">Upcoming Queue</h2>
                    {upcoming.length === 0 ? (
                        <div className="mono" style={{ fontSize: '0.86rem', color: 'var(--steel)' }}>
                            No confirmed bookings. Reserve a slot to appear in the queue.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {upcoming.map((b: any) => (
                                <div key={b._id} className="panel" style={{ padding: '10px', background: 'rgba(255,255,255,0.3)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                        <div>
                                            <div className="mono" style={{ fontSize: '0.82rem' }}>
                                                {b.date} | {b.startTime} - {b.endTime}
                                            </div>
                                            <div style={{ fontSize: '0.84rem', color: 'var(--steel)' }}>
                                                Machine {b.machineId.machineNumber} | {b.machineId.hostel}
                                            </div>
                                        </div>
                                        <span className={`badge badge-${b.status}`}>{b.status}</span>
                                    </div>
                                    {b.status === 'confirmed' && (
                                        <div style={{ marginTop: '10px', display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                                            <div style={{ background: '#fff', borderRadius: '4px', padding: '8px', border: '1px solid var(--line)' }}>
                                                <QRCode value={b._id} size={82} />
                                            </div>
                                            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--steel)' }}>{b._id}</div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
