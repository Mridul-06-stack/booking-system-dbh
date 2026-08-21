import { useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

export default function ScannerPage() {
    const [bookingId, setBookingId] = useState('');
    const [result, setResult] = useState<any>(null);

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);
        try {
            const res = await api.post(`/bookings/${bookingId}/checkin`);
            setResult({ success: true, message: res.data.message });
            setBookingId('');
        } catch (err: any) {
            setResult({ success: false, message: err.response?.data?.message || 'Failed to check in' });
        }
    };

    return (
        <div>
            <Navbar />
            <div className="page-shell" style={{ maxWidth: '640px' }}>
                <h1 className="page-title">Check-in Console</h1>
                <p className="page-subtitle" style={{ marginBottom: '16px' }}>Enter a booking ID to mark student arrival at machine start time.</p>

                <div className="panel" style={{ padding: '18px' }}>
                    <form onSubmit={handleCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <input
                                type="text"
                                className="input-field mono"
                                placeholder="Paste Booking ID here..."
                                value={bookingId}
                                onChange={e => setBookingId(e.target.value)}
                                required
                                style={{ textAlign: 'center', fontSize: '1rem', padding: '12px' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '12px', fontSize: '0.95rem' }}>
                            Confirm Check-in
                        </button>
                    </form>

                    {result && (
                        <div style={{
                            marginTop: '20px',
                            padding: '14px',
                            borderRadius: '6px',
                            background: result.success ? 'rgba(59,106,81,0.12)' : 'rgba(145,69,53,0.1)',
                            border: result.success ? '1px solid rgba(59,106,81,0.42)' : '1px solid rgba(145,69,53,0.42)',
                            color: result.success ? 'var(--ok-green)' : 'var(--danger-rust)'
                        }}>
                            <h3 style={{ marginBottom: '8px', fontFamily: 'Bitter, serif' }}>{result.success ? 'Check-in Complete' : 'Check-in Failed'}</h3>
                            <p>{result.message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
