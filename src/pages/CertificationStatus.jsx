import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    ShieldCheck,
    Download,
    Mail,
    Search,
    CheckCircle2,
    Clock,
    GraduationCap,
    Store,
    Users,
    Filter
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

const CertificationStatus = () => {
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [targetEmail, setTargetEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const fetchSummary = async () => {
        try {
            const response = await api.get('/certifications/admin/summary');
            setSummary(response.data);
        } catch (error) {
            toast.error('Failed to fetch certification status report');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    const handleExportExcel = () => {
        if (summary.length === 0) return toast.error('No data to export');

        const data = filteredSummary.map(item => ({
            'Shop Name': item.shopName,
            'Owner Name': `${item.firstName} ${item.lastName}`,
            'Email': item.email,
            'Country': item.country,
            'City': item.city,
            'Partner Reference': item.partnerName,
            'Partner Code': item.partnerCode,
            'Training Complete': item.isTrainingComplete ? 'Yes' : 'No',
            'Certification Status': item.status,
            'Applied Date': item.appliedDate ? new Date(item.appliedDate).toLocaleDateString() : 'N/A'
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Certification Status');
        XLSX.writeFile(workbook, `SkyGloss_Certification_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Excel file downloaded successfully');
    };

    const handleSendEmail = async () => {
        if (!targetEmail) return toast.error('Please enter an email address');
        setIsSending(true);
        try {
            await api.post('/certifications/admin/email-summary', { email: targetEmail });
            toast.success(`Report sent to ${targetEmail}`);
            setEmailModalOpen(false);
            setTargetEmail('');
        } catch (error) {
            toast.error('Failed to send email report');
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    const filteredSummary = summary.filter(item => {
        const matchesSearch =
            (item.shopName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.firstName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.lastName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.email?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Applied':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Course Complete (Not Applied)':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-500 border-slate-200';
        }
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Certification Issued Dashboard</h1>
                    <p className="text-slate-500 mt-1">Track training progress and certification requests across all shops</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setEmailModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Mail size={18} className="text-blue-600" />
                        Email Report
                    </button>
                    {/* <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Download size={18} />
                        Export Excel
                    </button> */}
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search shop, name or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-sm appearance-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Approved">Approved</option>
                        <option value="Applied">Applied</option>
                        <option value="Course Complete (Not Applied)">Course Complete</option>
                        <option value="Training in Progress">Training in Progress</option>
                    </select>
                </div>
                <div className="flex items-center justify-end px-2 text-sm text-slate-500 font-medium">
                    Showing {filteredSummary.length} of {summary.length} shops
                </div>
            </div>

            {/* Main Content Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Shop Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Associated Partner</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Training</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Applied Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSummary.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                                        No matching shops found
                                    </td>
                                </tr>
                            ) : (
                                filteredSummary.map((item) => (
                                    <tr key={item.userId} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                                    <Store size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-none mb-1">{item.shopName || 'Unnamed Shop'}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{item.firstName} {item.lastName}</p>
                                                    <p className="text-[10px] text-slate-400">{item.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                                    <Users size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 leading-tight">{item.partnerName}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.partnerCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-center gap-1">
                                                {item.isTrainingComplete ? (
                                                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-black">
                                                        <CheckCircle2 size={14} /> 100%
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                                                        <Clock size={14} /> In Progress
                                                    </span>
                                                )}
                                                <p className="text-[10px] text-slate-400 font-medium">8 Courses</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-black border uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                            {item.appliedDate ? new Date(item.appliedDate).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Email Modal */}
            {emailModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 mx-auto">
                                <Mail size={28} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Email Status Report</h2>
                            <p className="text-slate-500 text-center text-sm mb-8">Enter an email address to receive the full certification status report in Excel format.</p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Recipient Email</label>
                                    <input
                                        type="email"
                                        placeholder="admin@example.com"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        value={targetEmail}
                                        onChange={(e) => setTargetEmail(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setEmailModalOpen(false)}
                                        className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={isSending || !targetEmail}
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                    >
                                        {isSending ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-b-white rounded-full animate-spin" />
                                        ) : (
                                            <>Send Report <ShieldCheck size={18} /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CertificationStatus;
