import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Plus, X, Package, Trash2, Edit2, Check, ChevronRight } from 'lucide-react';

const ProductGroups = () => {
    const [groups, setGroups] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [searchProduct, setSearchProduct] = useState('');

    useEffect(() => {
        fetchGroups();
        fetchProducts();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/product-groups');
            setGroups(res.data);
        } catch (err) {
            console.error('Fetch groups error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            const productsData = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setProducts(productsData);
        } catch (err) {
            console.error('Fetch products error:', err);
        }
    };

    const handleOpenModal = (group = null) => {
        if (group) {
            setEditingGroup(group);
            setGroupName(group.name);
            setSelectedProducts(group.products.map(p => ({
                productId: p.productId._id || p.productId,
                name: p.productId.name,
                sizes: p.sizes.map(s => ({ ...s }))
            })));
        } else {
            setEditingGroup(null);
            setGroupName('');
            setSelectedProducts([]);
        }
        setIsModalOpen(true);
    };

    const toggleProductSelection = (product) => {
        const isSelected = selectedProducts.find(p => p.productId === product._id);
        if (isSelected) {
            setSelectedProducts(selectedProducts.filter(p => p.productId !== product._id));
        } else {
            setSelectedProducts([...selectedProducts, {
                productId: product._id,
                name: product.name,
                sizes: product.sizes.map(s => ({ size: s.size, price: s.price }))
            }]);
        }
    };

    const handlePriceChange = (productId, sizeIndex, newPrice) => {
        setSelectedProducts(selectedProducts.map(p => {
            if (p.productId === productId) {
                const newSizes = [...p.sizes];
                newSizes[sizeIndex].price = parseFloat(newPrice) || 0;
                return { ...p, sizes: newSizes };
            }
            return p;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim()) return alert('Please enter group name');
        if (selectedProducts.length === 0) return alert('Please select at least one product');

        const payload = {
            name: groupName,
            products: selectedProducts.map(p => ({
                productId: p.productId,
                sizes: p.sizes
            }))
        };

        try {
            if (editingGroup) {
                await api.patch(`/product-groups/${editingGroup._id}`, payload);
            } else {
                await api.post('/product-groups', payload);
            }
            fetchGroups();
            setIsModalOpen(false);
        } catch (err) {
            console.error('Submit error:', err);
            alert('Failed to save group');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this group?')) {
            try {
                await api.delete(`/product-groups/${id}`);
                fetchGroups();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Product Groups</h1>
                    <p className="text-slate-500">Create groups with custom product pricing</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium shadow-lg hover:bg-blue-500 transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    New Group
                </button>
            </div>

            <div className="grid gap-6">
                {loading ? (
                    <div className="text-center p-10 text-slate-400">Loading grupos...</div>
                ) : groups.length === 0 ? (
                    <div className="text-center p-10 bg-white rounded-2xl border border-slate-200 text-slate-400">
                        No pricing groups created yet.
                    </div>
                ) : groups.map(group => (
                    <div key={group._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-6 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{group.name}</h3>
                                <p className="text-sm text-slate-500">{group.products.length} Products</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleOpenModal(group)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(group._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.products.map((p, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-sm font-bold text-slate-800 mb-2 truncate">{p.productId?.name}</p>
                                        <div className="space-y-1">
                                            {p.sizes.map((s, sIdx) => (
                                                <div key={sIdx} className="flex justify-between text-xs">
                                                    <span className="text-slate-500">{s.size}</span>
                                                    <span className="font-bold text-blue-600">${s.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h2 className="text-xl font-bold">{editingGroup ? 'Edit Group' : 'Create New Group'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Group Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                    placeholder="e.g. Premium Shops"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Product Selection */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-700">Select Products</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                            placeholder="Search products..."
                                            value={searchProduct}
                                            onChange={(e) => setSearchProduct(e.target.value)}
                                        />
                                    </div>
                                    <div className="h-96 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white shadow-inner">
                                        {products
                                            .filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase()))
                                            .map(product => {
                                                const isSelected = selectedProducts.find(sp => sp.productId === product._id);
                                                return (
                                                    <div
                                                        key={product._id}
                                                        onClick={() => toggleProductSelection(product)}
                                                        className={`p-3 cursor-pointer flex items-center justify-between transition-colors
                                                            ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                                                                <Package size={16} className="text-slate-400" />
                                                            </div>
                                                            <span className="text-sm font-medium">{product.name}</span>
                                                        </div>
                                                        {isSelected && <Check size={18} className="text-blue-600" />}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* Custom Pricing */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-slate-700">Set Group Pricing</label>
                                    <div className="h-[432px] overflow-y-auto space-y-4 pr-1">
                                        {selectedProducts.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                                <Package size={40} className="mb-2 opacity-50" />
                                                <p className="text-sm">Select products on the left</p>
                                            </div>
                                        ) : selectedProducts.map((product, pIdx) => (
                                            <div key={product.productId} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                                <div className="flex justify-between mb-3 border-b border-slate-50 pb-2">
                                                    <span className="text-sm font-bold text-slate-900 truncate">{product.name}</span>
                                                    <button
                                                        onClick={() => setSelectedProducts(selectedProducts.filter(sp => sp.productId !== product.productId))}
                                                        className="text-red-400 hover:text-red-600"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <div className="space-y-3">
                                                    {product.sizes.map((s, sIdx) => (
                                                        <div key={sIdx} className="flex items-center gap-3">
                                                            <span className="text-xs text-slate-500 w-20 truncate">{s.size}</span>
                                                            <div className="relative flex-1">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-full pl-6 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-blue-600 outline-none focus:border-blue-300"
                                                                    value={s.price}
                                                                    onChange={(e) => handlePriceChange(product.productId, sIdx, e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-white rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                            >
                                {editingGroup ? 'Update Group' : 'Create Pricing Group'}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductGroups;
