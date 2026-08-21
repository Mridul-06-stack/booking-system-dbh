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
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Manage Machines</h1>
                <p style={{ color: 'rgba(232,232,240,0.6)', marginBottom: '30px' }}>Admin panel to add, remove, and update machines.</p>

                {/* Add Machine Form */}
                <div className="glass-card animate-fade-in" style={{ padding: '24px', marginBottom: '40px' }}>
                    <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Add New Machine</h3>
                    <form onSubmit={handleAdd} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Number</label>
                            <input type="number" required className="input-field" value={newMachine.machineNumber} onChange={e => setNewMachine(p => ({ ...p, machineNumber: e.target.value }))} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Hostel</label>
                            <input type="text" className="input-field" value={newMachine.hostel} readOnly style={{ background: 'rgba(255,255,255,0.02)', cursor: 'not-allowed' }} />
                        </div>
                        <div style={{ flex: 2 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Location / Wing Info</label>
                            <input type="text" className="input-field" value={newMachine.location} onChange={e => setNewMachine(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Ground Floor, Block A" />
                        </div>
                        <button type="submit" className="btn-primary">Add Machine</button>
                    </form>
                </div>

                {/* Machine List */}
                <div className="glass-card animate-slide-in" style={{ padding: '24px' }}>
                    {loading ? <p>Loading machines...</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', fontWeight: 500 }}>Hostel</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', fontWeight: 500 }}>Machine #</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', fontWeight: 500 }}>Status</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', fontWeight: 500 }}>Location</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {machines.map(m => (
                                    <tr key={m._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px' }}>{m.hostel}</td>
                                        <td style={{ padding: '16px', fontWeight: 600 }}>#{m.machineNumber}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span className={`badge badge-${m.status}`}>{m.status}</span>
                                        </td>
                                        <td style={{ padding: '16px', color: 'rgba(232,232,240,0.7)' }}>{m.location || '-'}</td>
                                        <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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
                                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'rgba(232,232,240,0.5)' }}>No machines found. Add one above.</td>
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
