import { useState, useEffect } from 'react';
import api from '../api/axios';
import { CheckCircle, XCircle, Clock, MapPin, Mail, Phone, Info } from 'lucide-react';

const ShopRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/shop-requests');
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!confirm('Approve this shop request? an access code will be generated for the user.')) return;
        try {
            const res = await api.post(`/shop-requests/${id}/approve`);
            alert(`Shop request approved successfully!\n\nAccess Code: ${res.data.accessCode}\n\nProvide this code to the user for their first login.`);
            fetchRequests();
        } catch (err) {
            alert('Approval failed');
        }
    };

    const handleReject = async (id) => {
        if (!confirm('Are you sure you want to reject and delete this request? This action cannot be undone.')) return;
        try {
            await api.post(`/shop-requests/${id}/reject`);
            fetchRequests();
        } catch (err) {
            alert('Rejection failed');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Shop Certification Requests</h1>
                <p className="text-slate-500">Review and approve applications from new shops</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <p className="text-center p-10 text-slate-400">Loading requests...</p>
                ) : requests.length === 0 ? (
                    <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                        No shop requests found
                    </div>
                ) : requests.map((req) => (
                    <div key={req._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-700 w-12 h-12 rounded-xl flex items-center justify-center">
                                    <Store size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{req.shopName}</h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Clock size={14} />
                                        <span>Requested on {new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Mail size={16} />
                                    <span>{req.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Phone size={16} />
                                    <span>{req.phoneNumber}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600">
                                    <MapPin size={16} />
                                    <span>{req.address}, {req.country}</span>
                                </div>
                                {req.accessCodeUsed && (
                                    <div className="flex items-center gap-2 text-indigo-600 font-medium">
                                        <Info size={16} />
                                        <span>Used Access Code: {req.accessCodeUsed}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {req.status === 'pending' ? (
                                <>
                                    <button
                                        onClick={() => handleReject(req._id)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <XCircle size={18} />
                                        <span>Reject</span>
                                    </button>
                                    <button
                                        onClick={() => handleApprove(req._id)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 transition-all font-semibold"
                                    >
                                        <CheckCircle size={18} />
                                        <span>Approve</span>
                                    </button>
                                </>
                            ) : (
                                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold capitalize ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {req.status === 'approved' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    {req.status}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

import { Store } from 'lucide-react'; // Helper for internal component

export default ShopRequests;
