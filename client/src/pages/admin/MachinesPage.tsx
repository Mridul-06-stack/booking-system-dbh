import { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

export default function MachinesPage() {
    const [machines, setMachines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMachine, setNewMachine] = useState({ machineNumber: '', hostel: 'Dhauladhar Boys Hostel', location: '' });

    useEffect(() => {
        fetchMachines();
    }, []);

    const fetchMachines = () => {
        api.get('/machines')
            .then(res => setMachines(res.data.machines))
            .finally(() => setLoading(false));
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/machines', newMachine);
            setNewMachine({ machineNumber: '', hostel: 'Dhauladhar Boys Hostel', location: '' });
            fetchMachines();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to add machine');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this machine?')) return;
        try {
            await api.delete(`/machines/${id}`);
            fetchMachines();
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
        try {
            await api.patch(`/machines/${id}/status`, { status: newStatus });
            fetchMachines();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    return (
        <div>
            <Navbar />
            <div className="page-shell" style={{ maxWidth: '1020px' }}>
                <h1 className="page-title">Machine Operations</h1>
                <p className="page-subtitle" style={{ marginBottom: '16px' }}>Add machines, place units in maintenance, and keep the room schedule accurate.</p>

                <div className="panel" style={{ padding: '16px', marginBottom: '16px' }}>
                    <h2 className="section-title">Register Machine</h2>
                    <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '10px', alignItems: 'end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px', color: 'var(--steel)' }}>Machine ID</label>
                            <input type="text" required className="input-field" value={newMachine.machineNumber} onChange={e => setNewMachine(p => ({ ...p, machineNumber: e.target.value }))} placeholder="e.g. M3" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px', color: 'var(--steel)' }}>Hostel</label>
                            <input type="text" className="input-field" value={newMachine.hostel} readOnly style={{ cursor: 'not-allowed' }} />
                        </div>
                        <div style={{ flex: 2 }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', marginBottom: '6px', color: 'var(--steel)' }}>Location</label>
                            <input type="text" className="input-field" value={newMachine.location} onChange={e => setNewMachine(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Ground Floor, Block A" />
                        </div>
                        <button type="submit" className="btn-primary">Add Machine</button>
                    </form>
                </div>

                <div className="panel" style={{ padding: '14px' }}>
                    {loading ? <p>Loading machines...</p> : (
                        <table className="ops-table">
                            <thead>
                                <tr>
                                    <th>Hostel</th>
                                    <th>Machine</th>
                                    <th>Status</th>
                                    <th>Location</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {machines.map(m => (
                                    <tr key={m._id}>
                                        <td>{m.hostel}</td>
                                        <td className="mono">M-{m.machineNumber}</td>
                                        <td>
                                            <span className={`badge badge-${m.status}`}>{m.status}</span>
                                        </td>
                                        <td>{m.location || '-'}</td>
                                        <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleStatusToggle(m._id, m.status)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                                {m.status === 'maintenance' ? 'Set Available' : 'Set Maintenance'}
                                            </button>
                                            <button onClick={() => handleDelete(m._id)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {machines.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '18px', textAlign: 'center', color: 'var(--steel)' }}>No machines found. Add one above.</td>
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
