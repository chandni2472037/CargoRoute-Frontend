import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import Unauthorized   from "./pages/Unauthorized";

// Booking & Order Intake module
import BookingsList  from "./pages/bookings/BookingsList";
import NewBooking    from "./pages/bookings/NewBooking";
import BookingDetail from "./pages/bookings/BookingDetail";
import ShippersList  from "./pages/bookings/ShippersList";
import NewShipper     from "./pages/bookings/NewShipper";
import ShipperDetail  from "./pages/bookings/ShipperDetail";
import ShipperEdit    from "./pages/bookings/ShipperEdit";

// Exceptions & Claims module
import ExceptionsList  from "./pages/exceptions/ExceptionsList";
import NewException    from "./pages/exceptions/NewException";
import ExceptionDetail from "./pages/exceptions/ExceptionDetail";
import ClaimsList      from "./pages/exceptions/ClaimsList";
import ClaimDetail     from "./pages/exceptions/ClaimDetail";
import NewClaim        from "./pages/exceptions/NewClaim";

import AuthProvider    from "./auth/AuthContext";
import ProtectedRoute  from "./auth/ProtectedRoute";
import DashboardRouter from "./pages/DashboardRouter";

const BOOKING_ROLES_VIEW   = ["Admin", "Dispatcher", "Shipper", "Analyst", "FleetManager", "WarehouseManager", "BillingClerk"];
// Roles allowed to create new bookings
// Backend permits Admin and Shipper to create bookings; Dispatcher must not create.
const BOOKING_ROLES_CREATE = ["Admin", "Shipper"];
// Include 'Shipper' so shipper users can view and create their own exceptions/claims
// Roles allowed to VIEW exceptions/claims
const EXCEPTION_VIEW_ROLES = ["Admin", "Dispatcher", "Analyst", "Shipper", "FleetManager", "WarehouseManager", "BillingClerk"];
// Roles allowed to CREATE exceptions (aligned with backend: Shipper and Dispatcher)
const EXCEPTION_CREATE_ROLES = ["Shipper", "Dispatcher"];
// Roles allowed to create claims (Dispatchers must NOT create claims)
const CLAIM_CREATE_ROLES = ["Admin", "Shipper"];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public */}
          <Route path="/login"        element={<Login />} />
          <Route path="/signup"       element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/bookings" replace />} />

          {/* ── Booking & Order Intake ── */}
          <Route path="/bookings" element={<ProtectedRoute roles={BOOKING_ROLES_VIEW}><BookingsList /></ProtectedRoute>} />
          <Route path="/bookings/new" element={<ProtectedRoute roles={BOOKING_ROLES_CREATE}><NewBooking /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute roles={BOOKING_ROLES_VIEW}><BookingDetail /></ProtectedRoute>} />
          <Route path="/shippers" element={<ProtectedRoute roles={BOOKING_ROLES_VIEW}><ShippersList /></ProtectedRoute>} />
          <Route path="/shippers/new" element={<ProtectedRoute roles={["Admin"]}><NewShipper /></ProtectedRoute>} />
          <Route path="/shippers/:id/edit" element={<ProtectedRoute roles={["Admin"]}><ShipperEdit /></ProtectedRoute>} />
          <Route path="/shippers/:id" element={<ProtectedRoute roles={BOOKING_ROLES_VIEW}><ShipperDetail /></ProtectedRoute>} />

          {/* ── Exceptions & Claims ── */}
          <Route path="/exceptions" element={<ProtectedRoute roles={EXCEPTION_VIEW_ROLES}><ExceptionsList /></ProtectedRoute>} />
          <Route path="/exceptions/new" element={<ProtectedRoute roles={EXCEPTION_CREATE_ROLES}><NewException /></ProtectedRoute>} />
          <Route path="/exceptions/:id" element={<ProtectedRoute roles={EXCEPTION_VIEW_ROLES}><ExceptionDetail /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute roles={EXCEPTION_VIEW_ROLES}><ClaimsList /></ProtectedRoute>} />
          <Route path="/claims/new" element={<ProtectedRoute roles={CLAIM_CREATE_ROLES}><NewClaim /></ProtectedRoute>} />
          <Route path="/claims/:id" element={<ProtectedRoute roles={EXCEPTION_VIEW_ROLES}><ClaimDetail /></ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}