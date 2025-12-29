import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, Filter, MoreVertical, Trash2, Edit2, Plus, X, Package, ExternalLink, Upload, Loader2 as LoaderIcon } from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'protection',
        stock: 0,
        images: [''],
        features: [''],
        specifications: [{ label: '', value: '' }],
        sizes: [{ size: '', price: '' }],
        sizes: [{ size: '', price: '' }],
        status: 'published',
        targetAudience: 'all'
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/products');
            setProducts(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description,
                category: product.category,
                stock: product.stock || 0,
                images: product.images || [''],
                features: product.features || [''],
                specifications: product.specifications || [{ label: '', value: '' }],
                sizes: product.sizes || [{ size: '', price: '' }],
                sizes: product.sizes || [{ size: '', price: '' }],
                status: product.status,
                targetAudience: product.targetAudience || 'all'
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                category: 'protection',
                stock: 0,
                images: [''],
                features: [''],
                specifications: [{ label: '', value: '' }],
                sizes: [{ size: '', price: '' }],
                sizes: [{ size: '', price: '' }],
                status: 'published',
                targetAudience: 'all'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleArrayChange = (index, value, field) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const addArrayItem = (field) => {
        setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeArrayItem = (index, field) => {
        const newArray = formData[field].filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, [field]: newArray }));
    };

    const handleSizeChange = (index, field, value) => {
        const newSizes = [...formData.sizes];
        newSizes[index][field] = field === 'price' ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, sizes: newSizes }));
    };

    const addSizeItem = () => {
        setFormData(prev => ({ ...prev, sizes: [...prev.sizes, { size: '', price: '' }] }));
    };

    const removeSizeItem = (index) => {
        const newSizes = formData.sizes.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, sizes: newSizes }));
    };

    const handleSpecChange = (index, field, value) => {
        const newSpecs = [...formData.specifications];
        newSpecs[index][field] = value;
        setFormData(prev => ({ ...prev, specifications: newSpecs }));
    };

    const addSpecItem = () => {
        setFormData(prev => ({ ...prev, specifications: [...prev.specifications, { label: '', value: '' }] }));
    };

    const removeSpecItem = (index) => {
        const newSpecs = formData.specifications.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, specifications: newSpecs }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.patch(`/products/${editingProduct._id}`, formData);
            } else {
                await api.post('/products', formData);
            }
            fetchProducts();
            handleCloseModal();
        } catch (err) {
            console.error(err);
            alert('Failed to save product');
        }
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const uploadFormData = new FormData();
        files.forEach(file => uploadFormData.append('images', file));

        try {
            setLoading(true); // Reuse loading state or add a specific one
            const res = await api.post('/products/upload', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newUrls = res.data.urls;
            setFormData(prev => ({
                ...prev,
                images: prev.images[0] === '' ? newUrls : [...prev.images, ...newUrls]
            }));
        } catch (err) {
            console.error(err);
            alert('Failed to upload images');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (err) {
                console.error(err);
                alert('Failed to delete product');
            }
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(filter.toLowerCase()) ||
        product.category.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold">Product Management</h1>
                    <p className="text-slate-500">Add, edit and manage your product catalog</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add New Product
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or category..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Product</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold">Stock</th>
                                <th className="px-6 py-4 font-semibold">Sizes / Prices</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400">Loading products...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400">No products found</td></tr>
                            ) : filteredProducts.map((product) => (
                                <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-200">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Package className="text-slate-400" size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{product.name}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-xs">{product.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${product.category === 'protection' ? 'bg-blue-100 text-blue-700' :
                                            product.category === 'restoration' ? 'bg-purple-100 text-purple-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-medium ${product.stock <= 5 ? 'text-red-600' : 'text-slate-600'}`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {product.sizes?.map((s, i) => (
                                                <span key={i} className="text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                    {s.size}: ${s.price}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1.5 text-sm font-medium ${product.status === 'published' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            <span className={`w-2 h-2 rounded-full ${product.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(product._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
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

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1 col-span-1">
                                    <label className="text-sm font-semibold text-slate-700">Product Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">Category</label>
                                    <input
                                        type="text"
                                        name="category"
                                        required
                                        placeholder="e.g. protection"
                                        list="category-list"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <datalist id="category-list">
                                        <option value="protection" />
                                        <option value="restoration" />
                                        <option value="tools" />
                                    </datalist>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">Stock</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        required
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 appearance-none bg-white"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">Target Audience</label>
                                    <select
                                        name="targetAudience"
                                        value={formData.targetAudience}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 appearance-none bg-white"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="shop">Shop Only</option>
                                        <option value="technician">Technician Only</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Description</label>
                                <textarea
                                    name="description"
                                    required
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                                ></textarea>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-slate-700">Product Images</label>
                                    <div className="flex gap-4">
                                        <label className="text-blue-600 text-sm hover:underline flex items-center gap-1 cursor-pointer">
                                            <Upload size={14} /> Upload Images
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                        <button type="button" onClick={() => addArrayItem('images')} className="text-slate-600 text-sm hover:underline flex items-center gap-1">
                                            <Plus size={14} /> Add URL
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {formData.images.map((img, idx) => (
                                        <div key={idx} className="relative group aspect-video bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                                            {img ? (
                                                <img src={img} alt="" className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Package size={24} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeArrayItem(idx, 'images')}
                                                    className="p-2 bg-white text-red-600 rounded-lg hover:bg-red-50 shadow-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Image URL"
                                                value={img}
                                                onChange={(e) => handleArrayChange(idx, e.target.value, 'images')}
                                                className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs bg-white/90 border-t border-slate-200 focus:outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-slate-700">Available Sizes & Prices</label>
                                    <button type="button" onClick={addSizeItem} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                                        <Plus size={14} /> Add Size
                                    </button>
                                </div>
                                {formData.sizes.map((s, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Size (e.g. 100ml)"
                                            required
                                            value={s.size}
                                            onChange={(e) => handleSizeChange(idx, 'size', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            required
                                            value={s.price}
                                            onChange={(e) => handleSizeChange(idx, 'price', e.target.value)}
                                            className="w-32 px-4 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                        {formData.sizes.length > 1 && (
                                            <button type="button" onClick={() => removeSizeItem(idx)} className="text-red-500 p-2"><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-slate-700">Technical Specifications</label>
                                    <button type="button" onClick={addSpecItem} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                                        <Plus size={14} /> Add Spec
                                    </button>
                                </div>
                                {formData.specifications.map((spec, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Label (e.g. Volume)"
                                            required
                                            value={spec.label}
                                            onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                                            className="w-1/3 px-4 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Value (e.g. 500ml)"
                                            required
                                            value={spec.value}
                                            onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                        {formData.specifications.length > 1 && (
                                            <button type="button" onClick={() => removeSpecItem(idx)} className="text-red-500 p-2"><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-slate-700">Features</label>
                                    <button type="button" onClick={() => addArrayItem('features')} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
                                        <Plus size={14} /> Add Feature
                                    </button>
                                </div>
                                {formData.features.map((feat, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={feat}
                                            onChange={(e) => handleArrayChange(idx, e.target.value, 'features')}
                                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm"
                                        />
                                        {formData.features.length > 1 && (
                                            <button type="button" onClick={() => removeArrayItem(idx, 'features')} className="text-red-500 p-2"><Trash2 size={16} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={handleCloseModal} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all">
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
