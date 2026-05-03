import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    BarChart3,
    Users,
    Store,
    Key,
    LogOut,
    Menu,
    X,
    UserCircle,
    ShieldCheck,
    Package,
    MessageSquare,
    CreditCard,
    GraduationCap
} from 'lucide-react';
import { useState } from 'react';
import NotificationsBell from './NotificationsBell';
import logo from '../assets/logo.svg'

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { name: 'Dashboard', icon: BarChart3, path: '/' },
        { name: 'User Management', icon: Users, path: '/users' },
        { name: 'Product Management', icon: Package, path: '/products', roles: ['admin'] },
        { name: 'Pricing Groups', icon: ShieldCheck, path: '/product-groups', roles: ['admin'] },
        { name: 'Registration Fees', icon: CreditCard, path: '/registration-fees', roles: ['admin'] },
        { name: 'Shop Requests', icon: Store, path: '/shop-requests', roles: ['admin'] },
        { name: 'Certification Requests', icon: ShieldCheck, path: '/certification-requests', roles: ['admin'] },
        { name: 'Certification Status', icon: GraduationCap, path: '/certification-status', roles: ['admin'] },
        { name: 'Order Management', icon: Package, path: '/orders', roles: ['admin'] },
        { name: 'Support Tickets', icon: Store, path: '/support-tickets', roles: ['admin'] },
        { name: 'Live Chat', icon: MessageSquare, path: '/live-chat', roles: ['admin'] },
        { name: 'Access Codes', icon: Key, path: '/access-codes' },
    ].filter(item => !item.roles || item.roles.includes(user?.role));

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className={`bg-slate-900 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
                <div className="p-6 flex items-center justify-between">
                    {isSidebarOpen && <img src={logo} />}
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 mt-6 px-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={22} />
                            {isSidebarOpen && <span className="font-medium">{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4 p-2">
                        <UserCircle size={32} className="text-slate-400" />
                        {isSidebarOpen && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.replace(/_/g, ' ')}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-4 p-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut size={22} />
                        {isSidebarOpen && <span className="font-medium">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20">
                    <div className="flex items-center gap-4 text-slate-500">
                        <h2 className="text-sm font-bold uppercase tracking-widest">
                            {location.pathname === '/' ? 'Overview' : location.pathname.substring(1).replace(/-/g, ' ')}
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <NotificationsBell />
                        <div className="h-8 w-px bg-slate-200" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-slate-900">{user?.firstName} {user?.lastName}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-black">{user?.role?.replace(/_/g, ' ')}</p>
                            </div>
                            <UserCircle size={32} className="text-slate-400" />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
