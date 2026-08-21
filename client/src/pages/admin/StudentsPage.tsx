import { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

export default function StudentsPage() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = () => {
        api.get('/admin/students')
            .then(res => setStudents(res.data.students))
            .finally(() => setLoading(false));
    };

    const toggleBlock = async (id: string, isBlocked: boolean) => {
        if (!confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this student?`)) return;
        try {
            await api.patch(`/admin/students/${id}/block`);
            fetchStudents();
        } catch (err) {
            alert('Failed to update student status');
        }
    };

    return (
        <div>
            <Navbar />
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Manage Students</h1>
                <p style={{ color: 'rgba(232,232,240,0.6)', marginBottom: '30px' }}>Admin panel to view and block/unblock students.</p>

                <div className="glass-card animate-slide-in" style={{ padding: '24px' }}>
                    {loading ? <p>Loading students...</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)' }}>Name</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)' }}>Roll No / Email</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)' }}>Hostel & Room</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)' }}>Status</th>
                                    <th style={{ padding: '12px 16px', color: 'rgba(232,232,240,0.6)', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px', fontWeight: 500 }}>{s.name}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{s.rollNumber}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(232,232,240,0.5)' }}>{s.email}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>{s.hostel}, Room {s.roomNumber}</td>
                                        <td style={{ padding: '16px' }}>
                                            {s.isBlocked ?
                                                <span className="badge badge-in-use">Blocked</span> :
                                                <span className="badge badge-available">Active</span>
                                            }
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button onClick={() => toggleBlock(s._id, s.isBlocked)} className={s.isBlocked ? "btn-outline" : "btn-danger"} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                                                {s.isBlocked ? 'Unblock Account' : 'Block Account'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
