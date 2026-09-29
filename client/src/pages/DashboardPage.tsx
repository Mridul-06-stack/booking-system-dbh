import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';

type Machine = {
    _id: string;
    machineNumber: string;
    hostel: string;
    location?: string;
    status: 'available' | 'in-use' | 'maintenance';
};

type Slot = {
    startTime: string;
    endTime: string;
    available: boolean;
    isBooked: boolean;
    isWaitlisted?: boolean;
    isPast: boolean;
    bookedBy?: {
        _id?: string;
        name?: string;
        rollNumber?: string;
        roomNumber?: string;
        hostel?: string;
        phone?: string;
    } | null;
    bookingId?: string | null;
};

type ScheduleItem = {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    studentId: {
        _id: string;
        name: string;
        rollNumber: string;
        hostel?: string;
        roomNumber?: string;
        email: string;
        phone?: string;
    };
    machineId: {
        _id: string;
        machineNumber: string;
        hostel: string;
        location?: string;
    };
};

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

export default function DashboardPage() {
    const { student } = useAuth();

    // Data State
    const [machines, setMachines] = useState<Machine[]>([]);
    const [selectedMachineId, setSelectedMachineId] = useState<string>('');

    const todayStr = formatLocalDate(new Date());
    const tomorrowStr = getTomorrowStr();
    const [selectedDate, setSelectedDate] = useState(todayStr);

    const [slots, setSlots] = useState<Slot[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

    const [stats, setStats] = useState<any>(null);

    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);

    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingActionLoading, setBookingActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Live Schedule Table filter
    const [searchQuery, setSearchQuery] = useState('');

    const fetchSlots = useCallback(async () => {
        if (!selectedMachineId) return;
        setLoadingSlots(true);
        setSelectedSlot(null);
        try {
            const res = await api.get(`/bookings/slots?machineId=${selectedMachineId}&date=${selectedDate}`);
            setSlots(res.data.slots || []);
            setSettings(res.data.settings || null);
        } catch (err: any) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load slots' });
        } finally {
            setLoadingSlots(false);
        }
    }, [selectedMachineId, selectedDate]);

    const refreshDashboardData = useCallback(() => {
        Promise.all([
            api.get('/dashboard/stats'),
            api.get('/dashboard/upcoming'),
            api.get('/dashboard/live-schedule'),
        ]).then(([statsRes, upcomingRes, scheduleRes]) => {
            setStats(statsRes.data.stats);
            setUpcoming(upcomingRes.data.bookings || []);
            setSchedule(scheduleRes.data.schedule || []);
        }).catch(() => {});
        fetchSlots();
    }, [fetchSlots]);

    useEffect(() => {
        // Fetch Machines, Stats
        Promise.all([
            api.get('/machines'),
            api.get('/dashboard/stats'),
            api.get('/dashboard/upcoming'),
            api.get('/dashboard/live-schedule'),
        ])
            .then(([machinesRes, statsRes, upcomingRes, scheduleRes]) => {
                const availMachines = machinesRes.data.machines || [];
                setMachines(availMachines);
                if (availMachines.length > 0) {
                    setSelectedMachineId(availMachines[0]._id);
                }
                setStats(statsRes.data.stats);
                setUpcoming(upcomingRes.data.bookings || []);
                setSchedule(scheduleRes.data.schedule || []);
            })
            .catch((err) => {
                setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load initial data' });
            });
    }, []);

    useEffect(() => {
        const handleMachineStatusUpdate = (updatedMachine: Machine) => {
            setMachines((prev) => prev.map((m) => (m._id === updatedMachine._id ? updatedMachine : m)));
        };

        const handleBookingCreated = () => {
            refreshDashboardData();
        };

        const handleBookingCancelled = () => {
            refreshDashboardData();
        };

        const handleBookingCheckedIn = () => {
            refreshDashboardData();
        };

        const handleWaitlistOpened = (data: any) => {
            setActionMessage({
                type: 'success',
                text: `🔔 ALERT: A waitlisted slot on Machine M-${data.machineId?.machineNumber || ''} at ${data.startTime} just opened up! Reserve it now.`
            });
            refreshDashboardData();
        };

        socket.on('machine-status-update', handleMachineStatusUpdate);
        socket.on('booking-created', handleBookingCreated);
        socket.on('booking-cancelled', handleBookingCancelled);
        socket.on('booking-checked-in', handleBookingCheckedIn);
        socket.on('waitlist-slot-opened', handleWaitlistOpened);

        return () => {
            socket.off('machine-status-update', handleMachineStatusUpdate);
            socket.off('booking-created', handleBookingCreated);
            socket.off('booking-cancelled', handleBookingCancelled);
            socket.off('booking-checked-in', handleBookingCheckedIn);
            socket.off('waitlist-slot-opened', handleWaitlistOpened);
        };
    }, [refreshDashboardData]);

    useEffect(() => {
        if (selectedMachineId) {
            fetchSlots();
        }
    }, [selectedMachineId, selectedDate, fetchSlots]);

    const handleConfirmBooking = async () => {
        if (!selectedSlot || !selectedMachineId) return;
        setBookingActionLoading(true);
        setActionMessage(null);

        try {
            await api.post('/bookings', {
                machineId: selectedMachineId,
                date: selectedDate,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
            });
            setActionMessage({ type: 'success', text: `Reserved slot ${selectedSlot.startTime} – ${selectedSlot.endTime} successfully!` });
            setSelectedSlot(null);
            refreshDashboardData();
        } catch (err: any) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to reserve slot' });
        } finally {
            setBookingActionLoading(false);
        }
    };

    const handleSubscribeWaitlist = async (slot: Slot) => {
        if (!selectedMachineId) return;
        setActionMessage(null);
        try {
            const res = await api.post('/bookings/waitlist', {
                machineId: selectedMachineId,
                date: selectedDate,
                startTime: slot.startTime,
                endTime: slot.endTime,
            });
            setActionMessage({ type: 'success', text: res.data.message });
            fetchSlots();
        } catch (err: any) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to subscribe to waitlist' });
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Cancel this booking reservation?')) return;
        try {
            await api.put(`/bookings/${bookingId}/cancel`);
            setActionMessage({ type: 'success', text: 'Booking cancelled successfully. Quota restored!' });
            refreshDashboardData();
        } catch (err: any) {
            setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to cancel booking' });
        }
    };

    const activeMachine = machines.find((m) => m._id === selectedMachineId);

    // Schedule filter
    const filteredSchedule = schedule.filter((item) => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;
        return (
            (item.studentId?.name || '').toLowerCase().includes(q) ||
            (item.studentId?.rollNumber || '').toLowerCase().includes(q) ||
            (item.studentId?.phone || '').toLowerCase().includes(q) ||
            (item.machineId?.machineNumber || '').toLowerCase().includes(q) ||
            (item.date || '').includes(q) ||
            (item.startTime || '').includes(q)
        );
    });

    const dateLabel = selectedDate === todayStr ? 'Today' : 'Tomorrow';

    return (
        <div>
            <Navbar />
            <div className="page-shell" style={{ maxWidth: '1200px' }}>

                {/* Banner / Header */}
                <div className="board-header">
                    <div>
                        <h1 className="page-title">Washing Machine Slot Portal</h1>
                        <p className="page-subtitle">Select a machine tab below to view slots and who booked them, or reserve an open slot.</p>
                    </div>
                </div>

                {actionMessage && (
                    <div
                        className="panel"
                        style={{
                            padding: '12px 16px',
                            marginBottom: '16px',
                            background: actionMessage.type === 'success' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(198, 40, 40, 0.15)',
                            borderColor: actionMessage.type === 'success' ? 'var(--service-amber)' : 'var(--danger-red)',
                            color: 'var(--ink)',
                        }}
                    >
                        {actionMessage.text}
                    </div>
                )}

                {/* FEATURE 1: Machine Selector Tabs */}
                <div className="panel" style={{ padding: '14px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>

                        {/* Machine Switcher Tabs (M1, M2, M3...) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--steel)' }}>Select Machine:</span>
                            {machines.map((m) => {
                                const isActive = m._id === selectedMachineId;
                                return (
                                    <button
                                        key={m._id}
                                        onClick={() => setSelectedMachineId(m._id)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: isActive ? '2px solid var(--detergent-blue)' : '1px solid var(--line)',
                                            background: isActive ? 'var(--detergent-blue)' : 'rgba(255,255,255,0.6)',
                                            color: isActive ? '#fff' : 'var(--ink)',
                                            fontWeight: 600,
                                            fontSize: '0.88rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            boxShadow: isActive ? '0 2px 6px rgba(47, 103, 130, 0.25)' : 'none',
                                        }}
                                    >
                                        <span>M-{m.machineNumber}</span>
                                        <span className={`signal ${m.status}`} style={{ width: '8px', height: '8px' }} />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Date Toggle: Today / Tomorrow */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                onClick={() => setSelectedDate(todayStr)}
                                style={{
                                    padding: '6px 14px',
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
                                onClick={() => setSelectedDate(tomorrowStr)}
                                style={{
                                    padding: '6px 14px',
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
                            <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--steel)', marginLeft: '4px' }}>
                                ({selectedDate})
                            </span>
                        </div>
                    </div>

                    {/* FEATURE 2 & 3: Main Slot Timetable (Left) + Book A Slot Action Panel (Right) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '18px' }} className="split-grid-responsive">

                        {/* Timetable Grid with Student Names & Waitlist Button */}
                        <div style={{ background: 'rgba(255,255,255,0.4)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 className="section-title" style={{ marginBottom: 0 }}>
                                    Timetable Matrix for Machine M-{activeMachine?.machineNumber} ({dateLabel})
                                </h3>
                                <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--steel)' }}>
                                    Operating: {settings ? `${String(settings.operatingStartHour).padStart(2, '0')}:00 – ${String(settings.operatingEndHour).padStart(2, '0')}:00` : '06:00 – 22:00'}
                                </div>
                            </div>

                            {loadingSlots ? (
                                <div className="mono" style={{ fontSize: '0.84rem', color: 'var(--steel)', padding: '20px', textAlign: 'center' }}>
                                    Loading slots for Machine M-{activeMachine?.machineNumber}...
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {slots.map((slot) => {
                                        const isSelected = selectedSlot?.startTime === slot.startTime;
                                        const isMyBooking = slot.bookedBy?._id === student?._id;

                                        let bgColor = '#ffffff';
                                        let borderColor = 'var(--line)';
                                        let textColor = 'var(--ink)';

                                        if (slot.isPast) {
                                            bgColor = 'rgba(0, 0, 0, 0.04)';
                                            borderColor = 'var(--line)';
                                            textColor = 'var(--steel)';
                                        } else if (slot.isBooked) {
                                            bgColor = isMyBooking ? 'rgba(47, 103, 130, 0.15)' : 'rgba(198, 40, 40, 0.12)';
                                            borderColor = isMyBooking ? 'var(--detergent-blue)' : 'rgba(198, 40, 40, 0.4)';
                                        } else if (isSelected) {
                                            bgColor = 'rgba(46, 125, 50, 0.18)';
                                            borderColor = 'var(--service-amber)';
                                        }

                                        return (
                                            <div
                                                key={slot.startTime}
                                                onClick={() => {
                                                    if (slot.available) setSelectedSlot(slot);
                                                }}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    background: bgColor,
                                                    border: `1.5px solid ${borderColor}`,
                                                    cursor: slot.available ? 'pointer' : 'default',
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                <div className="mono" style={{ fontSize: '0.84rem', fontWeight: 600, color: textColor }}>
                                                    {slot.startTime} – {slot.endTime}
                                                </div>

                                                {/* Details: Who booked it vs Open vs Waitlist Alert */}
                                                <div style={{ marginTop: '6px' }}>
                                                    {slot.isPast ? (
                                                        <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--steel)', textTransform: 'uppercase' }}>
                                                            Past Slot
                                                        </span>
                                                    ) : slot.isBooked ? (
                                                        <div>
                                                            <div style={{ fontSize: '0.76rem', fontWeight: 600, color: isMyBooking ? 'var(--detergent-blue)' : '#c62828' }}>
                                                                {isMyBooking ? '★ Reserved by You' : `Booked: ${slot.bookedBy?.name || 'Student'}`}
                                                            </div>
                                                            {slot.bookedBy?.rollNumber && (
                                                                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--steel)' }}>
                                                                    {slot.bookedBy.rollNumber} {slot.bookedBy.roomNumber ? `(Rm ${slot.bookedBy.roomNumber})` : ''}
                                                                </div>
                                                            )}
                                                            {slot.bookedBy?.phone && (
                                                                <div className="mono" style={{ fontSize: '0.68rem', color: 'var(--steel)' }}>
                                                                    📞 {slot.bookedBy.phone}
                                                                </div>
                                                            )}

                                                            {/* FEATURE: Waitlist Alert Button for Booked Slot */}
                                                            {!isMyBooking && (
                                                                <div style={{ marginTop: '6px' }}>
                                                                    {slot.isWaitlisted ? (
                                                                        <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--service-amber)', fontWeight: 600 }}>
                                                                            🔔 Waitlist Alert Active
                                                                        </span>
                                                                    ) : (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSubscribeWaitlist(slot);
                                                                            }}
                                                                            style={{
                                                                                fontSize: '0.68rem',
                                                                                padding: '3px 6px',
                                                                                borderRadius: '4px',
                                                                                border: '1px solid var(--line)',
                                                                                background: '#fff',
                                                                                cursor: 'pointer',
                                                                            }}
                                                                        >
                                                                            🔔 Notify If Cancelled
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span className="badge badge-available" style={{ fontSize: '0.66rem' }}>OPEN</span>
                                                            <span style={{ fontSize: '0.72rem', color: 'var(--service-amber)', fontWeight: 600 }}>
                                                                {isSelected ? 'SELECTED ✓' : 'Click to Reserve'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* FEATURE 3: Right Panel "Book a Slot" */}
                        <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h3 className="section-title" style={{ marginBottom: '10px' }}>⚡ Reserve Slot</h3>

                                {/* Quota Widget */}
                                <div style={{ background: 'rgba(236, 233, 222, 0.4)', padding: '10px', borderRadius: '6px', marginBottom: '14px', border: '1px solid var(--line)' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--steel)' }}>Weekly Slot Quota</div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginTop: '2px' }}>
                                        {stats?.weeklyUsed} of {stats?.weeklyQuota || 2} used
                                    </div>
                                    <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--steel)', marginTop: '4px' }}>
                                        Remaining: {stats?.weeklyRemaining} slots | Resets weekly
                                    </div>
                                </div>

                                {selectedSlot ? (
                                    <div style={{ background: 'rgba(46, 125, 50, 0.08)', padding: '12px', borderRadius: '6px', border: '1px solid var(--service-amber)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--steel)', textTransform: 'uppercase', fontWeight: 600 }}>Selected Slot Details</div>
                                        <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '4px' }}>
                                            Machine M-{activeMachine?.machineNumber} ({activeMachine?.hostel})
                                        </div>
                                        <div className="mono" style={{ fontSize: '0.84rem', marginTop: '2px', color: 'var(--detergent-blue)' }}>
                                            {dateLabel} ({selectedDate}) | {selectedSlot.startTime} – {selectedSlot.endTime}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--steel)', marginTop: '6px' }}>
                                            Duration: {settings?.slotDurationMinutes || 60} mins
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--steel)', padding: '16px', border: '1px dashed var(--line)', borderRadius: '6px', textAlign: 'center' }}>
                                        👈 Click any OPEN slot on the left matrix to select it.
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '16px' }}>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={!selectedSlot || bookingActionLoading || (stats?.weeklyRemaining <= 0)}
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        fontSize: '0.9rem',
                                        opacity: (!selectedSlot || bookingActionLoading || (stats?.weeklyRemaining <= 0)) ? 0.5 : 1,
                                    }}
                                >
                                    {bookingActionLoading
                                        ? 'Reserving Slot...'
                                        : stats?.weeklyRemaining <= 0
                                            ? 'Weekly Quota Reached'
                                            : selectedSlot
                                                ? 'Confirm Booking'
                                                : 'Select Slot First'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FEATURE 4: Complete Live Schedule Table Across All Machines */}
                <div className="panel" style={{ padding: '16px', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                        <div>
                            <h2 className="section-title" style={{ marginBottom: '2px' }}>📋 Reservations Timetable</h2>
                            <p className="page-subtitle" style={{ marginBottom: 0 }}>Full schedule of who has booked what slot across all machines.</p>
                        </div>
                        <input
                            type="text"
                            placeholder="Filter by student, roll, phone, machine..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--line)', minWidth: '220px' }}
                        />
                    </div>

                    {filteredSchedule.length === 0 ? (
                        <div className="mono" style={{ fontSize: '0.84rem', color: 'var(--steel)', padding: '16px', textAlign: 'center' }}>
                            No active reservations found.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
                            <table className="ops-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Machine</th>
                                        <th>Student Name</th>
                                        <th>Phone</th>
                                        <th>Roll Number</th>
                                        <th>Hostel & Room</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSchedule.map((item) => (
                                        <tr key={item._id}>
                                            <td>
                                                <div className="mono" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.date}</div>
                                                <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--steel)' }}>{item.startTime} – {item.endTime}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>Machine M-{item.machineId?.machineNumber || '—'}</div>
                                            </td>
                                            <td>{item.studentId?.name || '—'}</td>
                                            <td className="mono" style={{ fontSize: '0.82rem' }}>📞 {item.studentId?.phone || '—'}</td>
                                            <td className="mono" style={{ fontSize: '0.82rem' }}>{item.studentId?.rollNumber || '—'}</td>
                                            <td>{item.studentId?.hostel || '—'}{item.studentId?.roomNumber ? `, Room ${item.studentId.roomNumber}` : ''}</td>
                                            <td>
                                                <span className={`badge badge-${item.status}`}>{item.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* FEATURE 5: Your Confirmed Bookings list with cancel button */}
                <div className="panel" style={{ padding: '14px' }}>
                    <h2 className="section-title">Your Confirmed Bookings</h2>
                    {upcoming.length === 0 ? (
                        <div className="mono" style={{ fontSize: '0.86rem', color: 'var(--steel)' }}>
                            No upcoming bookings for your account. Select an open slot above to reserve.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {upcoming.map((b: any) => (
                                <div key={b._id} className="panel" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <div className="mono" style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                                            {b.date} | {b.startTime} - {b.endTime}
                                        </div>
                                        <div style={{ fontSize: '0.84rem', color: 'var(--steel)' }}>
                                            Machine M-{b.machineId.machineNumber} | {b.machineId.hostel}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span className={`badge badge-${b.status}`}>{b.status}</span>
                                        <button
                                            onClick={() => handleCancelBooking(b._id)}
                                            className="btn-danger"
                                            style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                                        >
                                            Cancel Reservation
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
