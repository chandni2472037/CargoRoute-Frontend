import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import Unauthorized   from "./pages/Unauthorized";

// Booking & Order Intake module
import BookingsList  from "./pages/bookings/BookingsList";
import NewBooking    from "./pages/bookings/NewBooking";
import BookingDetail from "./pages/bookings/BookingDetail";
import ShippersList  from "./pages/bookings/ShippersList";

// Exceptions & Claims module
import ExceptionsList  from "./pages/exceptions/ExceptionsList";
import NewException    from "./pages/exceptions/NewException";
import ExceptionDetail from "./pages/exceptions/ExceptionDetail";
import ClaimsList      from "./pages/exceptions/ClaimsList";
import ClaimDetail     from "./pages/exceptions/ClaimDetail";
import NewClaim        from "./pages/exceptions/NewClaim";

import AuthProvider    from "./auth/AuthContext";
import ProtectedRoute  from "./auth/ProtectedRoute";





//Notifications
import Notifications from "./pages/notifications/Notifications";
import UsersPage from "./pages/users/UsersPage";
import Profile from "./pages/users/Profile";
import Dashboard from "./pages/Dashboard";


const BOOKING_ROLES   = ["Admin", "Dispatcher", "Shipper", "Analyst"];
const EXCEPTION_ROLES = ["Admin", "Dispatcher", "Analyst"];




export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public */}
          <Route path="/login"        element={<Login />} />
          <Route path="/signup"       element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>


          {/* ── Booking & Order Intake ── */}
          <Route path="/bookings" element={<ProtectedRoute roles={BOOKING_ROLES}><BookingsList /></ProtectedRoute>} />
          <Route path="/bookings/new" element={<ProtectedRoute roles={BOOKING_ROLES}><NewBooking /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute roles={BOOKING_ROLES}><BookingDetail /></ProtectedRoute>} />
          <Route path="/shippers" element={<ProtectedRoute roles={BOOKING_ROLES}><ShippersList /></ProtectedRoute>} />

          {/* ── Exceptions & Claims ── */}
          <Route path="/exceptions" element={<ProtectedRoute roles={EXCEPTION_ROLES}><ExceptionsList /></ProtectedRoute>} />
          <Route path="/exceptions/new" element={<ProtectedRoute roles={EXCEPTION_ROLES}><NewException /></ProtectedRoute>} />
          <Route path="/exceptions/:id" element={<ProtectedRoute roles={EXCEPTION_ROLES}><ExceptionDetail /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute roles={EXCEPTION_ROLES}><ClaimsList /></ProtectedRoute>} />
          <Route path="/claims/new" element={<ProtectedRoute roles={EXCEPTION_ROLES}><NewClaim /></ProtectedRoute>} />
          <Route path="/claims/:id" element={<ProtectedRoute roles={EXCEPTION_ROLES}><ClaimDetail /></ProtectedRoute>} />

          {/* Profile – all users */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}/>

          {/* User Management – ADMIN only */}
          <Route path="/admin/users" element={<ProtectedRoute role="Admin"><UsersPage /></ProtectedRoute>}/>
  


          
<Route
  path="/notifications"
  element={
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  }
/>


        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}