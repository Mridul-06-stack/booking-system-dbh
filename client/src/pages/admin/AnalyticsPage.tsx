import { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#2f6782', '#3b6a51', '#914535', '#8a6a2f', '#5f6a73'];

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/analytics')
            .then(res => setData(res.data.data))
            .catch(() => alert('Failed to fetch analytics'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div><Navbar /><div style={{ padding: '40px', textAlign: 'center' }}>Loading analytics...</div></div>;

    const machineChartData = data.machineStats.map((s: any) => ({ name: s._id, value: s.count }));
    const bookingChartData = data.bookingStats.map((s: any) => ({ name: s._id, value: s.count }));
    const peakChartData = data.peakHours.map((s: any) => ({ time: s._id, count: s.count })).sort((a: any, b: any) => a.time.localeCompare(b.time));

    return (
        <div>
            <Navbar />
            <div className="page-shell">
                <h1 className="page-title">Operations Analytics</h1>
                <p className="page-subtitle" style={{ marginBottom: '18px' }}>Booking volume, machine state distribution, and peak usage windows.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    {[['Total Students', data.totals.students], ['Total Machines', data.totals.machines], ['Total Bookings', data.totals.bookings]].map(([label, val]) => (
                        <div key={label as string} className="panel" style={{ padding: '14px' }}>
                            <h3 className="metric-label">{label}</h3>
                            <div className="metric-value">{val}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
                    <div className="panel" style={{ padding: '14px' }}>
                        <h3 className="section-title">Machine Status Mix</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={machineChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                        {machineChartData.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: '#ece9de', border: '1px solid #a8afa7', color: '#222d36' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="panel" style={{ padding: '14px' }}>
                        <h3 className="section-title">Booking Status Counts</h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={bookingChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#c1c5be" />
                                    <XAxis dataKey="name" stroke="#5f6a73" />
                                    <YAxis stroke="#5f6a73" />
                                    <Tooltip contentStyle={{ background: '#ece9de', border: '1px solid #a8afa7', color: '#222d36' }} />
                                    <Bar dataKey="value" fill="#2f6782" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="panel" style={{ padding: '14px', marginBottom: '30px' }}>
                    <h3 className="section-title">Peak Booking Hours</h3>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={peakChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#c1c5be" />
                                <XAxis dataKey="time" stroke="#5f6a73" />
                                <YAxis stroke="#5f6a73" />
                                <Tooltip contentStyle={{ background: '#ece9de', border: '1px solid #a8afa7', color: '#222d36' }} />
                                <Line type="monotone" dataKey="count" stroke="#914535" strokeWidth={3} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
