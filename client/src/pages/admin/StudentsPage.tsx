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
            <div className="page-shell" style={{ maxWidth: '1020px' }}>
                <h1 className="page-title">Student Accounts</h1>
                <p className="page-subtitle" style={{ marginBottom: '16px' }}>Block abusive usage and restore access when needed.</p>

                <div className="panel" style={{ padding: '14px' }}>
                    {loading ? <p>Loading students...</p> : (
                        <table className="ops-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Roll No / Email</th>
                                    <th>Hostel and Room</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s._id}>
                                        <td>{s.name}</td>
                                        <td>
                                            <div className="mono" style={{ fontSize: '0.82rem' }}>{s.rollNumber}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--steel)' }}>{s.email}</div>
                                        </td>
                                        <td>{s.hostel}, Room {s.roomNumber}</td>
                                        <td>
                                            {s.isBlocked ?
                                                <span className="badge badge-in-use">Blocked</span> :
                                                <span className="badge badge-available">Active</span>
                                            }
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
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
