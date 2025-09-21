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
          <Route path="/privacy_policy" element={<div>Privacy Policy</div>} />
          <Route path="/termsofservice" element={<div>Terms of Service</div>} />
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

          {/* ADMIN ROUTES — PROTECTED & NO HEADER */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Navigate to="/admin/property-management" replace />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/property-management"
            element={
              <AdminRoute>
                <PropertyManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/user-management"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/service-bookings"
            element={
              <AdminRoute>
                <ServiceBookings />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <AdminRoute>
                <Payments />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/worker-payments"
            element={
              <AdminRoute>
                <WorkerPayments />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/notifications"
            element={
              <AdminRoute>
                <Notifications />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/maintenance-requests"
            element={
              <AdminRoute>
                <MaintenanceRequests />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <AdminRoute>
                <Messages />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/user-verifications"
            element={
              <AdminRoute>
                <AdminUserVerifications />
              </AdminRoute>
            }
          />

          {/* Admin Detail Views */}
          <Route
            path="/admin/booking/:id"
            element={
              <AdminRoute>
                <BookingView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/maintenance/:id"
            element={
              <AdminRoute>
                <MaintenanceView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/notification/:id"
            element={
              <AdminRoute>
                <NotificationView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/message/:id"
            element={
              <AdminRoute>
                <MessageView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/payment/:id"
            element={
              <AdminRoute>
                <PaymentView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/property/:id"
            element={
              <AdminRoute>
                <PropertyView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/user/:id/:userType"
            element={
              <AdminRoute>
                <UserView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/worker-payment/:id"
            element={
              <AdminRoute>
                <WorkerPaymentView />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/worker-booking/:id"
            element={
              <AdminRoute>
                <BookingView />
              </AdminRoute>
            }
          />

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
