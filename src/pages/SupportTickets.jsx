import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Filter, MessageSquare, Mail, User, Tag, Clock, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const SupportTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/support');
            console.log('Support tickets response:', res.data);
            setTickets(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch tickets:", err);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const updateTicketStatus = async (id, newStatus) => {
        try {
            const res = await api.patch(`/support/${id}`, { status: newStatus });
            setTickets(tickets.map(ticket => ticket._id === id ? res.data : ticket));
            if (selectedTicket && selectedTicket._id === id) {
                setSelectedTicket(res.data);
            }
            toast.success(`Ticket status updated to ${newStatus.replace('_', ' ')}`);
        } catch (err) {
            console.error("Failed to update ticket status:", err);
            toast.error("Failed to update ticket status");
        }
    };

    const replyTicket = async () => {
        if (!replyText.trim()) return toast.error("Reply cannot be empty");
        try {
            const res = await api.patch(`/support/${selectedTicket._id}`, { adminReply: replyText, status: 'resolved' });
            setTickets(tickets.map(ticket => ticket._id === selectedTicket._id ? res.data : ticket));
            setSelectedTicket(res.data);
            setReplyText("");
            toast.success("Reply sent and ticket resolved!");
        } catch (err) {
            console.error("Failed to send reply:", err);
            toast.error("Failed to send reply");
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            open: "bg-blue-100 text-blue-700",
            in_progress: "bg-yellow-100 text-yellow-700",
            resolved: "bg-green-100 text-green-700",
            closed: "bg-gray-100 text-gray-700"
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${styles[status] || styles.open}`}>
                {status?.replace('_', ' ') || 'open'}
            </span>
        );
    };

    const filteredTickets = tickets.filter(ticket => {
        if (!ticket) return false;

        const matchesSearch =
            ticket?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket?.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket?.issueCategory?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || ticket?.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Support Tickets</h1>
                    <p className="text-slate-500">Manage customer support inquiries</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="text-slate-400 w-5 h-5" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-48 px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User Info</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold">Message</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-10 text-center text-slate-400">Loading tickets...</td></tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr><td colSpan="6" className="p-10 text-center text-slate-400">No tickets found</td></tr>
                            ) : filteredTickets.map((ticket) => (
                                <tr key={ticket._id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-800">{ticket.name}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Mail size={12} /> {ticket.email}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-slate-600 capitalize">{ticket.userType}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700 capitalize">{ticket.issueCategory}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-600 max-w-xs truncate" title={ticket.message}>{ticket.message}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock size={14} />
                                            {ticket.createdAt ? format(new Date(ticket.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={ticket.status}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => updateTicketStatus(ticket._id, e.target.value)}
                                            className={`px-2 py-1 rounded-full text-xs font-semibold uppercase cursor-pointer outline-none border-none
                                                ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                                    ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                                        ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-700'}`}
                                        >
                                            <option value="open" className="bg-white text-slate-800">Open</option>
                                            <option value="in_progress" className="bg-white text-slate-800">In Progress</option>
                                            <option value="resolved" className="bg-white text-slate-800">Resolved</option>
                                            <option value="closed" className="bg-white text-slate-800">Closed</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelectedTicket(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">Ticket Details</h3>
                                <p className="text-xs text-slate-500">Submitted on {selectedTicket.createdAt ? format(new Date(selectedTicket.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">

                            {/* User Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Customer Name</p>
                                    <p className="font-medium text-slate-700 flex items-center gap-2"><User size={16} className="text-blue-500" /> {selectedTicket.name}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                                    <p className="font-medium text-slate-700 flex items-center gap-2"><Mail size={16} className="text-blue-500" /> {selectedTicket.email}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">User Role</p>
                                    <p className="font-medium text-slate-700 capitalize">{selectedTicket.userType}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Issue Category</p>
                                    <p className="font-medium text-slate-700 flex items-center gap-2"><Tag size={16} className="text-emerald-500" /> <span className="capitalize">{selectedTicket.issueCategory}</span></p>
                                </div>
                            </div>

                            {/* Message Area */}
                            <div>
                                <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                                    <MessageSquare size={18} className="text-purple-500" />
                                    Detailed Message
                                </h4>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px]">
                                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                                        {selectedTicket.message}
                                    </p>
                                </div>
                            </div>

                            {/* Admin Reply Area */}
                            <div>
                                <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                                    <CheckCircle size={18} className="text-emerald-500" />
                                    Admin Reply
                                </h4>
                                {selectedTicket.adminReply ? (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                                            {selectedTicket.adminReply}
                                        </p>
                                        <p className="text-xs text-emerald-600 mt-2 italic">
                                            Replied on {selectedTicket.adminReplyDate ? format(new Date(selectedTicket.adminReplyDate), 'MMM dd, yyyy HH:mm') : 'N/A'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Write your reply to the user here..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[100px]"
                                        ></textarea>
                                        <button
                                            onClick={replyTicket}
                                            className="self-end px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-sm transition-colors"
                                        >
                                            Send Reply & Resolve
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Modal Footer / Actions */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Update Status:</span>
                            <div className="flex items-center gap-3">
                                <select
                                    value={selectedTicket.status}
                                    onChange={(e) => updateTicketStatus(selectedTicket._id, e.target.value)}
                                    className={`px-3 py-2 rounded-lg text-sm font-bold uppercase cursor-pointer outline-none border shadow-sm transition-all
                                        ${selectedTicket.status === 'open' ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' :
                                            selectedTicket.status === 'in_progress' ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100' :
                                                selectedTicket.status === 'resolved' ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' :
                                                    'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportTickets;

