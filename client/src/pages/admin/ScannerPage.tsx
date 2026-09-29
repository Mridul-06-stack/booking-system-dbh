import { useState } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

interface CheckInResponse {
    success: boolean;
    message: string;
    booking?: {
        _id: string;
        date: string;
        startTime: string;
        endTime: string;
        studentId?: {
            name: string;
            rollNumber: string;
            roomNumber?: string;
        };
        machineId?: {
            machineNumber: string;
            hostel: string;
        };
    };
}

export default function ScannerPage() {
    const [bookingId, setBookingId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CheckInResponse | null>(null);

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedId = bookingId.trim();
        if (!trimmedId) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await api.post(`/bookings/${trimmedId}/checkin`);
            setResult({
                success: true,
                message: res.data.message,
                booking: res.data.booking,
            });
            setBookingId('');
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            setResult({
                success: false,
                message: axiosError.response?.data?.message || 'Failed to verify check-in',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className="page-shell" style={{ maxWidth: '640px' }}>
                <h1 className="page-title">Check-in Console</h1>
                <p className="page-subtitle" style={{ marginBottom: '16px' }}>
                    Enter or scan a digital reservation ID to verify student arrival at machine start time.
                </p>

                <div className="panel" style={{ padding: '22px' }}>
                    <form onSubmit={handleCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label className="mono" style={{ fontSize: '0.8rem', color: 'var(--steel)', display: 'block', marginBottom: '8px' }}>
                                RESERVATION ID
                            </label>
                            <input
                                type="text"
                                className="input-field mono"
                                placeholder="e.g. 64b8f... (from student QR code)"
                                value={bookingId}
                                onChange={(e) => setBookingId(e.target.value)}
                                required
                                style={{ textAlign: 'center', fontSize: '1.05rem', padding: '12px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || !bookingId.trim()}
                            style={{ padding: '12px', fontSize: '0.95rem' }}
                        >
                            {loading ? 'Verifying...' : 'Confirm Arrival & Check-In'}
                        </button>
                    </form>

                    {result && (
                        <div
                            style={{
                                marginTop: '20px',
                                padding: '16px',
                                borderRadius: '6px',
                                background: result.success ? 'rgba(59,106,81,0.12)' : 'rgba(145,69,53,0.1)',
                                border: result.success ? '1px solid rgba(59,106,81,0.42)' : '1px solid rgba(145,69,53,0.42)',
                                color: result.success ? 'var(--ok-green)' : 'var(--danger-rust)',
                            }}
                        >
                            <h3 style={{ marginBottom: '8px', fontFamily: 'Bitter, serif' }}>
                                {result.success ? '✅ Check-in Confirmed' : '❌ Verification Failed'}
                            </h3>
                            <p style={{ fontSize: '0.92rem', marginBottom: result.booking ? '12px' : '0' }}>{result.message}</p>
                            {result.booking && (
                                <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--ink)', background: 'rgba(255,255,255,0.45)', padding: '10px', borderRadius: '4px' }}>
                                    <div><strong>Student:</strong> {result.booking.studentId?.name} ({result.booking.studentId?.rollNumber})</div>
                                    <div><strong>Machine:</strong> M{result.booking.machineId?.machineNumber} | Room: {result.booking.studentId?.roomNumber || 'N/A'}</div>
                                    <div><strong>Slot:</strong> {result.booking.date} @ {result.booking.startTime}–{result.booking.endTime}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
