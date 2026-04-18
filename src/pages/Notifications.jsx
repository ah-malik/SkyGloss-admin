import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Package, ShieldCheck, MessageSquare, Clock, CheckCircle2, Search, Filter, Trash2, Calendar, Video } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { format } from 'date-fns';

const Notifications = () => {
    const { notifications, markAsRead, markAllAsRead } = useNotifications();
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const getIcon = (type) => {
        switch (type) {
            case 'ORDER_PLACED':
            case 'ORDER_PAID':
                return <Package size={20} className="text-blue-500" />;
            case 'CERT_REQUEST':
            case 'CERT_PAID':
                return <ShieldCheck size={20} className="text-emerald-500" />;
            case 'CERT_VIDEO_UPLOADED':
                return <Video size={20} className="text-pink-500" />;
            case 'CHAT_MESSAGE':
                return <MessageSquare size={20} className="text-purple-500" />;
            default:
                return <Bell size={20} className="text-slate-400" />;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all' ||
            (filter === 'unread' && !n.isRead) ||
            (filter === 'orders' && n.type.includes('ORDER')) ||
            (filter === 'certs' && n.type.includes('CERT')) ||
            (filter === 'chat' && n.type === 'CHAT_MESSAGE');

        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Activity History</h1>
                    <p className="text-slate-500 mt-1">Manage and view all platform notifications</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-sm font-semibold shadow-sm"
                    >
                        <CheckCircle2 size={16} />
                        Mark all as read
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Filter className="text-slate-400 w-4 h-4 mr-1 hidden md:block" />
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'unread', label: 'Unread' },
                        { id: 'orders', label: 'Orders' },
                        { id: 'certs', label: 'Certs' },
                        { id: 'chat', label: 'Chat' }
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === f.id
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
                {filteredNotifications.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No notifications found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">
                            Try adjusting your filters or search terms to find what you're looking for.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`p-6 flex flex-col md:flex-row md:items-center gap-4 transition-colors hover:bg-slate-50/50 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${!notification.isRead ? 'bg-blue-100/50' : 'bg-slate-100'
                                    }`}>
                                    {getIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`text-base ${!notification.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                                            {notification.title}
                                        </h4>
                                        {!notification.isRead && (
                                            <span className="px-2 py-0.5 bg-blue-600 text-[10px] font-bold text-white rounded-full uppercase tracking-wider">New</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">{notification.message}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Calendar size={14} />
                                            {format(new Date(notification.createdAt), 'MMM d, yyyy • HH:mm')}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {notification.link && (
                                        <Link
                                            to={notification.link}
                                            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                                        >
                                            View Resource
                                        </Link>
                                    )}
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsRead(notification._id)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Mark as read"
                                        >
                                            <CheckCircle2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
