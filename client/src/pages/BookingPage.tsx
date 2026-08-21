import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { io } from 'socket.io-client';

function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function BookingPage() {
    const [machines, setMachines] = useState<any[]>([]);
    const [selectedMachine, setSelectedMachine] = useState('');

    const today = formatLocalDate(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = formatLocalDate(tomorrowDate);
    const [date, setDate] = useState(today);

    const [slots, setSlots] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        // Fetch machines
        api.get('/machines')
            .then(res => {
                setMachines(res.data.machines.filter((m: any) => m.status === 'available'));
            })
            .catch(err => setError(err.response?.data?.message || 'Failed to load machines'));

        // Real-time updates
        const socket = io();
        socket.on('booking-created', (booking) => {
            if (booking.machineId._id === selectedMachine && booking.date === date) {
                fetchSlots(); // refresh if currently viewing this machine+date
            }
        });
        return () => { socket.disconnect(); };
    }, [selectedMachine, date]);

    useEffect(() => {
        fetchSlots();
    }, [selectedMachine, date]);

    const fetchSlots = () => {
        if (!selectedMachine || !date) return;
        setLoading(true);
        api.get(`/bookings/slots?machineId=${selectedMachine}&date=${date}`)
            .then(res => setSlots(res.data.slots))
            .catch(err => setError(err.response?.data?.message || 'Failed to fetch slots'))
            .finally(() => setLoading(false));
    };

    const handleBook = async () => {
        if (!selectedSlot) return;
        setError('');

        try {
            await api.post('/bookings', {
                machineId: selectedMachine,
                date,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to book slot');
        }
    };

    return (
        <div>
            <Navbar />
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Book a Slot</h1>
                <p style={{ color: 'rgba(232,232,240,0.6)', marginBottom: '30px' }}>Select a machine and time for today or tomorrow. Limit: 2 per week.</p>

                {error && (
                    <div style={{ background: 'rgba(245,87,108,0.1)', color: '#f5576c', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(245,87,108,0.3)' }}>
                        ⚠️ {error}
                    </div>
                )}

                <div className="glass-card animate-fade-in" style={{ padding: '30px', marginBottom: '30px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'rgba(232,232,240,0.8)' }}>Select Machine</label>
                            <select className="input-field" value={selectedMachine} onChange={e => { setSelectedMachine(e.target.value); setSelectedSlot(null); }} style={{ appearance: 'none', background: '#1a1a2e' }}>
                                <option value="">-- Choose Machine --</option>
                                {machines.map(m => (
                                    <option key={m._id} value={m._id}>{m.machineNumber} ({m.hostel})</option>
                                ))}
                            </select>
                            {machines.length === 0 && (
                                <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'rgba(232,232,240,0.6)' }}>
                                    No machines are currently available.
                                </p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'rgba(232,232,240,0.8)' }}>Booking Date</label>
                            <select className="input-field" value={date} onChange={e => { setDate(e.target.value); setSelectedSlot(null); }} style={{ appearance: 'none', background: '#1a1a2e' }}>
                                <option value={today}>Today ({today})</option>
                                <option value={tomorrow}>Tomorrow ({tomorrow})</option>
                            </select>
                        </div>
                    </div>

                    {selectedMachine && (
                        <div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Available Slots (06:00 - 22:00)</h3>
                            {loading ? (
                                <div style={{ color: 'rgba(232,232,240,0.6)' }}>Loading slots...</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                                    {slots.map(slot => {
                                        const isSelected = selectedSlot?.startTime === slot.startTime;

                                        let bg = 'rgba(255,255,255,0.03)';
                                        let border = '1px solid rgba(255,255,255,0.1)';
                                        let color = '#fff';
                                        let cursor = 'pointer';

                                        if (slot.isPast || slot.isBooked) {
                                            bg = 'rgba(245,87,108,0.05)';
                                            border = '1px solid rgba(245,87,108,0.2)';
                                            color = 'rgba(232,232,240,0.3)';
                                            cursor = 'not-allowed';
                                        } else if (isSelected) {
                                            bg = 'rgba(102,126,234,0.2)';
                                            border = '1px solid #667eea';
                                            color = '#667eea';
                                        }

                                        return (
                                            <div
                                                key={slot.startTime}
                                                onClick={() => slot.available && setSelectedSlot(slot)}
                                                style={{
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    textAlign: 'center',
                                                    background: bg,
                                                    border: border,
                                                    color: color,
                                                    cursor: cursor,
                                                    transition: 'all 0.2s',
                                                    fontSize: '0.9rem',
                                                    fontWeight: isSelected ? 600 : 400
                                                }}
                                            >
                                                {slot.startTime} - {slot.endTime}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {selectedSlot && (
                    <div className="glass-card animate-slide-in" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: 'rgba(232,232,240,0.6)', marginBottom: '4px' }}>Selected Slot</p>
                            <h3 style={{ fontSize: '1.4rem' }}>{date} | {selectedSlot.startTime} - {selectedSlot.endTime}</h3>
                        </div>
                        <button className="btn-primary" onClick={handleBook}>Confirm Booking</button>
                    </div>
                )}
            </div>
        </div>
    );
}
