import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Filter, MoreVertical, Trash2, Ban, CheckCircle, X, Loader2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [productGroups, setProductGroups] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'distributor',
        password: '',
        phoneNumber: '',
        companyName: '',
        country: '',
        productGroup: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchProductGroups();
    }, []);

    const fetchProductGroups = async () => {
        try {
            const res = await api.get('/product-groups');
            setProductGroups(res.data);
        } catch (err) {
            console.error('Failed to fetch product groups:', err);
        }
    };

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
            toast.error('Administrator accounts cannot be deleted');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
            toast.success('User deleted successfully');
        } catch (err) {
            toast.error('Failed to delete user');
        }
    };

    const handleEdit = (user) => {
        setEditingUserId(user._id);
        setIsEditMode(true);
        setFormData({
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role || 'distributor',
            password: '', // Leave blank for edit
            phoneNumber: user.phoneNumber || '',
            companyName: user.companyName || '',
            country: user.country || '',
            productGroup: user.productGroup?._id || user.productGroup || ''
        });
        setIsAddModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingUserId(null);
        setIsEditMode(false);
        setFormData({
            email: '',
            firstName: '',
            lastName: '',
            role: 'technician',
            password: '',
            phoneNumber: '',
            companyName: '',
            country: '',
            productGroup: ''
        });
        setIsAddModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditMode) {
                // Remove password from payload if empty
                const payload = { ...formData };
                if (!payload.password) delete payload.password;

                await api.patch(`/users/${editingUserId}`, payload);
                toast.success('User updated successfully');
            } else {
                await api.post('/users', formData);
                toast.success('User created successfully');
            }

            setIsAddModalOpen(false);
            fetchUsers();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user`);
        } finally {
            setSubmitting(false);
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
                <button
                    onClick={handleOpenAddModal}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all"
                >
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
                                <th className="px-6 py-4 font-semibold">Pricing Group</th>
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
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.productGroup ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {typeof user.productGroup === 'object' ? user.productGroup.name :
                                                        productGroups.find(g => g._id === user.productGroup)?.name || 'Linked'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                    {typeof user.productGroup === 'object' ? user.productGroup.currency :
                                                        productGroups.find(g => g._id === user.productGroup)?.currency}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-300 italic">No Group</span>
                                        )}
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
                                                        onClick={() => handleEdit(user)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
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

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold">{isEditMode ? 'Edit User' : 'Add New User'}</h2>
                                <p className="text-sm text-slate-500">{isEditMode ? 'Modify existing user account details' : 'Create a new user account for the platform'}</p>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="John"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Doe"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Password {isEditMode && '(Leave blank to keep current)'}</label>
                                    <input
                                        type="password"
                                        required={!isEditMode}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Role</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="distributor">Distributor</option>
                                        <option value="shop">Shop</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="+1 (234) 567-890"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Country</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="USA"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Product Pricing Group</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                                        value={formData.productGroup}
                                        onChange={(e) => setFormData({ ...formData, productGroup: e.target.value })}
                                    >
                                        <option value="">None (Standard Pricing)</option>
                                        {productGroups.map(group => (
                                            <option key={group._id} value={group._id}>
                                                {group.name} ({group.currency})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditMode ? 'Update User' : 'Create User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
