import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ShopRequests from './pages/ShopRequests';
import AccessCodes from './pages/AccessCodes';
import CertificationRequests from './pages/CertificationRequests';
import CertificationStatus from './pages/CertificationStatus';

import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Products from './pages/Products';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import SupportTickets from './pages/SupportTickets';
import LiveChat from './pages/LiveChat';
import ProductGroups from './pages/ProductGroups';
import Notifications from './pages/Notifications';
import RegistrationFees from './pages/RegistrationFees';

// Simple component to handle the legacy chat redirect
const ChatRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/live-chat?roomId=${id}`} replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Legacy Redirects */}
            <Route path="/chat/:id" element={<ChatRedirect />} />

            <Route element={<ProtectedRoute allowedRoles={['admin', 'master_partner', 'regional_partner']} />}>
              <Route element={<Layout children={<Dashboard />} />} path="/" />
              <Route element={<Layout children={<Users />} />} path="/users" />
              <Route element={<Layout children={<AccessCodes />} />} path="/access-codes" />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<Layout children={<ShopRequests />} />} path="/shop-requests" />
              <Route element={<Layout children={<Products />} />} path="/products" />
               <Route element={<Layout children={<CertificationRequests />} />} path="/certification-requests" />
              <Route element={<Layout children={<CertificationStatus />} />} path="/certification-status" />
              <Route element={<Layout children={<Orders />} />} path="/orders" />
              <Route element={<Layout children={<OrderDetails />} />} path="/orders/:id" />
              <Route element={<Layout children={<SupportTickets />} />} path="/support-tickets" />
              <Route element={<Layout children={<LiveChat />} />} path="/live-chat" />
               <Route element={<Layout children={<ProductGroups />} />} path="/product-groups" />
              <Route element={<Layout children={<RegistrationFees />} />} path="/registration-fees" />
              <Route element={<Layout children={<Notifications />} />} path="/notifications" />
            </Route>

            <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center">Unauthorized Access</div>} />
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center">404 - Not Found</div>} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

// Helper to wrap Layout around pages in a cleaner way if needed, 
// though the above is fine for this structure.
export default App;
