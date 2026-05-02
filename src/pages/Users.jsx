import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { Country, State, City } from 'country-state-city';
import { Search, Filter, MoreVertical, Trash2, Ban, CheckCircle, X, Loader2, Edit, Trophy, Video, Globe, Facebook, Instagram, Youtube, Linkedin, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

const normalizeUrl = (url) => {
    if (!url || url.trim() === '') return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
};

const normalizeName = (name) => {
    if (!name) return '';
    return name
        .normalize('NFD') // Separate characters from diacritics
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/ı/g, 'i') // Special handling for Turkish dotless i
        .replace(/İ/g, 'I'); // Special handling for Turkish dotted I
};

const COURSE_STEPS = {
    WELCOME_TO_SKYGLOSS: 18,
    UNDERSTANDING_SKYGLOSS: 9,
    SKYGLOSS_SHOP_SETUP: 4,
    FUSION: 20,
    RESIN_FILM: 7,
    SHINE: 6,
    MATTE: 6,
    SEAL: 5,
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
    const [countryFilter, setCountryFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
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
        partnerCode: '',
        isPartnerPaid: false,
        website: '',
        facebook: '',
        instagram: '',
        youtube: '',
        tiktok: '',
        linkedin: '',
        referredByPartnerCode: '',
        hearAboutUs: ''
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

    const getResolvedProductGroup = (user) => {
        if (!user) return null;

        // 1. Explicitly assigned (populated object from backend)
        if (user.productGroup) {
            if (typeof user.productGroup === 'object' && user.productGroup.name) {
                return user.productGroup;
            }
            // Raw string ID fallback
            const groupId = user.productGroup.toString();
            const found = productGroups.find(g => g._id?.toString() === groupId);
            if (found) return found;
        }

        // 2. Display fallback: match by country (not saved to DB, only for display)
        if (user.country && productGroups.length > 0) {
            const countryMatch = productGroups.find(
                g => (Array.isArray(g.countries) && g.countries.includes(user.country)) || g.country === user.country
            );
            if (countryMatch) return { ...countryMatch, _displayOnly: true };

            const defaultGroup = productGroups.find(g => g.isDefault);
            if (defaultGroup) return { ...defaultGroup, _displayOnly: true };
        }

        return null;
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

    const handleCertificationToggle = async (user) => {
        try {
            const newCertStatus = !user.isCertified;
            await api.patch(`/users/${user._id}`, { isCertified: newCertStatus });
            toast.success(`User certification ${newCertStatus ? 'Approved' : 'Removed'}`);
            fetchUsers();
        } catch (err) {
            toast.error('Failed to update certification status');
        }
    };

    const handlePaymentToggle = async (user) => {
        try {
            const newPaidStatus = !user.isPartnerPaid;
            const payload = { isPartnerPaid: newPaidStatus };

            // If marking as paid, also set status to active
            if (newPaidStatus) {
                payload.status = 'active';
            }

            await api.patch(`/users/${user._id}`, payload);
            toast.success(`User marked as ${newPaidStatus ? 'Paid' : 'Unpaid'}`);
            fetchUsers();
        } catch (err) {
            toast.error('Failed to update payment status');
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
            partnerCode: user.partnerCode || '',
            isPartnerPaid: user.isPartnerPaid || false,
            website: user.website || '',
            facebook: user.facebook || '',
            instagram: user.instagram || '',
            youtube: user.youtube || '',
            tiktok: user.tiktok || '',
            linkedin: user.linkedin || '',
            referredByPartnerCode: user.referredByPartnerCode || '',
            hearAboutUs: user.hearAboutUs || ''
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
            partnerCode: '',
            isPartnerPaid: false,
            website: '',
            facebook: '',
            instagram: '',
            youtube: '',
            tiktok: '',
            linkedin: '',
            hearAboutUs: ''
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

        // Normalize URLs
        finalFormData.website = normalizeUrl(finalFormData.website);
        finalFormData.facebook = normalizeUrl(finalFormData.facebook);
        finalFormData.instagram = normalizeUrl(finalFormData.instagram);
        finalFormData.youtube = normalizeUrl(finalFormData.youtube);
        finalFormData.tiktok = normalizeUrl(finalFormData.tiktok);
        finalFormData.linkedin = normalizeUrl(finalFormData.linkedin);

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

                // Sync status if paid
                if (payload.isPartnerPaid) {
                    payload.status = 'active';
                }

                await api.patch(`/users/${editingUserId}`, payload);
                toast.success('User updated successfully');
            } else {
                // Sync status if paid
                if (finalFormData.isPartnerPaid) {
                    finalFormData.status = 'active';
                }
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

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email?.toLowerCase().includes(filter.toLowerCase()) ||
            user.role?.toLowerCase().includes(filter.toLowerCase()) ||
            (user.firstName + ' ' + user.lastName).toLowerCase().includes(filter.toLowerCase()) ||
            user.partnerCode?.toLowerCase().includes(filter.toLowerCase());
        const matchesCountry = countryFilter ? user.country === countryFilter : true;
        const matchesRole = roleFilter ? user.role === roleFilter : true;
        return matchesSearch && matchesCountry && matchesRole;
    });

    const uniqueCountries = [...new Set(users.map(u => u.country).filter(Boolean))].sort();

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
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, email, role or ID..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600 min-w-[150px]"
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                    >
                        <option value="">All Countries</option>
                        {uniqueCountries.map(country => (
                            <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                    <select
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600 min-w-[150px]"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="master_partner">Master Partner</option>
                        <option value="regional_partner">Regional Partner</option>
                        <option value="partner">Partner</option>
                        <option value="certified_shop">Certified Shop</option>
                        <option value="admin">Administrator</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "150px" }}>Partner ID</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "200px" }}>Role</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "200px" }}>Product Pricing Group</th>
                                <th className="px-6 py-4 font-semibold" style={{ minWidth: "200px" }}>Assigned Partner</th>
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
                                        {(['master_partner', 'regional_partner', 'partner'].includes(user.role) && user.partnerCode) ? (
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
                                        {(() => {
                                            const resolvedGroup = getResolvedProductGroup(user);
                                            return resolvedGroup ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">
                                                        {resolvedGroup.name || 'Linked'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                        {resolvedGroup._displayOnly ? '(auto)' : (resolvedGroup.currency || '')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-300 italic">None (Standard Pricing)</span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.referredByPartnerCode ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {user.referredByPartnerCode}
                                                </span>
                                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                    Code
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-300 italic">None</span>
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
                                            <span className={`text-sm font-bold ${getCompletedCoursesCount(user) === 8 ? 'text-amber-500' : 'text-slate-700'}`}>
                                                {getCompletedCoursesCount(user)}/8
                                            </span>
                                            {getCompletedCoursesCount(user) === 8 && (
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
                                        {user.role !== 'admin' && !['master_partner', 'regional_partner', 'partner'].includes(user.role) ? (
                                            <div className="flex flex-col items-start gap-1">
                                                <button
                                                    onClick={() => handlePaymentToggle(user)}
                                                    className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${user.isPartnerPaid
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                                        : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                        }`}
                                                    title={`Click to mark as ${user.isPartnerPaid ? 'Unpaid' : 'Paid'}`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${user.isPartnerPaid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    {user.isPartnerPaid ? 'Paid' : 'Unpaid'}
                                                    {!user.isSelfRegistered && (
                                                        <span className="opacity-40 text-[8px] italic ml-1">(Admin Created)</span>
                                                    )}
                                                </button>
                                                {(user.couponCode || (user.isSelfRegistered && user.isPartnerPaid && !user.stripeSessionId)) && (
                                                    <span className="text-[10px] font-medium text-slate-400 italic lowercase ml-1">
                                                        registered with coupon code
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 text-sm font-medium ${user.status === 'active' ? 'text-emerald-600' :
                                            user.status === 'pending' ? 'text-orange-500' :
                                                'text-red-500'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${user.isCertified ? 'bg-emerald-500' :
                                                user.isTrainingComplete ? 'bg-amber-500' :
                                                    user.status === 'active' ? 'bg-emerald-500' :
                                                        user.status === 'pending' ? 'bg-orange-500' :
                                                            'bg-red-500'
                                                }`} />
                                            {user.isCertified ? 'SkyGloss Certified' :
                                                user.isTrainingComplete ? 'Pending Approval' :
                                                    user.status === 'active' ? 'Active' : user.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Full administrative control enabled for all roles */}
                                            {user.role === 'certified_shop' && (
                                                <button
                                                    onClick={() => handleCertificationToggle(user)}
                                                    className={`p-2 rounded-lg transition-colors ${user.isCertified ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-400 hover:bg-slate-50'}`}
                                                    title={user.isCertified ? "Remove Certification" : "Approve Certification"}
                                                >
                                                    <Trophy size={18} fill={user.isCertified ? "currentColor" : "none"} />
                                                </button>
                                            )}
                                            {user.status !== 'active' && (
                                                <button
                                                    onClick={() => handleStatusChange(user._id, user.role, 'active')}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                    title="Activate User"
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
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 max-h-[75vh] overflow-y-auto">
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
                            {['master_partner', 'regional_partner', 'partner'].includes(formData.role) && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Partner Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required={['master_partner', 'regional_partner', 'partner'].includes(formData.role)}
                                        maxLength={10}
                                        pattern="[a-zA-Z0-9]{4,10}"
                                        readOnly={false}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 uppercase"
                                        placeholder="1234567890"
                                        value={formData.partnerCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
                                            setFormData({ ...formData, partnerCode: val });
                                        }}
                                    />
                                    {!isEditMode && <p className="text-[10px] text-slate-400">Enter a unique 4-10 character code for this partner.</p>}
                                </div>
                            )}

                            {/* Assigned Partner Field - For shops, allows admin to assign them to a partner */}
                            {formData.role === 'certified_shop' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Assigned To Partner
                                    </label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={formData.referredByPartnerCode}
                                        onChange={(e) => {
                                            setFormData({ ...formData, referredByPartnerCode: e.target.value });
                                        }}
                                    >
                                        <option value="">No Partner (None)</option>
                                        <option value="GLOBAL77">Global Partner (GLOBAL77)</option>
                                        {users
                                            .filter(u => ['master_partner', 'regional_partner', 'partner'].includes(u.role) && u.partnerCode && u.partnerCode !== 'GLOBAL77')
                                            .map(p => (
                                                <option key={p.partnerCode} value={p.partnerCode}>
                                                    {p.firstName} {p.lastName} ({p.partnerCode})
                                                </option>
                                            ))
                                        }
                                    </select>
                                    <p className="text-[10px] text-slate-400">Select the partner who should manage this shop. Leave empty if none.</p>
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

                                                {/* Payment & Status Section */}
                            {!['master_partner', 'regional_partner', 'partner'].includes(formData.role) && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm font-semibold text-slate-700">Payment Status</label>
                                            <div className="group relative">
                                                <Info size={14} className="text-slate-400" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    Manually marking a user as PAID will also set their status to CERTIFIED.
                                                </div>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formData.isPartnerPaid}
                                                onChange={(e) => setFormData({ ...formData, isPartnerPaid: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            <span className={`ml-3 text-xs font-bold uppercase transition-colors ${formData.isPartnerPaid ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {formData.isPartnerPaid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}            </div>

                            {/* Online Presence & Socials */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Online Presence</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                            <Globe size={14} /> Website
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="https://..."
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                            <Facebook size={14} /> Facebook
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Profile URL / Username"
                                            value={formData.facebook}
                                            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                            <Instagram size={14} /> Instagram
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="@username"
                                            value={formData.instagram}
                                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                            <Youtube size={14} /> YouTube
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Channel URL"
                                            value={formData.youtube}
                                            onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                            <Linkedin size={14} /> LinkedIn
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="LinkedIn URL"
                                            value={formData.linkedin}
                                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                            <Video size={14} /> TikTok
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="@tiktok_handle"
                                            value={formData.tiktok}
                                            onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
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
