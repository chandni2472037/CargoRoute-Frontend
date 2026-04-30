import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login          from "./pages/Login";
import Signup         from "./pages/Signup";
// import AdminDashboard from "./pages/AdminDashboard";
import Unauthorized   from "./pages/Unauthorized";

// Booking & Order Intake module
import BookingsList  from "./pages/bookings/BookingsList";
import NewBooking    from "./pages/bookings/NewBooking";
import BookingDetail from "./pages/bookings/BookingDetail";
import ShippersList  from "./pages/bookings/ShippersList";
import NewShipper     from "./pages/bookings/NewShipper";
import ShipperDetail  from "./pages/bookings/ShipperDetail";
import ShipperEdit    from "./pages/bookings/ShipperEdit";

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

//Notifications
import Notifications from "./pages/notifications/Notifications";
import UsersPage from "./pages/users/UsersPage";
import Profile from "./pages/users/Profile";
import Dashboard from "./pages/Dashboard";
import AuditLogsPage from "./pages/auditlogs/AuditLogsPage";
import TasksPage from "./pages/tasks/TasksPage";
import NewTaskPage from "./pages/tasks/NewTaskPage";
import TaskDetailPage from "./pages/tasks/TaskDetailPage";



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
          {/* ── Public Routes ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ── Dashboard ── */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ── Booking & Order Intake ── */}
          <Route path="/bookings" element={<ProtectedRoute roles={BOOKING_ROLES_VIEW}><BookingsList /></ProtectedRoute>} />
          <Route path="/bookings/new" element={<ProtectedRoute roles={BOOKING_ROLES_CREATE}><NewBooking /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute roles={BOOKING_ROLES_VIEW}><BookingDetail /></ProtectedRoute>} />
          
          <Route path="/shippers" element={<ProtectedRoute roles={BOOKING_ROLES_VIEW}><ShippersList /></ProtectedRoute>} />
          <Route path="/shippers/new" element={<ProtectedRoute roles={["Admin"]}><NewShipper /></ProtectedRoute>} />
          <Route path="/shippers/:id/edit" element={<ProtectedRoute roles={["Admin"]}><ShipperEdit /></ProtectedRoute>} />
          <Route path="/shippers/:id" element={<ProtectedRoute roles={BOOKING_ROLES_VIEW}><ShipperDetail /></ProtectedRoute>} />

          {/* ── Fleet Management ── */}
          <Route path="/fleet/vehicles" element={<ProtectedRoute roles={FLEET_ROLES}><FleetRegistry /></ProtectedRoute>} />
          <Route path="/fleet/vehicles/new" element={<ProtectedRoute roles={FLEET_ROLES}><VehicleForm isEdit={false} /></ProtectedRoute>} />
          <Route path="/fleet/vehicles/:id" element={<ProtectedRoute roles={FLEET_ROLES}><VehicleDetail /></ProtectedRoute>} />
          <Route path="/fleet/vehicles/:id/edit" element={<ProtectedRoute roles={FLEET_ROLES}><VehicleForm isEdit={true} /></ProtectedRoute>} />

          {/* ── Route Optimization ── */}
          <Route path="/routing/routes" element={<ProtectedRoute roles={ROUTING_ROLES}><RouteOptimization /></ProtectedRoute>} />
          <Route path="/routing/routes/new" element={<ProtectedRoute roles={ROUTING_ROLES}><RouteForm isEdit={false} /></ProtectedRoute>} />
          <Route path="/routing/route/:id" element={<ProtectedRoute roles={ROUTING_ROLES}><RouteDetail /></ProtectedRoute>} />
          <Route path="/routing/route/:id/edit" element={<ProtectedRoute roles={ROUTING_ROLES}><RouteForm isEdit={true} /></ProtectedRoute>} />
          <Route path="/routing/load-planning" element={<ProtectedRoute roles={ROUTING_ROLES}><LoadPlanning /></ProtectedRoute>} />
          <Route path="/routing/load/new" element={<ProtectedRoute roles={ROUTING_ROLES}><LoadForm /></ProtectedRoute>} />
          <Route path="/routing/load/:id" element={<ProtectedRoute roles={ROUTING_ROLES}><LoadDetail /></ProtectedRoute>} />

          <Route path="/routing/rules" element={<ProtectedRoute roles={ROUTING_ROLES}><RoutingRules /></ProtectedRoute>} />
          <Route path="/routing/rules/new" element={<ProtectedRoute roles={ROUTING_ROLES}><RoutingRuleForm /></ProtectedRoute>} />
          <Route path="/routing/rules/:id" element={<ProtectedRoute roles={ROUTING_ROLES}><RoutingRuleDetail /></ProtectedRoute>} />

          {/* ── Exceptions & Claims ── */}
          <Route path="/exceptions" element={<ProtectedRoute roles={EXCEPTION_VIEW_ROLES}><ExceptionsList /></ProtectedRoute>} />
          <Route path="/exceptions/new" element={<ProtectedRoute roles={EXCEPTION_CREATE_ROLES}><NewException /></ProtectedRoute>} />
          <Route path="/exceptions/:id" element={<ProtectedRoute roles={EXCEPTION_VIEW_ROLES}><ExceptionDetail /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute roles={EXCEPTION_VIEW_ROLES}><ClaimsList /></ProtectedRoute>} />
          <Route path="/claims/new" element={<ProtectedRoute roles={CLAIM_CREATE_ROLES}><NewClaim /></ProtectedRoute>} />
          <Route path="/claims/:id" element={<ProtectedRoute roles={EXCEPTION_VIEW_ROLES}><ClaimDetail /></ProtectedRoute>} />

          {/* ── Management & Profile ── */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          
          <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
          <Route path="/tasks/new" element={<ProtectedRoute><NewTaskPage /></ProtectedRoute>} />
          <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />

          {/* ── Admin Only ── */}
          <Route path="/admin/users" element={<ProtectedRoute role="Admin"><UsersPage /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute role="Admin"><AuditLogsPage /></ProtectedRoute>} />
          
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}