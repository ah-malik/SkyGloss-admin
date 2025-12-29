import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Users, Store, Key, AlertCircle, ShieldCheck, DollarSign, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [orderStats, setOrderStats] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [pendingCerts, setPendingCerts] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, requestsRes, certsRes, orderStatsRes] = await Promise.all([
                    api.get('/users/stats'),
                    api.get('/shop-requests'),
                    api.get('/certifications/admin/all'),
                    api.get('/orders/admin/stats')
                ]);

                setStats(statsRes.data);
                setPendingRequests(requestsRes.data.filter(r => r.status === 'pending'));
                setPendingCerts(certsRes.data.filter(r => r.requestStatus === 'pending'));
                setOrderStats(orderStatsRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDashboardData();
    }, []);

    const cards = [
        { label: 'Total Users', value: stats?.total || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Distributors', value: stats?.distributor || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { label: 'Shops', value: stats?.shop || 0, icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { label: 'Technicians', value: stats?.technician || 0, icon: Key, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Total Revenue', value: `$${orderStats?.totalRevenue?.toFixed(2) || '0.00'}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-slate-500">Platform overview and statistics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className={`${card.bg} p-3 rounded-xl`}>
                                <card.icon className={card.color} size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                                <p className="text-2xl font-bold">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold mb-6">Revenue Overview (Last 7 Days)</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={orderStats?.chartData || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short' })} axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} prefix="$" />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                />
                                <Bar dataKey="sales" fill="#0EA0DC" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold">Recent Orders</h2>
                        <Link to="/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</Link>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <div className="divide-y divide-slate-100">
                            {orderStats?.recentOrders?.length > 0 ? (
                                orderStats.recentOrders.map((order) => (
                                    <div key={order._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                                            <p className="text-sm text-slate-500">
                                                {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Unknown User'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-slate-900">${order.totalAmount.toFixed(2)}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-slate-400">
                                    <Package size={32} className="mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No orders yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Requests Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Pending Shop Requests</h2>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                        {pendingRequests.length} Pending
                    </span>
                </div>
                <div className="divide-y divide-slate-100">
                    {pendingRequests.length > 0 ? (
                        pendingRequests.slice(0, 5).map((req) => (
                            <div key={req._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="font-semibold text-slate-900">{req.shopName}</p>
                                    <p className="text-sm text-slate-500">{req.email} • {req.country}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg">View Details</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <AlertCircle size={40} className="mx-auto mb-4 opacity-20" />
                            <p>No pending requests at the moment</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pending Certification Requests Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Pending Certification Requests</h2>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                        {pendingCerts.length} Pending
                    </span>
                </div>
                <div className="divide-y divide-slate-100">
                    {pendingCerts.length > 0 ? (
                        pendingCerts.slice(0, 5).map((cert) => (
                            <div key={cert._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{cert.shopName}</p>
                                        <p className="text-sm text-slate-500">
                                            {cert.shopCity} • {cert.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg">View Details</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-400">
                            <ShieldCheck size={40} className="mx-auto mb-4 opacity-20" />
                            <p>No pending certifications at the moment</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
