import { useState, useEffect, type ChangeEvent } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

type SystemSettings = {
    weeklyQuota: number;
    slotDurationMinutes: number;
    operatingStartHour: number;
    operatingEndHour: number;
    maxDailyBookingsPerStudent: number;
    requireAllowedList: boolean;
};

type AllowedUser = {
    _id: string;
    email: string;
    rollNumber?: string;
    name?: string;
    hostel?: string;
    createdAt?: string;
};

type ParsedCSVUser = {
    email: string;
    rollNumber?: string;
    name?: string;
    hostel?: string;
};

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>({
        weeklyQuota: 2,
        slotDurationMinutes: 60,
        operatingStartHour: 6,
        operatingEndHour: 22,
        maxDailyBookingsPerStudent: 2,
        requireAllowedList: false,
    });

    const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Single user form state
    const [newEmail, setNewEmail] = useState('');
    const [newRoll, setNewRoll] = useState('');
    const [newName, setNewName] = useState('');
    const [newHostel, setNewHostel] = useState('');
    const [addingUser, setAddingUser] = useState(false);

    // CSV import state
    const [parsedUsers, setParsedUsers] = useState<ParsedCSVUser[]>([]);
    const [fileName, setFileName] = useState('');
    const [importingCSV, setImportingCSV] = useState(false);

    // Search filter
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [settingsRes, allowedRes] = await Promise.all([
                api.get('/admin/settings'),
                api.get('/admin/allowed-users'),
            ]);
            setSettings(settingsRes.data.settings);
            setAllowedUsers(allowedRes.data.allowedUsers || []);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsSave = async () => {
        setSavingSettings(true);
        setMessage(null);
        try {
            const res = await api.put('/admin/settings', settings);
            setSettings(res.data.settings);
            setMessage({ type: 'success', text: 'System settings saved successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
        } finally {
            setSavingSettings(false);
        }
    };

    const handleAddSingleUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;
        setAddingUser(true);
        setMessage(null);
        try {
            await api.post('/admin/allowed-users', {
                email: newEmail,
                rollNumber: newRoll,
                name: newName,
                hostel: newHostel,
            });
            setMessage({ type: 'success', text: `Added ${newEmail} to allowed whitelist!` });
            setNewEmail('');
            setNewRoll('');
            setNewName('');
            setNewHostel('');
            const allowedRes = await api.get('/admin/allowed-users');
            setAllowedUsers(allowedRes.data.allowedUsers || []);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add allowed user' });
        } finally {
            setAddingUser(false);
        }
    };

    const handleDeleteUser = async (id: string, email: string) => {
        if (!confirm(`Remove ${email} from allowed list?`)) return;
        try {
            await api.delete(`/admin/allowed-users/${id}`);
            setAllowedUsers((prev) => prev.filter((u) => u._id !== id));
            setMessage({ type: 'success', text: `Removed ${email} from whitelist` });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to remove user' });
        }
    };

    // Client-side CSV / Text Parser
    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            if (!text) return;

            const lines = text.split(/\r\n|\n|\r/).map((l) => l.trim()).filter(Boolean);
            if (lines.length === 0) return;

            const items: ParsedCSVUser[] = [];
            let startIndex = 0;

            // Detect if first line is header
            const firstLineLower = lines[0].toLowerCase();
            if (firstLineLower.includes('email') || firstLineLower.includes('roll') || firstLineLower.includes('name')) {
                startIndex = 1;
            }

            for (let i = startIndex; i < lines.length; i++) {
                const parts = lines[i].split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
                if (parts.length === 0) continue;

                // Find email part or default to first part containing @ or first column
                let email = parts.find((p) => p.includes('@')) || parts[0];
                if (!email) continue;

                let rollNumber = parts.find((p) => p !== email && /^[A-Z0-9]{5,12}$/i.test(p));
                let name = parts.find((p) => p !== email && p !== rollNumber && isNaN(Number(p)));
                let hostel = parts.length > 3 ? parts[3] : undefined;

                if (!rollNumber && parts.length > 1 && parts[1] !== email) rollNumber = parts[1];
                if (!name && parts.length > 2) name = parts[2];

                items.push({
                    email,
                    rollNumber,
                    name,
                    hostel,
                });
            }

            setParsedUsers(items);
        };

        reader.readAsText(file);
    };

    const handleImportParsedCSV = async () => {
        if (parsedUsers.length === 0) return;
        setImportingCSV(true);
        setMessage(null);
        try {
            const res = await api.post('/admin/allowed-users/import', { users: parsedUsers });
            setMessage({ type: 'success', text: res.data.message });
            setParsedUsers([]);
            setFileName('');
            const allowedRes = await api.get('/admin/allowed-users');
            setAllowedUsers(allowedRes.data.allowedUsers || []);
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Import failed' });
        } finally {
            setImportingCSV(false);
        }
    };

    const filteredUsers = allowedUsers.filter((u) => {
        const query = searchTerm.toLowerCase();
        return (
            u.email.toLowerCase().includes(query) ||
            (u.rollNumber && u.rollNumber.toLowerCase().includes(query)) ||
            (u.name && u.name.toLowerCase().includes(query)) ||
            (u.hostel && u.hostel.toLowerCase().includes(query))
        );
    });

    if (loading) return <div>Loading settings...</div>;

    return (
        <div>
            <Navbar />
            <div className="page-shell" style={{ maxWidth: '1080px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                        <h1 className="page-title">Admin Controls & Rules</h1>
                        <p className="page-subtitle">Configure slot durations, weekly limits, operating hours, and authorized student lists.</p>
                    </div>
                </div>

                {message && (
                    <div
                        className="panel"
                        style={{
                            padding: '12px 16px',
                            marginBottom: '16px',
                            background: message.type === 'success' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(198, 40, 40, 0.15)',
                            borderColor: message.type === 'success' ? 'var(--service-amber)' : 'var(--danger-red)',
                            color: 'var(--ink)',
                        }}
                    >
                        {message.text}
                    </div>
                )}

                {/* Section 1: System Configuration */}
                <div className="panel" style={{ padding: '18px', marginBottom: '20px' }}>
                    <h2 className="section-title">⚙️ Booking Rules & Operating Parameters</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '14px' }}>
                        <div>
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                Weekly Quota (Slots per Student)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={20}
                                value={settings.weeklyQuota}
                                onChange={(e) => setSettings({ ...settings, weeklyQuota: Number(e.target.value) })}
                                className="mono"
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                            />
                            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--steel)', marginTop: '4px' }}>
                                Maximum machine slots a student can reserve in 1 week.
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                Slot Duration (Minutes)
                            </label>
                            <select
                                value={settings.slotDurationMinutes}
                                onChange={(e) => setSettings({ ...settings, slotDurationMinutes: Number(e.target.value) })}
                                className="mono"
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: '#fff' }}
                            >
                                <option value={15}>15 Minutes</option>
                                <option value={30}>30 Minutes</option>
                                <option value={45}>45 Minutes</option>
                                <option value={60}>60 Minutes (1 Hour)</option>
                                <option value={90}>90 Minutes (1.5 Hours)</option>
                                <option value={120}>120 Minutes (2 Hours)</option>
                            </select>
                            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--steel)', marginTop: '4px' }}>
                                Interval for generated slots on the booking grid.
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                Operating Hours (Start – End)
                            </label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select
                                    value={settings.operatingStartHour}
                                    onChange={(e) => setSettings({ ...settings, operatingStartHour: Number(e.target.value) })}
                                    className="mono"
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: '#fff' }}
                                >
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                                    ))}
                                </select>
                                <span>to</span>
                                <select
                                    value={settings.operatingEndHour}
                                    onChange={(e) => setSettings({ ...settings, operatingEndHour: Number(e.target.value) })}
                                    className="mono"
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', background: '#fff' }}
                                >
                                    {Array.from({ length: 25 }).map((_, i) => (
                                        <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--steel)', marginTop: '4px' }}>
                                Daily machine operating window.
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                                Max Daily Slots per Student
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={settings.maxDailyBookingsPerStudent}
                                onChange={(e) => setSettings({ ...settings, maxDailyBookingsPerStudent: Number(e.target.value) })}
                                className="mono"
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)' }}
                            />
                            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--steel)', marginTop: '4px' }}>
                                Limit consecutive or total slots a student can book in a single day.
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="requireAllowedList"
                            checked={settings.requireAllowedList}
                            onChange={(e) => setSettings({ ...settings, requireAllowedList: e.target.checked })}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="requireAllowedList" style={{ fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
                            Strict Whitelist Mode (Require student email/roll number in Allowed List for Registration)
                        </label>
                    </div>

                    <div style={{ marginTop: '18px', textAlign: 'right' }}>
                        <button onClick={handleSettingsSave} disabled={savingSettings} className="btn-primary">
                            {savingSettings ? 'Saving Settings...' : 'Save Configuration Changes'}
                        </button>
                    </div>
                </div>

                {/* Section 2: CSV / Excel Upload & Allowed Users Whitelist */}
                <div className="panel" style={{ padding: '18px' }}>
                    <h2 className="section-title">📂 Pre-Authorized Students & Whitelist (Excel / CSV Import)</h2>
                    <p className="page-subtitle" style={{ marginBottom: '14px' }}>
                        Import an Excel / CSV spreadsheet of allowed student emails and roll numbers, or manually add individual users.
                    </p>

                    {/* CSV Upload & Manual Form Tabs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                        {/* File Upload Box */}
                        <div style={{ background: 'rgba(255,255,255,0.4)', padding: '14px', borderRadius: '8px', border: '1px dashed var(--line)' }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>📥 Bulk Import CSV / Excel File</h3>
                            <input
                                type="file"
                                accept=".csv, .txt, .tsv, .xlsx"
                                onChange={handleFileUpload}
                                style={{ fontSize: '0.82rem', width: '100%', marginBottom: '8px' }}
                            />
                            <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--steel)' }}>
                                Columns detected: Email, Roll Number, Name, Hostel (Comma or tab separated).
                            </div>

                            {parsedUsers.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <div className="mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--detergent-blue)' }}>
                                        Previewing {parsedUsers.length} records from {fileName}:
                                    </div>
                                    <div style={{ maxHeight: '120px', overflowY: 'auto', margin: '6px 0', border: '1px solid var(--line)', borderRadius: '4px', padding: '6px', background: '#fff' }}>
                                        {parsedUsers.slice(0, 5).map((u, idx) => (
                                            <div key={idx} className="mono" style={{ fontSize: '0.72rem' }}>
                                                {u.email} | {u.rollNumber || 'N/A'} | {u.name || 'N/A'}
                                            </div>
                                        ))}
                                        {parsedUsers.length > 5 && (
                                            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--steel)', fontStyle: 'italic' }}>
                                                ...and {parsedUsers.length - 5} more records
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={handleImportParsedCSV} disabled={importingCSV} className="btn-primary" style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}>
                                        {importingCSV ? 'Importing...' : `Import ${parsedUsers.length} Students to Whitelist`}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Single User Add Box */}
                        <div style={{ background: 'rgba(255,255,255,0.4)', padding: '14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>➕ Single Student Whitelist Entry</h3>
                            <form onSubmit={handleAddSingleUser} style={{ display: 'grid', gap: '8px' }}>
                                <input
                                    type="email"
                                    placeholder="Student Email (e.g. 21bcs001@nith.ac.in)"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    required
                                    style={{ padding: '7px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid var(--line)' }}
                                />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                        type="text"
                                        placeholder="Roll Number"
                                        value={newRoll}
                                        onChange={(e) => setNewRoll(e.target.value)}
                                        style={{ flex: 1, padding: '7px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid var(--line)' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Student Name"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        style={{ flex: 1, padding: '7px', fontSize: '0.82rem', borderRadius: '4px', border: '1px solid var(--line)' }}
                                    />
                                </div>
                                <button type="submit" disabled={addingUser} className="btn-primary" style={{ padding: '8px', fontSize: '0.8rem' }}>
                                    {addingUser ? 'Adding...' : 'Add Allowed Student'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Whitelist Table */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ fontSize: '0.92rem' }}>Authorized Whitelist ({allowedUsers.length} total)</h3>
                            <input
                                type="text"
                                placeholder="Search by email, roll, name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid var(--line)', minWidth: '220px' }}
                            />
                        </div>

                        {filteredUsers.length === 0 ? (
                            <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--steel)', padding: '14px', textAlign: 'center' }}>
                                No authorized students match search query.
                            </div>
                        ) : (
                            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                <table className="ops-table">
                                    <thead>
                                        <tr>
                                            <th>Email</th>
                                            <th>Roll Number</th>
                                            <th>Name</th>
                                            <th>Hostel</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u) => (
                                            <tr key={u._id}>
                                                <td className="mono" style={{ fontSize: '0.82rem' }}>{u.email}</td>
                                                <td className="mono" style={{ fontSize: '0.82rem' }}>{u.rollNumber || '—'}</td>
                                                <td>{u.name || '—'}</td>
                                                <td>{u.hostel || '—'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id, u.email)}
                                                        className="btn-danger"
                                                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
