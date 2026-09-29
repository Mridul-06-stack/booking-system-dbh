import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';

export default function HistoryPage() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/dashboard/history');
            setHistory(res.data.bookings || []);
        } catch {
            setHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

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
            <div className="page-shell" style={{ maxWidth: '1020px' }}>
                <h1 className="page-title">Booking History</h1>
                <p className="page-subtitle" style={{ marginBottom: '16px' }}>Past and upcoming machine reservations.</p>

                <div className="panel" style={{ padding: '14px' }}>
                    {loading ? <p>Loading history...</p> : (
                        <table className="ops-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Machine</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(b => (
                                    <tr key={b._id}>
                                        <td className="mono">{b.date}</td>
                                        <td className="mono">{b.startTime} - {b.endTime}</td>
                                        <td>M-{b.machineId.machineNumber} ({b.machineId.hostel})</td>
                                        <td>
                                            <span className={`badge badge-${b.status}`}>{b.status}</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
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
                                        <td colSpan={5} style={{ padding: '18px', textAlign: 'center', color: 'var(--steel)' }}>You have no bookings yet.</td>
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
