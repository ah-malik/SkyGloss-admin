import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const { user, token } = useAuth();

    const API_URL = import.meta.env.VITE_API_URL;
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

    useEffect(() => {
        console.log('NotificationProvider State:', {
            role: user?.role,
            hasToken: !!token,
            API_URL,
            SOCKET_URL
        });
    }, [user, token, API_URL, SOCKET_URL]);

    const fetchNotifications = useCallback(async () => {
        if (!token || user?.role !== 'admin') return;
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);

            const unread = response.data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [token, user, API_URL]);

    useEffect(() => {
        if (token && user?.role === 'admin') {
            fetchNotifications();

            const newSocket = io(SOCKET_URL, {
                auth: { token },
                // Allow both websocket and polling for better compatibility locally
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('Successfully connected to notifications socket');
            });

            newSocket.on('connect_error', (error) => {
                console.error('Notification socket connection error:', error);
            });

            newSocket.on('new_notification', (notification) => {
                console.log('Received new notification:', notification);

                setNotifications(prev => {
                    if (notification.type === 'CHAT_MESSAGE' && notification.metadata?.roomId) {
                        const existingIndex = prev.findIndex(n => n.type === 'CHAT_MESSAGE' && n.metadata?.roomId === notification.metadata?.roomId && !n.isRead);

                        if (existingIndex !== -1) {
                            // Update existing notification without incrementing unreadCount
                            const newArray = [...prev];
                            newArray[existingIndex] = notification;
                            return newArray;
                        }
                    }

                    // Brand new notification
                    setUnreadCount(c => c + 1);
                    return [notification, ...prev];
                });

                // Show toast
                toast.success(
                    <div>
                        <p className="font-bold">{notification.title}</p>
                        <p className="text-sm">{notification.message}</p>
                    </div>,
                    { duration: 5000 }
                );

                // Play sound if possible
                try {
                    const audio = new Audio('/notification-sound.mp3');
                    audio.play();
                } catch (e) {
                    // Ignore audio errors
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
    }, [token, user, SOCKET_URL, fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
