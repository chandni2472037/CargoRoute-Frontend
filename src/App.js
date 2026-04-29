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

// Fleet Management module
import FleetRegistry from "./pages/fleet/FleetRegistry";
import VehicleForm   from "./pages/fleet/VehicleForm";
import VehicleDetail from "./pages/fleet/VehicleDetail";

// Route Optimization module
import RouteOptimization from "./pages/routing/RouteOptimization";
import LoadPlanning      from "./pages/routing/LoadPlanning";
import RouteDetail       from "./pages/routing/RouteDetail";
import RouteForm         from "./pages/routing/RouteForm";
import LoadDetail        from "./pages/routing/LoadDetail";
import LoadForm          from "./pages/routing/LoadForm";
import RoutingRules      from "./pages/routing/RoutingRules";
import RoutingRuleDetail from "./pages/routing/RoutingRuleDetail";
import RoutingRuleForm   from "./pages/routing/RoutingRuleForm";

import AuthProvider    from "./auth/AuthContext";
import ProtectedRoute  from "./auth/ProtectedRoute";

// Roles allowed to access the bookings module
const BOOKING_ROLES = ["Admin", "Dispatcher", "Shipper", "Analyst"];

// Roles allowed to access the fleet module
const FLEET_ROLES = ["Admin", "Dispatcher", "FleetManager"];

// Roles allowed to access the routing module
const ROUTING_ROLES = ["Admin", "Dispatcher"];

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

          {/* ── Fleet Management ── */}
          <Route
            path="/fleet/vehicles"
            element={
              <ProtectedRoute roles={FLEET_ROLES}>
                <FleetRegistry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/vehicles/new"
            element={
              <ProtectedRoute roles={FLEET_ROLES}>
                <VehicleForm isEdit={false} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/vehicles/:id"
            element={
              <ProtectedRoute roles={FLEET_ROLES}>
                <VehicleDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fleet/vehicles/:id/edit"
            element={
              <ProtectedRoute roles={FLEET_ROLES}>
                <VehicleForm isEdit={true} />
              </ProtectedRoute>
            }
          />

          {/* ── Route Optimization ── */}
          <Route
            path="/routing/routes"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <RouteOptimization />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routing/routes/new"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <RouteForm isEdit={false} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routing/route/:id"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <RouteDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routing/route/:id/edit"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <RouteForm isEdit={true} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routing/load-planning"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <LoadPlanning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routing/load/new"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <LoadForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routing/load/:id"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <LoadDetail />
              </ProtectedRoute>
            }
          />


          {/* -- Routing Rules -- */}
          <Route
            path="/routing/rules"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <RoutingRules />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routing/rules/new"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <RoutingRuleForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routing/rules/:id"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <RoutingRuleDetail />
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