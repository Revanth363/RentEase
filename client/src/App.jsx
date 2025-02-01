import { Routes, Route, useLocation } from 'react-router-dom';
import { LoadingProvider } from './LoadingContext';
import Header from './components/Header';
import HomePage from './pages/Homepage';
import PropertySearch from './pages/PropertySearch';
import PropertyDetails from './pages/PropertyDetails';
import AdminDashboard from './admin/AdminDashboard';
import PropertyManagement from './admin/PropertyManagement';
import UserManagement from './admin/UserManagement';
import ServiceBookings from './admin/ServiceBookings';
import Payments from './admin/Payments';
import WorkerPayments from './admin/WorkerPayments';
import Notifications from './admin/Notifications';
import MaintenanceRequests from './admin/MaintenanceRequests';
import Messages from './admin/Messages';
import BookingView from './admin/BookingView';
import MaintenanceView from './admin/MaintenanceView';
import NotificationView from './admin/NotificationView';
import MessageView from './admin/MessageView';
import PaymentView from './admin/PaymentView';
import PropertyView from './admin/PropertyView';
import UserView from './admin/UserView';
import WorkerPaymentView from './admin/WorkerPaymentView';

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <LoadingProvider>
      <div>
        {/* Render Header only if NOT admin route */}
        {!isAdminRoute && <Header />}
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<PropertySearch />} />
          <Route path="/workerDetails" element={<div>Worker Details</div>} />
          <Route path="/about_us" element={<div>About Us</div>} />
          <Route path="/contact_us" element={<div>Contact Us</div>} />
          <Route path="/faq" element={<div>FAQs</div>} />
          <Route path="/register" element={<div>Register Page</div>} />
          <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
          <Route path="/worker_register" element={<div>Worker Register Page</div>} />
          <Route path="/privacy_policy" element={<div>Privacy Policy Page</div>} />
          <Route path="/termsofservice" element={<div>Terms of Service Page</div>} />
          <Route path="/property-management" element={<div>Property Management Page</div>} />
          <Route path="/tenant/tenant_dashboard" element={<div>Tenant Dashboard</div>} />
          <Route path="/owner_dashboard" element={<div>Owner Dashboard</div>} />
          <Route path="/worker_dashboard" element={<div>Worker Dashboard</div>} />
          <Route path="/property" element={<PropertyDetails />} />

          {/* Admin Routes without Authentication */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/property-management" element={<PropertyManagement />} />
          <Route path="/admin/user-management" element={<UserManagement />} />
          <Route path="/admin/service-bookings" element={<ServiceBookings />} />
          <Route path="/admin/payments" element={<Payments />} />
          <Route path="/admin/worker-payments" element={<WorkerPayments />} />
          <Route path="/admin/notifications" element={<Notifications />} />
          <Route path="/admin/maintenance-requests" element={<MaintenanceRequests />} />
          <Route path="/admin/messages" element={<Messages />} />

      
        <Route path="/admin/booking/:id" element={<BookingView />} />
        <Route path="/admin/maintenance/:id" element={<MaintenanceView />} />
        <Route path="/admin/notification/:id" element={<NotificationView />} />
        <Route path="/admin/message/:id" element={<MessageView />} />
        <Route path="/admin/payment/:id" element={<PaymentView />} />
        <Route path="/admin/property/:id" element={<PropertyView />} />
        <Route path="/admin/user/:id/:userType" element={<UserView />} />
        <Route path="/admin/worker-payment/:id" element={<WorkerPaymentView />} />
        </Routes>
      </div>
    </LoadingProvider>
  );
};

export default App;
