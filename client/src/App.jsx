// src/App.jsx — FINAL VERSION (Protected Admin Panel)
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LoadingProvider } from './LoadingContext';
import Header from './components/Header';

// Pages
import HomePage from './pages/Homepage';
import PropertySearch from './pages/PropertySearch';
import PropertyDetails from './pages/PropertyDetails';
import Auth from './pages/Auth';

// Admin Pages
import AdminDashboard from './admin/AdminDashboard';
import PropertyManagement from './admin/PropertyManagement';
import UserManagement from './admin/UserManagement';
import ServiceBookings from './admin/ServiceBookings';
import Payments from './admin/Payments';
import WorkerPayments from './admin/WorkerPayments';
import Notifications from './admin/Notifications';
import MaintenanceRequests from './admin/MaintenanceRequests';
import Messages from './admin/Messages';

// Admin View Pages
import BookingView from './admin/BookingView';
import MaintenanceView from './admin/MaintenanceView';
import NotificationView from './admin/NotificationView';
import MessageView from './admin/MessageView';
import PaymentView from './admin/PaymentView';
import PropertyView from './admin/PropertyView';
import UserView from './admin/UserView';
import WorkerPaymentView from './admin/WorkerPaymentView';

// Admin Protection Component
import AdminRoute from './components/AdminRoute';

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <LoadingProvider>
      <div>
        {/* Hide normal header on admin routes */}
        {!isAdminRoute && <Header />}

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<PropertySearch />} />
          <Route path="/property" element={<PropertyDetails />} />
          <Route path="/about_us" element={<div>About Us</div>} />
          <Route path="/contact_us" element={<div>Contact Us</div>} />
          <Route path="/faq" element={<div>FAQs</div>} />
          <Route path="/privacy_policy" element={<div>Privacy Policy</div>} />
          <Route path="/termsofservice" element={<div>Terms of Service</div>} />

          {/* Auth */}
          <Route path="/login" element={<Auth initial="login" />} />
          <Route path="/register" element={<Auth initial="register" />} />

          {/* User Dashboards (you can protect later) */}
          <Route path="/tenant/tenant_dashboard" element={<div>Tenant Dashboard</div>} />
          <Route path="/owner_dashboard" element={<div>Owner Dashboard</div>} />
          <Route path="/worker_dashboard" element={<div>Worker Dashboard</div>} />
          <Route path="/worker_register" element={<div>Worker Register</div>} />
          <Route path="/property-management" element={<div>Property Management</div>} />

          {/* ADMIN ROUTES — ALL PROTECTED */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/property-management" element={<AdminRoute><PropertyManagement /></AdminRoute>} />
          <Route path="/admin/user-management" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="/admin/service-bookings" element={<AdminRoute><ServiceBookings /></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><Payments /></AdminRoute>} />
          <Route path="/admin/worker-payments" element={<AdminRoute><WorkerPayments /></AdminRoute>} />
          <Route path="/admin/notifications" element={<AdminRoute><Notifications /></AdminRoute>} />
          <Route path="/admin/maintenance-requests" element={<AdminRoute><MaintenanceRequests /></AdminRoute>} />
          <Route path="/admin/messages" element={<AdminRoute><Messages /></AdminRoute>} />

          {/* Admin Detail Views — Protected */}
          <Route path="/admin/booking/:id" element={<AdminRoute><BookingView /></AdminRoute>} />
          <Route path="/admin/maintenance/:id" element={<AdminRoute><MaintenanceView /></AdminRoute>} />
          <Route path="/admin/notification/:id" element={<AdminRoute><NotificationView /></AdminRoute>} />
          <Route path="/admin/message/:id" element={<AdminRoute><MessageView /></AdminRoute>} />
          <Route path="/admin/payment/:id" element={<AdminRoute><PaymentView /></AdminRoute>} />
          <Route path="/admin/property/:id" element={<AdminRoute><PropertyView /></AdminRoute>} />
          <Route path="/admin/user/:id/:userType" element={<AdminRoute><UserView /></AdminRoute>} />
          <Route path="/admin/worker-payment/:id" element={<AdminRoute><WorkerPaymentView /></AdminRoute>} />
        </Routes>
      </div>
    </LoadingProvider>
  );
};

export default App;