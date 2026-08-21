import { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#667eea', '#38ef7d', '#f5576c', '#ffc107', '#a18cd1'];

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/analytics')
            .then(res => setData(res.data.data))
            .catch(err => alert('Failed to fetch analytics'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div><Navbar /><div style={{ padding: '40px', textAlign: 'center' }}>Loading Analytics...</div></div>;

    const machineChartData = data.machineStats.map((s: any) => ({ name: s._id, value: s.count }));
    const bookingChartData = data.bookingStats.map((s: any) => ({ name: s._id, value: s.count }));
    const peakChartData = data.peakHours.map((s: any) => ({ time: s._id, count: s.count })).sort((a: any, b: any) => a.time.localeCompare(b.time));

    return (
        <div>
            <Navbar />
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Admin Analytics Dashboard</h1>
                <p style={{ color: 'rgba(232,232,240,0.6)', marginBottom: '30px' }}>System overview and usage statistics.</p>

                {/* Totals Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    {[['Total Students', data.totals.students, '#667eea'], ['Total Machines', data.totals.machines, '#38ef7d'], ['Total Bookings', data.totals.bookings, '#f5576c']].map(([label, val, color]) => (
                        <div key={label as string} className="glass-card animate-slide-in" style={{ padding: '24px', borderTop: `4px solid ${color}` }}>
                            <h3 style={{ color: 'rgba(232,232,240,0.6)', fontSize: '0.9rem', marginBottom: '12px' }}>{label}</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: color as string }}>{val}</div>
                        </div>
                    ))}
                </div>

                {/* Charts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                    {/* Machines Pie */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ marginBottom: '20px' }}>Machine Status</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={machineChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {machineChartData.map((e: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bookings Bar */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ marginBottom: '20px' }}>Booking Status Rates</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={bookingChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                                    <YAxis stroke="rgba(255,255,255,0.5)" />
                                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <Bar dataKey="value" fill="#667eea" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Peak Hours Line */}
                <div className="glass-card" style={{ padding: '24px', marginBottom: '40px' }}>
                    <h3 style={{ marginBottom: '20px' }}>Peak Booking Hours</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={peakChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                                <YAxis stroke="rgba(255,255,255,0.5)" />
                                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <Line type="monotone" dataKey="count" stroke="#f5576c" strokeWidth={3} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
