import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Filter, MoreVertical, Trash2, Ban, CheckCircle } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (userId, userRole, newStatus) => {
        if (userRole === 'admin') {
            alert('Administrator status cannot be changed');
            return;
        }
        try {
            await api.patch(`/users/${userId}`, { status: newStatus });
            fetchUsers(); // Refresh
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (userId, userRole) => {
        if (userRole === 'admin') {
            alert('Administrator accounts cannot be deleted');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
            alert('User deleted successfully');
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(filter.toLowerCase()) ||
        user.role?.toLowerCase().includes(filter.toLowerCase()) ||
        (user.firstName + ' ' + user.lastName).toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-slate-500">Manage all registered users and their permissions</p>
                </div>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">
                    Add New User
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, email or role..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Country</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400">Loading users...</td></tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                                {user.firstName?.[0] || user.role?.[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{user.firstName} {user.lastName}</p>
                                                <p className="text-sm text-slate-500">{user.email || 'No email'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'distributor' ? 'bg-blue-100 text-blue-700' :
                                                user.role === 'shop' ? 'bg-emerald-100 text-emerald-700' :
                                                    user.role === 'technician' ? 'bg-cyan-100 text-cyan-700' :
                                                        'bg-orange-100 text-orange-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{user.country || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 text-sm font-medium ${user.status === 'active' ? 'text-emerald-600' :
                                            user.status === 'pending' ? 'text-orange-500' :
                                                'text-red-500'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' :
                                                user.status === 'pending' ? 'bg-orange-500' :
                                                    'bg-red-500'
                                                }`} />
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {user.role !== 'admin' ? (
                                                <>
                                                    {user.status !== 'active' && (
                                                        <button
                                                            onClick={() => handleStatusChange(user._id, user.role, 'active')}
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                            title="Activate"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    {user.status !== 'blocked' && (
                                                        <button
                                                            onClick={() => handleStatusChange(user._id, user.role, 'blocked')}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                                                            title="Block"
                                                        >
                                                            <Ban size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(user._id, user.role)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-slate-400 font-medium px-2 py-1">Protected</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Users;
