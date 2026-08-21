import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function HistoryPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = () => {
        api.get('/dashboard/history')
            .then(res => setHistory(res.data.bookings))
            .finally(() => setLoading(false));
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await api.put(`/bookings/${id}/cancel`);
            fetchHistory();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    return (
        <div>
            <Navbar />
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Booking History</h1>
                <p style={{ color: 'rgba(232,232,240,0.6)', marginBottom: '30px' }}>View your past and upcoming bookings here.</p>

                <div className="glass-card animate-slide-in" style={{ padding: '24px' }}>
                    {loading ? <p>Loading history...</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', fontWeight: 500 }}>Date</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', fontWeight: 500 }}>Time</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', fontWeight: 500 }}>Machine</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', fontWeight: 500 }}>Status</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(b => (
                                    <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px', fontWeight: 500 }}>{b.date}</td>
                                        <td style={{ padding: '16px' }}>{b.startTime} - {b.endTime}</td>
                                        <td style={{ padding: '16px', color: 'rgba(232,232,240,0.8)' }}>#{b.machineId.machineNumber} ({b.machineId.hostel})</td>
                                        <td style={{ padding: '16px' }}>
                                            <span className={`badge badge-${b.status}`}>{b.status}</span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            {b.status === 'confirmed' && (
                                                <button onClick={() => handleCancel(b._id)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'rgba(232,232,240,0.5)' }}>You have no bookings yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
