import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../api/axios';
import { Search, MessageCircle, Send, User, Clock, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';

const LiveChat = () => {
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const activeRoomIdRef = useRef(null); // Track active room for socket listeners
    const [searchParams] = useSearchParams();
    const initialRoomId = searchParams.get('roomId');

    useEffect(() => {
        activeRoomIdRef.current = activeRoom?._id;
    }, [activeRoom?._id]);

    useEffect(() => {
        fetchRooms();

        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'https://skygloss-backend-production-3b96.up.railway.app';
        const socket = io(socketUrl);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Admin connected to chat server');
        });

        socket.on('new_message', (message) => {
            // Handle new messages globally or for active room
            if (activeRoomIdRef.current === message.roomId) {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
            }
            // Update room list last message
            setRooms(prev => prev.map(room =>
                room._id === message.roomId
                    ? { ...room, lastMessage: message.message, lastMessageAt: new Date() }
                    : room
            ).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)));
        });

        socket.on('message_notification', (data) => {
            // Can be used for toast notifications
            console.log('New message in room:', data.roomId);
            fetchRooms(); // Refresh room list to show most recent first
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/chat/rooms');
            setRooms(res.data);

            // If we have a roomId from URL, find it and join
            if (initialRoomId) {
                const targetRoom = res.data.find(r => r._id === initialRoomId);
                if (targetRoom) {
                    joinRoom(targetRoom);
                }
            }
        } catch (err) {
            console.error("Failed to fetch chat rooms:", err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const joinRoom = async (room) => {
        if (activeRoom?._id === room._id) return;

        setActiveRoom(room);
        setLoading(true);
        try {
            const res = await api.get(`/chat/room/${room._id}/messages`);
            setMessages(res.data);
            socketRef.current.emit('join_room', { roomId: room._id });
        } catch (err) {
            console.error("Failed to join room:", err);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = () => {
        if (!inputMessage.trim() || !activeRoom || !socketRef.current) return;

        socketRef.current.emit('send_message', {
            roomId: activeRoom._id,
            senderName: 'Admin',
            senderType: 'admin',
            message: inputMessage,
        });

        setInputMessage('');
    };

    return (
        <div className="h-[calc(100vh-140px)] flex bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Sidebar - Room List */}
            <div className="w-1/3 border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                        Active Chats
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading && rooms.length === 0 ? (
                        <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>
                    ) : rooms.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 text-sm">No active chats</div>
                    ) : (
                        rooms.map((room) => (
                            <div
                                key={room._id}
                                onClick={() => joinRoom(room)}
                                className={`p-4 cursor-pointer border-b border-slate-50 transition-colors ${activeRoom?._id === room._id ? 'bg-blue-50' : 'hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-slate-800 truncate">{room.userName}</span>
                                    {room.lastMessageAt && (
                                        <span className="text-[10px] text-slate-400">
                                            {format(new Date(room.lastMessageAt), 'HH:mm')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${room.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                    <p className="text-xs text-slate-500 truncate">{room.lastMessage || 'No messages yet'}</p>
                                </div>
                                <div className="mt-2 flex gap-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                                        {room.userType}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50/30">
                {activeRoom ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {activeRoom.userName[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{activeRoom.userName}</h3>
                                    <p className="text-xs text-slate-500">{activeRoom.userEmail} • {activeRoom.userType}</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={msg._id || idx}
                                    className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] ${msg.senderType === 'admin' ? 'order-2' : ''}`}>
                                        <div className={`px-4 py-2 rounded-2xl text-sm ${msg.senderType === 'admin'
                                            ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                                            : 'bg-white text-slate-800 rounded-tl-none shadow-sm border border-slate-100'
                                            }`}>
                                            <div className="text-[10px] opacity-70 mb-1">
                                                {msg.senderName}
                                            </div>
                                            {msg.message}
                                        </div>
                                        <p className={`text-[10px] mt-1 text-slate-400 ${msg.senderType === 'admin' ? 'text-right' : 'text-left'}`}>
                                            {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                                        </p>

                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-200">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type your response..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!inputMessage.trim()}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-600">Select a conversation</h3>
                        <p className="text-sm">Choose a chat from the left to start responding to users.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveChat;
