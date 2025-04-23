// src/App.jsx — FINAL & CLEAN VERSION
import React from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { LoadingProvider } from "./LoadingContext";
import Header from "./components/Header";

// Pages

import HomePage from "./pages/Homepage";
import PropertySearch from "./pages/PropertySearch";
import PropertyDetails from "./pages/PropertyDetails";
import Auth from "./pages/Auth";
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

import AdminRoute from "./components/AdminRoute";

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Central guard: when user navigates to any dashboard route, verify session with server.
  React.useEffect(() => {
    const checkDashboardAccess = async () => {
      const path = location.pathname;
      const mapping = {
        "/worker_dashboard": "worker",
        "/owner_dashboard": "owner",
        "/tenant/tenant_dashboard": "tenant",
      };
      const required = mapping[path];
      if (!required) return;

      try {
        const resp = await fetch("/api/check-session", {
          credentials: "include",
        });
        const data = await resp.json();
        if (!data.user || data.user.userType !== required) {
          navigate("/login");
        }
      } catch (err) {
        console.error("Session check failed:", err);
        navigate("/login");
      }
    };
    checkDashboardAccess();
  }, [location.pathname, navigate]);

  // Hide Header on: Admin routes, Login, Register
  const hideHeaderPaths = ["/login", "/register"];

  const isAdminRoute = location.pathname.startsWith("/admin");
  const shouldHideHeader =
    isAdminRoute || hideHeaderPaths.includes(location.pathname);

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

          {/* User Dashboards */}
          <Route
            path="/tenant/tenant_dashboard"
            element={<TenantDashboard />}
          />
          <Route path="/owner_dashboard" element={<OwnerDashboard />} />
          <Route path="/worker_dashboard" element={<WorkerDashboard />} />
          <Route path="/worker_register" element={<WorkerRegister />} />
          <Route
            path="/property-management"
            element={<div>Property Management</div>}
          />

          {/* ADMIN ROUTES — PROTECTED & NO HEADER */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
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
        </Routes>
      </div>
    </LoadingProvider>
  );
};

export default App;
