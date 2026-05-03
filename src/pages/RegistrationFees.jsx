import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Plus, X, CreditCard, Trash2, Edit2, Check, ChevronRight, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const RegistrationFees = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [feeAmount, setFeeAmount] = useState(250);
    const [currency, setCurrency] = useState('USD');
    const [selectedCountries, setSelectedCountries] = useState([]);
    const [isDefault, setIsDefault] = useState(false);
    const [countrySearchModal, setCountrySearchModal] = useState('');

    const currencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
        { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
        { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
        { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
        { code: 'AFN', symbol: '؋', name: 'Afghan Afghani' },
        { code: 'ALL', symbol: 'L', name: 'Albanian Lek' },
        { code: 'AMD', symbol: '֏', name: 'Armenian Dram' },
        { code: 'ANG', symbol: 'ƒ', name: 'Netherlands Antillean Guilder' },
        { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza' },
        { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
        { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat' },
        { code: 'BAM', symbol: 'KM', name: 'Bosnia-Herzegovina Mark' },
        { code: 'BBD', symbol: '$', name: 'Barbadian Dollar' },
        { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
        { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev' },
        { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
        { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc' },
        { code: 'BMD', symbol: '$', name: 'Bermudian Dollar' },
        { code: 'BND', symbol: '$', name: 'Brunei Dollar' },
        { code: 'BOB', symbol: '$b', name: 'Bolivian Boliviano' },
        { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
        { code: 'BSD', symbol: '$', name: 'Bahamian Dollar' },
        { code: 'BTN', symbol: 'Nu.', name: 'Bhutanese Ngultrum' },
        { code: 'BWP', symbol: 'P', name: 'Botswanan Pula' },
        { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble' },
        { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar' },
        { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
        { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
        { code: 'COP', symbol: '$', name: 'Colombian Peso' },
        { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón' },
        { code: 'CUP', symbol: '₱', name: 'Cuban Peso' },
        { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo' },
        { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
        { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc' },
        { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
        { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso' },
        { code: 'DZD', symbol: 'دج', name: 'Algerian Dinar' },
        { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
        { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
        { code: 'FJD', symbol: '$', name: 'Fijian Dollar' },
        { code: 'GEL', symbol: '₾', name: 'Georgian Lari' },
        { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
        { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi' },
        { code: 'GNF', symbol: 'FG', name: 'Guinean Franc' },
        { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal' },
        { code: 'GYD', symbol: '$', name: 'Guyanese Dollar' },
        { code: 'HKD', symbol: '$', name: 'Hong Kong Dollar' },
        { code: 'HNL', symbol: 'L', name: 'Honduran Lempira' },
        { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna' },
        { code: 'HTG', symbol: 'G', name: 'Haitian Gourde' },
        { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
        { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
        { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel' },
        { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar' },
        { code: 'IRR', symbol: '﷼', name: 'Iranian Rial' },
        { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna' },
        { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar' },
        { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar' },
        { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
        { code: 'KGS', symbol: 'лв', name: 'Kyrgystani Som' },
        { code: 'KHR', symbol: '៛', name: 'Cambodian Riel' },
        { code: 'KMF', symbol: 'CF', name: 'Comorian Franc' },
        { code: 'KPW', symbol: '₩', name: 'North Korean Won' },
        { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
        { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
        { code: 'KYD', symbol: '$', name: 'Cayman Islands Dollar' },
        { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge' },
        { code: 'LAK', symbol: '₭', name: 'Laotian Kip' },
        { code: 'LBP', symbol: '£', name: 'Lebanese Pound' },
        { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee' },
        { code: 'LRD', symbol: '$', name: 'Liberian Dollar' },
        { code: 'LSL', symbol: 'L', name: 'Lesotho Loti' },
        { code: 'LYD', symbol: 'LD', name: 'Libyan Dinar' },
        { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
        { code: 'MDL', symbol: 'lei', name: 'Moldovan Leu' },
        { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary' },
        { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar' },
        { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat' },
        { code: 'MNT', symbol: '₮', name: 'Mongolian Tugrik' },
        { code: 'MOP', symbol: 'MOP$', name: 'Macanese Pataca' },
        { code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya' },
        { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee' },
        { code: 'MVR', symbol: '.ރ', name: 'Maldivian Rufiyaa' },
        { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha' },
        { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
        { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
        { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical' },
        { code: 'NAD', symbol: '$', name: 'Namibian Dollar' },
        { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
        { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba' },
        { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
        { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee' },
        { code: 'NZD', symbol: '$', name: 'New Zealand Dollar' },
        { code: 'OMR', symbol: '﷼', name: 'Omani Rial' },
        { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa' },
        { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol' },
        { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina' },
        { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
        { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
        { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
        { code: 'PYG', symbol: 'Gs', name: 'Paraguayan Guarani' },
        { code: 'QAR', symbol: '﷼', name: 'Qatari Rial' },
        { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
        { code: 'RSD', symbol: 'Дин.', name: 'Serbian Dinar' },
        { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
        { code: 'RWF', symbol: 'R₣', name: 'RWandian Franc' },
        { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
        { code: 'SBD', symbol: '$', name: 'Solomon Islands Dollar' },
        { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee' },
        { code: 'SDG', symbol: 'ج.س.', name: 'Sudanese Pound' },
        { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
        { code: 'SGD', symbol: '$', name: 'Singapore Dollar' },
        { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone' },
        { code: 'SOS', symbol: 'S', name: 'Somali Shilling' },
        { code: 'SRD', symbol: '$', name: 'Surinamese Dollar' },
        { code: 'SSP', symbol: '£', name: 'South Sudanese Pound' },
        { code: 'STN', symbol: 'Db', name: 'São Tomé and Príncipe Dobra' },
        { code: 'SYP', symbol: '£', name: 'Syrian Pound' },
        { code: 'SZL', symbol: 'L', name: 'Swazi Lilangeni' },
        { code: 'THB', symbol: '฿', name: 'Thai Baht' },
        { code: 'TJS', symbol: 'SM', name: 'Tajikistani Somoni' },
        { code: 'TMT', symbol: 'T', name: 'Turkmenistani Manat' },
        { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' },
        { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga' },
        { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
        { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar' },
        { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar' },
        { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
        { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia' },
        { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
        { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso' },
        { code: 'UZS', symbol: 'лв', name: 'Uzbekistani Som' },
        { code: 'VES', symbol: 'Bs.S', name: 'Venezuelan Bolívar Soberano' },
        { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
        { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu' },
        { code: 'WST', symbol: 'WS$', name: 'Samoan Tala' },
        { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc' },
        { code: 'XCD', symbol: '$', name: 'East Caribbean Dollar' },
        { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
        { code: 'XPF', symbol: '₣', name: 'CFP Franc' },
        { code: 'YER', symbol: '﷼', name: 'Yemeni Rial' },
        { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
        { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
        { code: 'ZWL', symbol: '$', name: 'Zimbabwean Dollar' },
    ].sort((a, b) => a.code.localeCompare(b.code));

    const countriesList = [
        "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
    ].sort();

    const getSymbol = (code) => currencies.find(c => c.code === code)?.symbol || '$';

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/registration-fees');
            setGroups(res.data);
        } catch (err) {
            console.error('Fetch groups error:', err);
            toast.error('Failed to load registration fees');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (group = null) => {
        if (group) {
            setEditingGroup(group);
            setGroupName(group.name);
            setFeeAmount(group.feeAmount);
            setCurrency(group.currency || 'USD');
            setSelectedCountries(group.countries || []);
            setIsDefault(group.isDefault || false);
        } else {
            setEditingGroup(null);
            setGroupName('');
            setFeeAmount(250);
            setCurrency('USD');
            setSelectedCountries([]);
            setIsDefault(false);
        }
        setCountrySearchModal('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return toast.error('Please enter group name');

        const payload = {
            name: groupName,
            feeAmount: parseFloat(feeAmount),
            currency: currency,
            countries: selectedCountries,
            isDefault: isDefault,
            isActive: true
        };

        try {
            if (editingGroup) {
                await api.patch(`/registration-fees/${editingGroup._id}`, payload);
                toast.success('Fee group updated');
            } else {
                await api.post('/registration-fees', payload);
                toast.success('Fee group created');
            }
            await fetchGroups();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Submit error:', err.response?.data || err);
            toast.error(err.response?.data?.message || 'Failed to save group');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this registration fee group?')) {
            try {
                await api.delete(`/registration-fees/${id}`);
                toast.success('Group deleted');
                fetchGroups();
            } catch (err) {
                console.error('Delete error:', err);
                toast.error('Failed to delete group');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Registration Fees</h1>
                    <p className="text-slate-500">Manage country-specific shop registration fees</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium shadow-lg hover:bg-blue-500 transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Fee Group
                </button>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <div className="text-center p-10 text-slate-400">Loading fees...</div>
                ) : groups.length === 0 ? (
                    <div className="text-center p-10 bg-white rounded-2xl border border-slate-200 text-slate-400">
                        No registration fee groups created yet. Default fee of $250 will apply.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map(group => (
                            <div key={group._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                <div className="p-6 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-slate-900">{group.name}</h3>
                                            {group.isDefault && (
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Default</span>
                                            )}
                                        </div>
                                        <p className="text-3xl font-black text-blue-600">
                                            {getSymbol(group.currency)}{group.feeAmount}
                                            <span className="text-sm font-normal text-slate-400 ml-1 uppercase">{group.currency}</span>
                                            <span className="block text-[10px] text-slate-400 font-medium">{currencies.find(c => c.code === group.currency)?.name}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleOpenModal(group)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(group._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div className="px-6 pb-6 flex-1">
                                    <div className="pt-4 border-t border-slate-50">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Applicable Countries</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {group.countries && group.countries.length > 0 ? (
                                                group.countries.map(c => (
                                                    <span key={c} className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200/50">{c}</span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic text-sm">No specific countries (Global)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h2 className="text-xl font-bold text-slate-900">{editingGroup ? 'Edit Fee Group' : 'Create New Fee Group'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Group Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                        placeholder="e.g. South Asia Region"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Fee Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{getSymbol(currency)}</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-bold text-blue-600"
                                            value={feeAmount}
                                            onChange={(e) => setFeeAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Currency</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none"
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                    >
                                        {currencies.map(c => (
                                            <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Target Countries</label>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Type to search countries..."
                                                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                                                value={countrySearchModal}
                                                onChange={(e) => setCountrySearchModal(e.target.value)}
                                            />
                                        </div>

                                        {/* Filtered Country List */}
                                        <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/30 p-2 custom-scrollbar">
                                            <div className="grid grid-cols-2 gap-2">
                                                {countriesList
                                                    .filter(c => c.toLowerCase().includes(countrySearchModal.toLowerCase()))
                                                    .map(c => {
                                                        const isSelected = selectedCountries.includes(c);
                                                        return (
                                                            <button
                                                                key={c}
                                                                type="button"
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setSelectedCountries(selectedCountries.filter(item => item !== c));
                                                                    } else {
                                                                        setSelectedCountries([...selectedCountries, c]);
                                                                    }
                                                                }}
                                                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                                                    isSelected 
                                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                                                                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                                                                }`}
                                                            >
                                                                <span className="truncate">{c}</span>
                                                                {isSelected ? <Check size={14} /> : <Plus size={14} className="text-slate-300" />}
                                                            </button>
                                                        );
                                                    })
                                                }
                                                {countriesList.filter(c => c.toLowerCase().includes(countrySearchModal.toLowerCase())).length === 0 && (
                                                    <div className="col-span-2 py-4 text-center text-sm text-slate-400 italic">No countries found</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Selected Summary Badge List */}
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {selectedCountries.length > 0 && (
                                                <div className="w-full flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected ({selectedCountries.length})</span>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setSelectedCountries([])}
                                                        className="text-[10px] font-bold text-red-500 hover:underline uppercase"
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            )}
                                            {selectedCountries.map(c => (
                                                <span key={c} className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-2">
                                                    {c}
                                                    <button type="button" onClick={() => setSelectedCountries(selectedCountries.filter(item => item !== c))} className="hover:text-red-500">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            ))}
                                            {selectedCountries.length === 0 && <span className="text-xs text-slate-400 italic">No countries selected (Applies to all unmatched regions)</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="flex items-center gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                            checked={isDefault}
                                            onChange={(e) => setIsDefault(e.target.checked)}
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-amber-900">Set as Default Group</p>
                                            <p className="text-xs text-amber-700/70">This fee will apply to all countries not covered by other groups.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-10 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-blue-500/20 transition-all flex items-center gap-2"
                                >
                                    {editingGroup ? 'Update Settings' : 'Create Fee Group'}
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistrationFees;
