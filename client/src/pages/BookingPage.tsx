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
            <div className="page-shell" style={{ maxWidth: '1020px' }}>
                <div className="board-header">
                    <div>
                        <h1 className="page-title">Slot Reservation Sheet</h1>
                        <p className="page-subtitle">Choose machine, day, and cycle time. Limit is 2 confirmed bookings per week.</p>
                    </div>
                </div>

                {error && (
                    <div className="alert" style={{ marginBottom: '14px' }}>
                        {error}
                    </div>
                )}

                <div className="panel" style={{ padding: '16px', marginBottom: '16px' }}>
                    <div className="split-grid" style={{ marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.83rem', marginBottom: '8px', color: 'var(--steel)' }}>Machine</label>
                            <select className="input-field mono" value={selectedMachine} onChange={e => { setSelectedMachine(e.target.value); setSelectedSlot(null); }}>
                                <option value="">Select Machine</option>
                                {machines.map(m => (
                                    <option key={m._id} value={m._id}>{m.machineNumber} ({m.hostel})</option>
                                ))}
                            </select>
                            {machines.length === 0 && (
                                <p style={{ marginTop: '8px', fontSize: '0.84rem', color: 'var(--steel)' }}>
                                    No machines are marked available.
                                </p>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.83rem', marginBottom: '8px', color: 'var(--steel)' }}>Date</label>
                            <select className="input-field mono" value={date} onChange={e => { setDate(e.target.value); setSelectedSlot(null); }}>
                                <option value={today}>Today ({today})</option>
                                <option value={tomorrow}>Tomorrow ({tomorrow})</option>
                            </select>
                        </div>
                    </div>

                    {selectedMachine && (
                        <div>
                            <h3 className="section-title" style={{ marginBottom: '10px' }}>Timetable (06:00 to 22:00)</h3>
                            {loading ? (
                                <div className="mono" style={{ color: 'var(--steel)', fontSize: '0.84rem' }}>Loading slots...</div>
                            ) : (
                                <div className="timetable-grid">
                                    {slots.map(slot => {
                                        const isSelected = selectedSlot?.startTime === slot.startTime;
                                        const unavailable = slot.isPast || slot.isBooked;
                                        const stateClass = unavailable ? 'unavailable' : isSelected ? 'selected' : 'available';

                                        return (
                                            <div
                                                key={slot.startTime}
                                                onClick={() => slot.available && setSelectedSlot(slot)}
                                                className={`slot-cell ${stateClass}`}
                                            >
                                                <div>{slot.startTime} - {slot.endTime}</div>
                                                <div style={{ marginTop: '4px', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {slot.isPast ? 'past' : slot.isBooked ? 'booked' : 'open'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {selectedSlot && (
                    <div className="panel" style={{ padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                            <p className="mono" style={{ fontSize: '0.8rem', color: 'var(--steel)', marginBottom: '4px' }}>Selected reservation</p>
                            <h3 className="section-title" style={{ marginBottom: 0 }}>{date} | {selectedSlot.startTime} - {selectedSlot.endTime}</h3>
                        </div>
                        <button className="btn-primary" onClick={handleBook}>Confirm Booking</button>
                    </div>
                )}
            </div>
        </div>
    );
}
