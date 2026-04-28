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
import InvoiceCreate   from "./pages/billing/InvoiceCreate";
import InvoiceDetail   from "./pages/billing/InvoiceDetail";
import BillingLinesList from "./pages/billing/BillingLinesList";
import BillingLineCreate from "./pages/billing/BillingLineCreate";
import BillingLinesImport from './pages/billing/BillingLinesImport';
import BillingLinesExport from './pages/billing/BillingLinesExport';
import TariffsList     from "./pages/billing/TariffsList";
import TariffCreate    from "./pages/billing/TariffCreate";

// KPI Reports module
import ReportsPanel    from "./pages/reports/ReportsPanel";
import ReportViewPage from "./pages/reports/ReportViewPage";
import KpiPanel       from "./pages/reports/KpiPanel";
import KpiDetailPage  from "./pages/reports/KpiDetailPage";

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
const REPORT_ROLES    = ["Admin", "Analyst"];

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
            path="/billing/invoices/create"
            element={
              <ProtectedRoute roles={BILLING_ROLES}>
                <InvoiceCreate />
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
            path="/billing/billing-lines/create"
            element={
              <ProtectedRoute roles={BILLING_ROLES}>
                <BillingLineCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/billing-lines/import"
            element={
              <ProtectedRoute roles={BILLING_ROLES}>
                <BillingLinesImport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing/billing-lines/export"
            element={
              <ProtectedRoute roles={BILLING_ROLES}>
                <BillingLinesExport />
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
          <Route
            path="/billing/tariffs/create"
            element={
              <ProtectedRoute roles={BILLING_ROLES}>
                <TariffCreate />
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

          {/* -- KPI Reports -- */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={REPORT_ROLES}>
                <ReportsPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/:id"
            element={
              <ProtectedRoute roles={REPORT_ROLES}>
                <ReportViewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kpis"
            element={
              <ProtectedRoute roles={REPORT_ROLES}>
                <KpiPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kpis/:id"
            element={
              <ProtectedRoute roles={REPORT_ROLES}>
                <KpiDetailPage />
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