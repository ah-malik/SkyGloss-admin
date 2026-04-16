import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Country, State, City } from 'country-state-city';
import { Search, Filter, MoreVertical, Trash2, Ban, CheckCircle, X, Loader2, Edit, Trophy, Video } from 'lucide-react';
import { toast } from 'react-hot-toast';

const normalizeName = (name) => {
    if (!name) return '';
    return name
        .normalize('NFD') // Separate characters from diacritics
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/ı/g, 'i') // Special handling for Turkish dotless i
        .replace(/İ/g, 'I'); // Special handling for Turkish dotted I
};

const COURSE_STEPS = {
    UNDERSTANDING_SKYGLOSS: 9,
    FUSION: 13,
    RESIN_FILM: 4,
    SHINE: 3,
    MATTE: 3,
    SEAL: 3,
};

const getCompletedCoursesCount = (user) => {
    if (!user) return 0;

    let count = 0;
    const legacyCount = user.completedCourses?.length || 0;

    if (user.courseProgress) {
        Object.entries(COURSE_STEPS).forEach(([courseKey, totalSteps]) => {
            const progress = user.courseProgress[courseKey] || user.courseProgress[courseKey.replace('_', ' ')] || [];
            if (progress && progress.length >= totalSteps) {
                count++;
            }
        });
    }

    // Return whichever is higher to prevent regressions
    return Math.max(count, legacyCount);
};

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [productGroups, setProductGroups] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const countries = useMemo(() => Country.getAllCountries(), []);
    const [cities, setCities] = useState([]);
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'master_partner',
        password: '',
        phoneNumber: '',
        companyName: '',
        city: '',
        latitude: '',
        longitude: '',
        partnerCode: ''
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
        // Role-based restrictions removed to allow full admin control
        try {
            await api.patch(`/users/${userId}`, { status: newStatus });
            fetchUsers(); // Refresh
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (userId, userRole) => {
        // Role-based restrictions removed to allow full admin control

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
            role: user.role || 'master_partner',
            password: '', // Leave blank for edit
            phoneNumber: user.phoneNumber || '',
            companyName: user.companyName || '',
            country: user.country || '',
            productGroup: user.productGroup?._id || user.productGroup || '',
            address: user.address || '',
            city: user.city || '',
            latitude: user.latitude ?? '',
            longitude: user.longitude ?? '',
            partnerCode: user.partnerCode || ''
        });

        // Load cities and states for the selected country
        const countryObj = countries.find(c => c.name === user.country);
        if (countryObj) {
            const rawCities = City.getCitiesOfCountry(countryObj.isoCode) || [];
            const rawStates = State.getStatesOfCountry(countryObj.isoCode) || [];

            // Combine, normalize, and de-duplicate
            const combined = [...rawCities, ...rawStates]
                .map(item => ({
                    ...item,
                    name: normalizeName(item.name)
                }))
                .filter((item, index, self) =>
                    index === self.findIndex((t) => t.name === item.name)
                )
                .sort((a, b) => a.name.localeCompare(b.name));

            setCities(combined);
        } else {
            setCities([]);
        }
        setIsAddModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingUserId(null);
        setIsEditMode(false);
        setFormData({
            email: '',
            firstName: '',
            lastName: '',
            role: 'certified_shop',
            password: '',
            phoneNumber: '',
            companyName: '',
            country: '',
            productGroup: '',
            address: '',
            city: '',
            latitude: '',
            longitude: '',
            partnerCode: ''
        });
        setCities([]);
        setIsAddModalOpen(true);
    };

    const handleGeocode = async () => {
        if (!formData.address || !formData.city || !formData.country) {
            toast.error('Please enter address, city and country first');
            return;
        }
        try {
            const query = `${formData.address}, ${formData.city}, ${formData.country}`;
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const data = await res.json();
            if (data && data[0]) {
                setFormData({
                    ...formData,
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon)
                });
                toast.success('Coordinates found!');
            } else {
                toast.error('Coordinates not found for this location');
            }
        } catch (err) {
            toast.error('Geocoding failed');
        }
    };

    const fetchCoordinates = async (address, city, country) => {
        const fetchWithQuery = async (query) => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                    headers: {
                        'User-Agent': 'SkyGloss-Admin-Panel'
                    }
                });
                const data = await res.json();
                if (data && data[0]) {
                    return {
                        latitude: parseFloat(data[0].lat),
                        longitude: parseFloat(data[0].lon)
                    };
                }
            } catch (err) {
                console.error(`Geocoding failed for query "${query}":`, err);
            }
            return null;
        };

        // Try 1: Full Address
        let coords = await fetchWithQuery(`${address}, ${city}, ${country}`);

        // Try 2: City and Country fallback (if address search fails)
        if (!coords && (city || country)) {
            coords = await fetchWithQuery(`${city}, ${country}`);
        }

        return coords;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Auto-geocode if coordinates are missing
        let finalFormData = { ...formData };
        if (!finalFormData.latitude || !finalFormData.longitude) {
            if (finalFormData.address && finalFormData.city && finalFormData.country) {
                const coords = await fetchCoordinates(finalFormData.address, finalFormData.city, finalFormData.country);
                if (coords) {
                    finalFormData = { ...finalFormData, ...coords };
                    setFormData(finalFormData); // Update UI state too
                }
            }
        }

        // Ensure coordinates are numbers or removed if empty string
        if (finalFormData.latitude === '' || finalFormData.latitude === null || finalFormData.latitude === undefined) {
            delete finalFormData.latitude;
        } else {
            finalFormData.latitude = parseFloat(finalFormData.latitude);
        }

        if (finalFormData.longitude === '' || finalFormData.longitude === null || finalFormData.longitude === undefined) {
            delete finalFormData.longitude;
        } else {
            finalFormData.longitude = parseFloat(finalFormData.longitude);
        }

        try {
            if (isEditMode) {
                // Remove password from payload if empty
                const payload = { ...finalFormData };
                if (!payload.password) delete payload.password;

                await api.patch(`/users/${editingUserId}`, payload);
                toast.success('User updated successfully');
            } else {
                await api.post('/users', finalFormData);
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
                    <p className="text-slate-500">Manage all registered users, partners and their permissions</p>
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
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "150px" }}>Partner ID</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "200px" }}>Role</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "200px" }}>Pricing Group</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "100px" }}>Video</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "150px" }}>Courses</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "200px" }}>Address</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "200px" }}>City</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "200px" }}>Country</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "150px" }}>Lat/Lng</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "150px" }}>Payment</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "200px" }}>Status</th>
                                <th className="px-6 py-4 font-semibold text-right" style={{ minWidth: "200px" }}>Actions</th>
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
                                        {user.partnerCode ? (
                                            <span className="font-mono text-sm font-bold text-[#0EA0DC] bg-[#0EA0DC]/5 px-2 py-1 rounded">
                                                {user.partnerCode}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'master_partner' ? 'bg-indigo-100 text-indigo-700' :
                                                user.role === 'regional_partner' ? 'bg-blue-100 text-blue-700' :
                                                    user.role === 'partner' ? 'bg-sky-100 text-sky-700' :
                                                        user.role === 'certified_shop' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-slate-100 text-slate-700'
                                            }`}>
                                            {user.role?.replace(/_/g, ' ')}
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
                                    <td className="px-6 py-4">
                                        {user.certificationVideoUrl ? (
                                            <a
                                                href={user.certificationVideoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center p-2 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors w-10 h-10 shadow-sm"
                                                title="Watch Certification Video"
                                            >
                                                <Video size={18} />
                                            </a>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-bold ${getCompletedCoursesCount(user) === 6 ? 'text-amber-500' : 'text-slate-700'}`}>
                                                {getCompletedCoursesCount(user)}/6
                                            </span>
                                            {getCompletedCoursesCount(user) === 6 && (
                                                <Trophy size={16} className="text-amber-500 fill-amber-500" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-medium truncate max-w-[150px]" title={user.address}>{user.address || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{user.city || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600 font-medium">{user.country || '-'}</td>
                                    <td className="px-6 py-4 text-slate-400 text-xs tabular-nums">
                                        {(user.latitude !== undefined && user.latitude !== null && user.longitude !== undefined && user.longitude !== null) ? (
                                            <span className="text-slate-600 font-medium">{user.latitude.toFixed(2)}, {user.longitude.toFixed(2)}</span>
                                        ) : 'None'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {(user.role === 'regional_partner' || user.role === 'certified_shop') ? (
                                            !user.isSelfRegistered ? (
                                                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-wider">Admin Created</span>
                                            ) : (
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${user.isPartnerPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                    {user.isPartnerPaid ? 'Paid' : 'Unpaid'}
                                                </span>
                                            )
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
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
                                            {/* Full administrative control enabled for all roles */}
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
                                        <option value="master_partner">Master Partner</option>
                                        <option value="regional_partner">Regional Partner</option>
                                        <option value="partner">Partner</option>
                                        <option value="certified_shop">Certified Shop</option>
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

                            {/* Partner Code Field - Available for all roles in management */}
                            {(['master_partner', 'regional_partner', 'partner'].includes(formData.role) || isEditMode) && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Partner Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={10}
                                        pattern="[a-zA-Z0-9]{4,10}"
                                        readOnly={false}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="1234567890"
                                        value={formData.partnerCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
                                            setFormData({ ...formData, partnerCode: val });
                                        }}
                                    />
                                    {!isEditMode && <p className="text-[10px] text-slate-400">Enter a unique 4-10 character code for this partner.</p>}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Country <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                                        value={formData.country}
                                        onChange={(e) => {
                                            const countryName = e.target.value;
                                            const countryObj = countries.find(c => c.name === countryName);
                                            setFormData({ ...formData, country: countryName, city: '' });
                                            if (countryObj) {
                                                const rawCities = City.getCitiesOfCountry(countryObj.isoCode) || [];
                                                const rawStates = State.getStatesOfCountry(countryObj.isoCode) || [];

                                                const combined = [...rawCities, ...rawStates]
                                                    .map(item => ({
                                                        ...item,
                                                        name: normalizeName(item.name)
                                                    }))
                                                    .filter((item, index, self) =>
                                                        index === self.findIndex((t) => t.name === item.name)
                                                    )
                                                    .sort((a, b) => a.name.localeCompare(b.name));

                                                setCities(combined);
                                            } else {
                                                setCities([]);
                                            }
                                        }}
                                    >
                                        <option value="">Select Country</option>
                                        {countries.map(country => (
                                            <option key={country.isoCode} value={country.name}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">City <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none"
                                        value={formData.city}
                                        onChange={async (e) => {
                                            const cityName = e.target.value;
                                            setFormData(prev => ({ ...prev, city: cityName }));
                                            if (cityName && formData.country) {
                                                const coords = await fetchCoordinates(formData.address || '', cityName, formData.country);
                                                if (coords) {
                                                    setFormData(prev => ({ ...prev, ...coords, city: cityName }));
                                                }
                                            }
                                        }}
                                        disabled={!formData.country}
                                    >
                                        <option value="">{formData.country ? 'Select City' : 'Select Country First'}</option>
                                        {cities.map((city, index) => (
                                            <option key={`${city.name}-${index}`} value={city.name}>
                                                {city.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 items-end " style={{ "margin-bottom": "20px", "position": "absolute", "z-index": "-99999", "opacity": "0" }}>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="e.g. 33.44"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Longitude</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="e.g. -112.07"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                        />
                                        {/* <button
                                            type="button"
                                            onClick={handleGeocode}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-bold hover:bg-blue-200 transition-colors"
                                        >
                                            Get Coords
                                        </button> */}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Address <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Enter full address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        onBlur={async () => {
                                            if (formData.address && formData.city && formData.country && (formData.latitude === '' || formData.latitude === null || formData.latitude === undefined)) {
                                                const coords = await fetchCoordinates(formData.address, formData.city, formData.country);
                                                if (coords) setFormData(prev => ({ ...prev, ...coords }));
                                            }
                                        }}
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
