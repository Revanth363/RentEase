// src/App.jsx — FINAL & CLEAN VERSION
import React, { useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import { useDispatch } from "react-redux";
import { checkCurrentUser } from "./store/slices/authSlice";
import { LoadingProvider } from "./LoadingContext";
import Header from "./components/Header";
import NotFound from "./pages/NotFound";
import MaintenanceBanner from "./components/MaintenanceBanner";  



// Pages

import HomePage from "./pages/Homepage";
import PropertySearch from "./pages/PropertySearch";
import PropertyDetails from "./pages/PropertyDetails";
import Auth from "./pages/Auth";
import GoogleAuthSuccess from "./pages/GoogleAuthSuccess";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import FAQ from "./pages/FAQ";
import WorkerServices from "./pages/WorkerServices";
import WorkerCard from "./pages/WorkerCard";
import BookProperty from "./pages/BookProperty";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import DataPolicy from "./pages/DataPolicy";

import TenantDashboard from "./pages/TenantDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import WorkerRegister from "./pages/WorkerRegister";
import PropertyListing from "./pages/PropertyListing";

// Admin Pages & Views (same as before)

import AdminDashboard from "./admin/AdminDashboard";
import PropertyManagement from "./admin/PropertyManagement";
import UserManagement from "./admin/UserManagement";
import ServiceBookings from "./admin/ServiceBookings";
import Payments from "./admin/Payments";
import WorkerPayments from "./admin/WorkerPayments";
import Notifications from "./admin/Notifications";
import MaintenanceRequests from "./admin/MaintenanceRequests";
import Messages from "./admin/Messages";
import BookingView from "./admin/BookingView";
import MaintenanceView from "./admin/MaintenanceView";
import NotificationView from "./admin/NotificationView";
import MessageView from "./admin/MessageView";
import PaymentView from "./admin/PaymentView";
import PropertyView from "./admin/PropertyView";
import UserView from "./admin/UserView";
import WorkerPaymentView from "./admin/WorkerPaymentView";
import AdminUserVerifications from "./admin/AdminUserVerifications";

import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./admin/AdminLayout";

// Super Admin Pages
import SuperAdminLayout from "./superadmin/SuperAdminLayout";
import Overview from "./superadmin/pages/Overview";
import FinancialAnalytics from "./superadmin/pages/FinancialAnalytics";
import OwnerEarnings from "./superadmin/pages/OwnerEarnings";
import WorkerEarnings from "./superadmin/pages/WorkerEarnings";
import Executives from "./superadmin/pages/Executives";
import SystemSettings from "./superadmin/pages/SystemSettings";
import AuditLogs from "./superadmin/pages/AuditLogs";
import TenantPayments from "./superadmin/pages/TenantPayments";

const App = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  const [maintenance, setMaintenance] = React.useState({ mode: false, message: '' });

  // Run auth check once on app mount (using Redux slice)
  useEffect(() => {
    dispatch(checkCurrentUser()); // Loads user from cookie/token
    // fetch public settings for maintenance
    fetch('/api/public-settings')
      .then((r) => r.json())
      .then((data) => {
        setMaintenance({
          mode: data.maintenanceMode || false,
          message: data.maintenanceMessage || ''
        });
      })
      .catch((e) => console.warn('Failed to load public settings', e));
  }, [dispatch]);

  // Hide Header on: Admin routes, Login, Register
  const hideHeaderPaths = ["/login", "/register","/google-auth-success"];

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isSuperAdminRoute = location.pathname.startsWith("/superadmin");
  const shouldHideHeader =
    isAdminRoute || isSuperAdminRoute || hideHeaderPaths.includes(location.pathname);

  // if maintenance mode and not admin/superadmin, show notice
  if (maintenance.mode && !isAdminRoute && !isSuperAdminRoute) {
    return <MaintenanceBanner message={maintenance.message} />;
  }

  return (
    <LoadingProvider>
      <div>
        {/* Only show Header on public pages */}
        {!shouldHideHeader && <Header />}

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<PropertySearch />} />
          <Route path="/property" element={<PropertyDetails />} />
          <Route path="/about_us" element={<AboutUs />} />
          <Route path="/contact_us" element={<ContactUs />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/workerDetails" element={<WorkerServices />} />
          <Route path="/worker/:id" element={<WorkerCard detailed />} />
          <Route path="/privacy_policy" element={<PrivacyPolicy />} />
          <Route path="/termsofservice" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<DataPolicy />} />
          <Route path="/book-property" element={<BookProperty />} />

          {/* Auth Routes — NO HEADER */}
          <Route path="/login" element={<Auth initial="login" />} />
          <Route path="/register" element={<Auth initial="register" />} />
          {/* Google OAuth Redirect */}
<Route
  path="/google-auth-success"
  element={<GoogleAuthSuccess />}
/>


          {/* User Dashboards */}
          <Route
            path="/tenant/tenant_dashboard"
            element={<TenantDashboard />}
          />
          <Route path="/owner_dashboard" element={<OwnerDashboard />} />
          <Route path="/worker_dashboard" element={<WorkerDashboard />} />
          <Route path="/worker_register" element={<WorkerRegister />} />
          <Route path="/property_listing_page" element={<PropertyListing/>} />
          <Route
            path="/property-management"
            element={<div>Property Management</div>}
          />

          {/* ADMIN ROUTES — PROTECTED WITH PERSISTENT LAYOUT */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            {/* redirect bare /admin to property-management */}
            <Route index element={<Navigate to="/admin/property-management" replace />} />
            <Route path="property-management" element={<PropertyManagement />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="service-bookings" element={<ServiceBookings />} />
            <Route path="payments" element={<Payments />} />
            <Route path="worker-payments" element={<WorkerPayments />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="maintenance-requests" element={<MaintenanceRequests />} />
            <Route path="messages" element={<Messages />} />
            <Route path="user-verifications" element={<AdminUserVerifications />} />
            
            {/* Admin Detail Views */}
            <Route path="booking/:id" element={<BookingView />} />
            <Route path="maintenance/:id" element={<MaintenanceView />} />
            <Route path="notification/:id" element={<NotificationView />} />
            <Route path="message/:id" element={<MessageView />} />
            <Route path="payment/:id" element={<PaymentView />} />
            <Route path="property/:id" element={<PropertyView />} />
            <Route path="user/:id/:userType" element={<UserView />} />
            <Route path="worker-payment/:id" element={<WorkerPaymentView />} />
            <Route path="worker-booking/:id" element={<BookingView />} />
          </Route>

          {/* superadmin section (layout handles protection) */}
          <Route path="/superadmin/*" element={<SuperAdminLayout />}>                
            {/* redirect bare /superadmin to overview */}
            <Route index element={<Navigate to="/superadmin/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="financial-analytics" element={<FinancialAnalytics />} />
            <Route path="owner-earnings" element={<OwnerEarnings />} />
            <Route path="worker-earnings" element={<WorkerEarnings />} />
            <Route path="executives" element={<Executives />} />
            <Route path="system-settings" element={<SystemSettings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="tenant-payments" element={<TenantPayments />} />
          </Route>

      
        
 
  
      {/* Catch-all for unknown routes */}
      <Route path="*" element={<NotFound />} />

        </Routes>
      </div>
    </LoadingProvider>
  );
};

export default App;
