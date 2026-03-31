import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ArrowLeft,
    MapPin,
    Mail,
    Package,
    Phone,
    User,
    CreditCard,
    Calendar,
    CheckCircle,
    XCircle,
    Truck,
    Box
} from "lucide-react";
import api from "../api/axios";
import { format } from "date-fns";
import toast from "react-hot-toast";

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            // Reusing endpoint that works for admin too if guarded correctly or using admin specific
            // We added admin access to getOrderById so this should work
            const response = await api.get(`/orders/${id}`);
            setOrder(response.data);
        } catch (error) {
            console.error("Failed to fetch order:", error);
            toast.error("Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!window.confirm(`Are you sure you want to change current status to ${newStatus}?`)) return;

        setUpdating(true);
        try {
            const response = await api.post(`/orders/admin/${id}/status`, { status: newStatus });
            setOrder(response.data);
            toast.success(`Order updated to ${newStatus}`);
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update status");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="text-center py-10">Loading order details...</div>;
    if (!order) return <div className="text-center py-10">Order not found</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy at h:mm a')}
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-gray-500 mr-2">Current Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'FAILED' ? 'bg-orange-100 text-orange-700' :
                                    'bg-gray-100 text-gray-700'
                        }`}>
                        {order.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Items & Payment */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-gray-400" />
                                Order Items ({order.items.length})
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="p-6 flex gap-4">
                                    <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <Package className="w-8 h-8 text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            <span>Size: {item.size}</span>
                                            <span>•</span>
                                            <span>Qty: {item.quantity}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-sm text-gray-500">${item.price} each</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="text-gray-900">${(order.totalAmount * 0.92 - 15).toFixed(2)} (Est)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Shipping</span>
                                <span className="text-gray-900">$15.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tax</span>
                                <span className="text-gray-900 font-medium">${(order.totalAmount * 0.08).toFixed(2)} (Est)</span>
                            </div>
                            <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                                <span className="font-semibold text-gray-900">Total Paid</span>
                                <span className="font-bold text-primary text-lg">${order.totalAmount?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Customer & Status Actions */}
                <div className="space-y-6">
                    {/* Status Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-semibold text-gray-900 mb-4">Update Status</h2>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleStatusUpdate('SHIPPED')}
                                disabled={updating || order.status === 'SHIPPED'}
                                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="flex items-center gap-2">
                                    <Truck className="w-4 h-4" /> Mark as Shipped
                                </span>
                                {order.status === 'SHIPPED' && <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('DELIVERED')}
                                disabled={updating || order.status === 'DELIVERED'}
                                className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="flex items-center gap-2">
                                    <Box className="w-4 h-4" /> Mark as Delivered
                                </span>
                                {order.status === 'DELIVERED' && <CheckCircle className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('CANCELLED')}
                                disabled={updating || order.status === 'CANCELLED'}
                                className="w-full flex items-center justify-between px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4" /> Cancel Order
                                </span>
                                {order.status === 'CANCELLED' && <CheckCircle className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Customer Details */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            Customer Details
                        </h2>
                        <div className="space-y-4">
                            {order.user && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Requested By Account</p>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-bold text-gray-900">{order.user.firstName} {order.user.lastName}</p>
                                        <p className="text-xs text-gray-600">{order.user.email}</p>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase w-fit mt-1 ${['master_partner', 'regional_partner', 'partner'].includes(order.user.role) ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                                            Account: {order.user.role?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">Customer</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 break-all">
                                        {order.shippingAddress?.email}
                                    </p>
                                    <p className="text-xs text-gray-500">Email Address</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {order.shippingAddress?.phoneNumber || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-500">Phone Number</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-gray-400" />
                                Shipping Address
                            </h2>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {order.shippingAddress?.companyName && (
                                    <><strong>{order.shippingAddress.companyName}</strong><br /></>
                                )}
                                {order.shippingAddress?.address}<br />
                                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                                {order.shippingAddress?.country}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
