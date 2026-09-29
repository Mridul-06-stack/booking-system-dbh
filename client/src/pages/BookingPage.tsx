import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import socket from '../services/socket';

function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatLocalDate(d);
}

export default function BookingPage() {
    const [machines, setMachines] = useState<any[]>([]);
    const [selectedMachine, setSelectedMachine] = useState('');

    const todayStr = formatLocalDate(new Date());
    const tomorrowStr = getTomorrowStr();
    const [selectedDate, setSelectedDate] = useState(todayStr);

    const [slots, setSlots] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const fetchSlots = useCallback(async () => {
        if (!selectedMachine || !selectedDate) return;
        setLoading(true);
        try {
            const res = await api.get(`/bookings/slots?machineId=${selectedMachine}&date=${selectedDate}`);
            setSlots(res.data.slots || []);
            if (res.data.settings) setSettings(res.data.settings);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch slots');
        } finally {
            setLoading(false);
        }
    }, [selectedMachine, selectedDate]);

    useEffect(() => {
        // Fetch machines
        api.get('/machines')
            .then(res => {
                const avail = (res.data.machines || []).filter((m: any) => m.status === 'available');
                setMachines(avail);
                if (avail.length > 0 && !selectedMachine) {
                    setSelectedMachine(avail[0]._id);
                }
            })
            .catch(err => setError(err.response?.data?.message || 'Failed to load machines'));
    }, [selectedMachine]);

    useEffect(() => {
        fetchSlots();

        const handleBookingCreated = (booking: any) => {
            if (booking?.machineId?._id === selectedMachine && booking?.date === selectedDate) {
                fetchSlots();
            }
        };

        const handleBookingCancelled = (booking: any) => {
            if (booking?.machineId === selectedMachine && booking?.date === selectedDate) {
                fetchSlots();
            }
        };

        socket.on('booking-created', handleBookingCreated);
        socket.on('booking-cancelled', handleBookingCancelled);

        return () => {
            socket.off('booking-created', handleBookingCreated);
            socket.off('booking-cancelled', handleBookingCancelled);
        };
    }, [selectedMachine, selectedDate, fetchSlots]);

    const handleBook = async () => {
        if (!selectedSlot) return;
        setError('');

        try {
            await api.post('/bookings', {
                machineId: selectedMachine,
                date: selectedDate,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime
            });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to book slot');
        }
    };

    const dateLabel = selectedDate === todayStr ? 'Today' : 'Tomorrow';

    return (
        <div>
            <Navbar />
            <div className="page-shell" style={{ maxWidth: '1020px' }}>
                <div className="board-header">
                    <div>
                        <h1 className="page-title">Slot Reservation Sheet</h1>
                        <p className="page-subtitle">
                            Choose machine and time for {dateLabel} ({selectedDate}). Weekly quota limit is {settings?.weeklyQuota || 2} slots per student.
                        </p>
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
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedDate(todayStr); setSelectedSlot(null); }}
                                    style={{
                                        padding: '8px 14px',
                                        fontSize: '0.84rem',
                                        borderRadius: '6px',
                                        border: selectedDate === todayStr ? '2px solid var(--detergent-blue)' : '1px solid var(--line)',
                                        background: selectedDate === todayStr ? 'rgba(47, 103, 130, 0.15)' : 'rgba(255,255,255,0.5)',
                                        color: selectedDate === todayStr ? 'var(--detergent-blue)' : 'var(--ink)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    📅 Today
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedDate(tomorrowStr); setSelectedSlot(null); }}
                                    style={{
                                        padding: '8px 14px',
                                        fontSize: '0.84rem',
                                        borderRadius: '6px',
                                        border: selectedDate === tomorrowStr ? '2px solid var(--detergent-blue)' : '1px solid var(--line)',
                                        background: selectedDate === tomorrowStr ? 'rgba(47, 103, 130, 0.15)' : 'rgba(255,255,255,0.5)',
                                        color: selectedDate === tomorrowStr ? 'var(--detergent-blue)' : 'var(--ink)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    📅 Tomorrow
                                </button>
                            </div>
                        </div>
                    </div>

                    {selectedMachine && (
                        <div>
                            <h3 className="section-title" style={{ marginBottom: '10px' }}>
                                Timetable ({settings ? `${String(settings.operatingStartHour).padStart(2, '0')}:00 to ${String(settings.operatingEndHour).padStart(2, '0')}:00` : '06:00 to 22:00'})
                            </h3>
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
                            <h3 className="section-title" style={{ marginBottom: 0 }}>{selectedDate} | {selectedSlot.startTime} - {selectedSlot.endTime}</h3>
                        </div>
                        <button className="btn-primary" onClick={handleBook}>Confirm Booking</button>
                    </div>
                )}
            </div>
        </div>
    );
}
