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

import AuthProvider    from "./auth/AuthContext";
import ProtectedRoute  from "./auth/ProtectedRoute";

// Billing & Reconciliation module
import BillingPanel    from "./pages/billing/BillingPanel";
import InvoicesList    from "./pages/billing/InvoicesList";
import InvoiceDetail   from "./pages/billing/InvoiceDetail";
import BillingLinesList from "./pages/billing/BillingLinesList";
import TariffsList     from "./pages/billing/TariffsList";

// Dispatch module
import DispatchList  from "./pages/dispatch/DispatchList";
import DriversList   from "./pages/dispatch/DriversList";
import DriverAckList from "./pages/dispatch/DriverAckList";

// Fleet module
import VehiclesList        from "./pages/fleet/VehiclesList";
import VehicleAvailability from "./pages/fleet/VehicleAvailability";

// Routing module
import LoadsList        from "./pages/routing/LoadsList";
import RoutesList       from "./pages/routing/RoutesList";
import RoutingRulesList from "./pages/routing/RoutingRulesList";

// Roles allowed to access each module
const BOOKING_ROLES   = ["Admin", "Dispatcher", "Shipper", "Analyst"];
const BILLING_ROLES   = ["Admin", "BillingClerk", "Analyst", "Dispatcher"];
const DISPATCH_ROLES  = ["Admin", "Dispatcher", "Analyst"];
const FLEET_ROLES     = ["Admin", "FleetManager", "Dispatcher", "Analyst"];
const ROUTING_ROLES   = ["Admin", "Dispatcher", "FleetManager", "Analyst"];

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

          {/* ── Billing & Reconciliation ── */}
          <Route
            path="/billing"
            element={
              <ProtectedRoute roles={BILLING_ROLES}>
                <BillingPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/invoices"
            element={
              <ProtectedRoute roles={BILLING_ROLES}>
                <InvoicesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/invoices/:id"
            element={
              <ProtectedRoute roles={BILLING_ROLES}>
                <InvoiceDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/billing-lines"
            element={
              <ProtectedRoute roles={BILLING_ROLES}>
                <BillingLinesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/tariffs"
            element={
              <ProtectedRoute roles={BILLING_ROLES}>
                <TariffsList />
              </ProtectedRoute>
            }
          />

          {/* ── Dispatch ── */}
          <Route
            path="/dispatch"
            element={
              <ProtectedRoute roles={DISPATCH_ROLES}>
                <DispatchList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch/drivers"
            element={
              <ProtectedRoute roles={DISPATCH_ROLES}>
                <DriversList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispatch/acks"
            element={
              <ProtectedRoute roles={DISPATCH_ROLES}>
                <DriverAckList />
              </ProtectedRoute>
            }
          />

          {/* ── Fleet ── */}
          <Route
            path="/vehicles"
            element={
              <ProtectedRoute roles={FLEET_ROLES}>
                <VehiclesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles/availability"
            element={
              <ProtectedRoute roles={FLEET_ROLES}>
                <VehicleAvailability />
              </ProtectedRoute>
            }
          />

          {/* ── Routing ── */}
          <Route
            path="/routes"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <RoutesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routes/loads"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <LoadsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routes/rules"
            element={
              <ProtectedRoute roles={ROUTING_ROLES}>
                <RoutingRulesList />
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