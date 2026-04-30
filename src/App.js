import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
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

// Dispatch module
import DispatchList   from "./pages/dispatch/DispatchList";
import NewDispatch    from "./pages/dispatch/NewDispatch";
import DispatchDetail from "./pages/dispatch/DispatchDetail";
import DriversList    from "./pages/dispatch/DriversList";
import DriverAckList  from "./pages/dispatch/DriverAckList";

// Manifests & POD module
import ManifestList   from "./pages/manifests/ManifestList";
import NewManifest    from "./pages/manifests/NewManifest";
import ManifestDetail from "./pages/manifests/ManifestDetail";
import PodList        from "./pages/manifests/PodList";
import PodDetail      from "./pages/manifests/PodDetail";
import HandoverList   from "./pages/manifests/HandoverList";

import AuthProvider    from "./auth/AuthContext";
import ProtectedRoute  from "./auth/ProtectedRoute";

// Roles allowed to access the bookings module
const BOOKING_ROLES    = ["Admin", "Dispatcher", "Shipper", "Analyst"];

// Roles allowed to access the exceptions & claims module
const EXCEPTION_ROLES  = ["Admin", "Dispatcher", "Analyst"];

// Roles allowed to access the dispatch module
const DISPATCH_ROLES   = ["Admin", "Dispatcher", "FleetManager"];

// Roles allowed to access the manifests & POD module
const MANIFEST_ROLES   = ["Admin", "Dispatcher", "WarehouseManager", "Analyst"];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/signup"   element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="Admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Booking & Order Intake ── */}
          <Route
            path="/bookings"
            element={
              <ProtectedRoute roles={BOOKING_ROLES}>
                <BookingsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/new"
            element={
              <ProtectedRoute roles={BOOKING_ROLES}>
                <NewBooking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <ProtectedRoute roles={BOOKING_ROLES}>
                <BookingDetail />
              </ProtectedRoute>
            }
          />

          {/* ── Shippers ── */}
          <Route
            path="/shippers"
            element={
              <ProtectedRoute roles={BOOKING_ROLES}>
                <ShippersList />
              </ProtectedRoute>
            }
          />

          {/* ── Exceptions & Claims ── */}
          <Route
            path="/exceptions"
            element={
              <ProtectedRoute roles={EXCEPTION_ROLES}>
                <ExceptionsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exceptions/new"
            element={
              <ProtectedRoute roles={EXCEPTION_ROLES}>
                <NewException />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exceptions/:id"
            element={
              <ProtectedRoute roles={EXCEPTION_ROLES}>
                <ExceptionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/claims"
            element={
              <ProtectedRoute roles={EXCEPTION_ROLES}>
                <ClaimsList />
              </ProtectedRoute>
            }
          />

          {/* ── Dispatch & Drivers ── */}
          <Route
            path="/dispatch"
            element={
              <ProtectedRoute roles={DISPATCH_ROLES}>
                <DispatchList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch/new"
            element={
              <ProtectedRoute roles={DISPATCH_ROLES}>
                <NewDispatch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch/:id"
            element={
              <ProtectedRoute roles={DISPATCH_ROLES}>
                <DispatchDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers"
            element={
              <ProtectedRoute roles={DISPATCH_ROLES}>
                <DriversList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver-ack"
            element={
              <ProtectedRoute roles={[...DISPATCH_ROLES, 'Driver']}>
                <DriverAckList />
              </ProtectedRoute>
            }
          />

          {/* ── Manifests & POD ── */}
          <Route
            path="/manifests"
            element={
              <ProtectedRoute roles={MANIFEST_ROLES}>
                <ManifestList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manifests/new"
            element={
              <ProtectedRoute roles={MANIFEST_ROLES}>
                <NewManifest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manifests/:id"
            element={
              <ProtectedRoute roles={MANIFEST_ROLES}>
                <ManifestDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pod"
            element={
              <ProtectedRoute roles={MANIFEST_ROLES}>
                <PodList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pod/:id"
            element={
              <ProtectedRoute roles={MANIFEST_ROLES}>
                <PodDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/handovers"
            element={
              <ProtectedRoute roles={MANIFEST_ROLES}>
                <HandoverList />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/bookings" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}