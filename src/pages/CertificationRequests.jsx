import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    CheckCircle2,
    XCircle,
    Clock,
    ShieldCheck,
    Mail,
    Phone,
    MapPin,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '../context/NotificationContext';

const CertificationRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const { notifications } = useNotifications();

    const fetchRequests = async () => {
        try {
            const response = await api.get('/certifications/admin/all');
            setRequests(response.data);
        } catch (error) {
            toast.error('Failed to fetch certification requests');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.patch(`/certifications/admin/${id}/status`, { status });
            toast.success(`Request ${status} successfully`);
            fetchRequests();
        } catch (error) {
            toast.error('Failed to update status');
            console.error(error);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    <CheckCircle2 size={14} /> Approved
                </span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    <XCircle size={14} /> Rejected
                </span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    <Clock size={14} /> Pending
                </span>;
        }
    };

    const getPaymentBadge = (status) => {
        if (status === 'paid') {
            return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                Paid
            </span>;
        }
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
            Unpaid
        </span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Certification Requests</h1>
                    <p className="text-slate-500 mt-1">Manage shop certification requests and payments</p>
                </div>
            </div>

            <div className="grid gap-6">
                {requests.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                        <ShieldCheck className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-4 text-lg font-medium text-slate-900">No requests found</h3>
                        <p className="mt-2 text-slate-500">When distributors request certifications, they will appear here.</p>
                    </div>
                ) : (
                    requests.map((request) => (
                        <div key={request._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-blue-200 transition-colors">
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                <ShieldCheck size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                                    {request.shopName}
                                                    {notifications.some(n => !n.isRead && n.metadata?.certificationId === request._id) && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white animate-pulse">NEW</span>
                                                    )}
                                                </h3>
                                                <p className="text-sm text-slate-500">Requested by {request.distributor?.firstName} {request.distributor?.lastName} ({request.requesterName})</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Mail size={16} className="text-slate-400" />
                                                {request.shopEmail}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Phone size={16} className="text-slate-400" />
                                                {request.shopPhone}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPin size={16} className="text-slate-400" />
                                                {request.shopCity}, {request.country}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <Clock size={16} />
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </div>
                                            {request.certificateNumber && (
                                                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                    ID: {request.certificateNumber}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex flex-col items-end gap-2">
                                            {getPaymentBadge(request.paymentStatus)}
                                            {getStatusBadge(request.requestStatus)}
                                        </div>

                                        {request.requestStatus === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleStatusUpdate(request._id, 'approved')}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(request._id, 'rejected')}
                                                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CertificationRequests;
