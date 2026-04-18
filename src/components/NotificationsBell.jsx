import React, { useState, useRef, useEffect } from 'react';
import { Bell, Package, ShieldCheck, MessageSquare, Clock, CheckCircle2, Video } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const NotificationsBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'ORDER_PLACED':
            case 'ORDER_PAID':
                return <Package size={16} className="text-blue-500" />;
            case 'CERT_REQUEST':
            case 'CERT_PAID':
                return <ShieldCheck size={16} className="text-emerald-500" />;
            case 'CERT_VIDEO_UPLOADED':
                return <Video size={16} className="text-pink-500" />;
            case 'CHAT_MESSAGE':
                return <MessageSquare size={16} className="text-purple-500" />;
            default:
                return <Bell size={16} className="text-slate-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 max-h-[480px] flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="font-bold text-slate-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group relative ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => {
                                            if (!notification.isRead) markAsRead(notification._id);
                                        }}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.isRead ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Clock size={12} className="text-slate-400" />
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-blue-500" />
                                            )}
                                        </div>
                                        {notification.link && (
                                            <Link
                                                to={notification.link}
                                                onClick={() => setIsOpen(false)}
                                                className="absolute inset-0 z-0"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                        <Link
                            to="/notifications"
                            className="text-xs font-bold text-slate-600 hover:text-slate-900"
                            onClick={() => setIsOpen(false)}
                        >
                            View all activities
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsBell;
