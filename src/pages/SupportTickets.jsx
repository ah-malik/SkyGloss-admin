import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Search, Filter, MessageSquare, Mail, User, Tag, Clock, CheckCircle, X, Send } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const SupportTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedTicket?.messages]);

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

    const sendMessage = async () => {
        if (!replyText.trim() || sending) return;
        setSending(true);
        try {
            const res = await api.post(`/support/${selectedTicket._id}/messages`, {
                sender: 'admin',
                content: replyText.trim(),
            });
            setTickets(tickets.map(ticket => ticket._id === selectedTicket._id ? res.data : ticket));
            setSelectedTicket(res.data);
            setReplyText("");
            toast.success("Message sent!");
        } catch (err) {
            console.error("Failed to send message:", err);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
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

    // Build chat messages from ticket data (backward-compatible)
    const getChatMessages = (ticket) => {
        if (!ticket) return [];
        // If ticket has messages array, use it
        if (ticket.messages && ticket.messages.length > 0) {
            return ticket.messages;
        }
        // Fallback: build from legacy fields
        const msgs = [];
        if (ticket.message) {
            msgs.push({ sender: 'user', content: ticket.message, timestamp: ticket.createdAt });
        }
        if (ticket.adminReply) {
            msgs.push({ sender: 'admin', content: ticket.adminReply, timestamp: ticket.adminReplyDate || ticket.updatedAt });
        }
        return msgs;
    };

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

            {/* Ticket Chat Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelectedTicket(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col"
                        style={{ height: '80vh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{selectedTicket.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>{selectedTicket.email}</span>
                                        <span>·</span>
                                        <span className="capitalize">{selectedTicket.issueCategory}</span>
                                        <span>·</span>
                                        <StatusBadge status={selectedTicket.status} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedTicket.status}
                                    onChange={(e) => updateTicketStatus(selectedTicket._id, e.target.value)}
                                    className="px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer outline-none border border-slate-200 bg-white"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                            {getChatMessages(selectedTicket).map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                        msg.sender === 'admin'
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        <p className={`text-[10px] mt-1 ${msg.sender === 'admin' ? 'text-blue-200' : 'text-slate-400'}`}>
                                            {msg.timestamp ? format(new Date(msg.timestamp), 'MMM dd, HH:mm') : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
                            <div className="flex items-end gap-2">
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your reply..."
                                    rows={1}
                                    className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-h-[120px]"
                                    style={{ minHeight: '44px' }}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!replyText.trim() || sending}
                                    className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportTickets;
