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
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>QR Scanner Simulator</h1>
                <p style={{ color: 'rgba(232,232,240,0.6)', marginBottom: '30px' }}>Enter a Booking ID to simulate checking in a student at the washing machine.</p>

                <div className="glass-card animate-scale-in" style={{ padding: '40px' }}>
                    <form onSubmit={handleCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Paste Booking ID here..."
                                value={bookingId}
                                onChange={e => setBookingId(e.target.value)}
                                required
                                style={{ textAlign: 'center', fontSize: '1.2rem', padding: '16px' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary" style={{ padding: '16px', fontSize: '1.1rem' }}>
                            Simulate QR Check-In
                        </button>
                    </form>

                    {result && (
                        <div style={{
                            marginTop: '30px',
                            padding: '20px',
                            borderRadius: '12px',
                            background: result.success ? 'rgba(56,239,125,0.1)' : 'rgba(245,87,108,0.1)',
                            border: result.success ? '1px solid rgba(56,239,125,0.3)' : '1px solid rgba(245,87,108,0.3)',
                            color: result.success ? '#38ef7d' : '#f5576c'
                        }}>
                            <h3 style={{ marginBottom: '8px' }}>{result.success ? '✅ Success' : '❌ Failed'}</h3>
                            <p>{result.message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
