import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import { syncUser } from "./services/api";

// Pages
import DoctorListing from "./pages/DoctorListing";
import MyAppointments from "./pages/MyAppointments";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VideoRoom from "./pages/VideoRoom";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorSettings from "./pages/DoctorSettings";
import AvailabilityManager from "./pages/AvailabilityManager";
import PatientReportViewer from "./pages/PatientReportViewer";
import PrescriptionForm from "./pages/PrescriptionForm";
import PatientProfile from "./pages/PatientProfile";
import MedicalReports from "./pages/MedicalReports";
import SymptomChecker from "./pages/SymptomChecker";
import PaymentCheckout from "./pages/PaymentCheckout";
import PaymentCheckout from "./pages/PaymentCheckout.jsx";
import PaymentStatus from "./pages/PaymentStatus";
import ReceiptPage from "./pages/ReceiptPage";

// Admin Layout & Pages
import AdminLayout from "./components/layouts/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminNotifications from "./pages/admin/AdminNotifications";

// 1. Helper Component to protect routes and wait for the Role to load
const ProtectedRoute = ({ children, allowedRole, currentRole, loading }) => {
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-medium text-blue-600 bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying Access...</span>
        </div>
      </div>
    );
  }
  if (currentRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppContent() {
  const { user, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Sync with Backend Auth Service
  useEffect(() => {
    const syncBackendUser = async () => {
      if (user) {
        try {
          const token = await getToken();
          const response = await syncUser(user.primaryEmailAddress.emailAddress, token);
          const userRole = response.data.role.toLowerCase();
          setRole(userRole);

          // Handle automatic redirection based on role after successful login
          if (location.pathname === "/login" || location.pathname === "/register") {
            if (userRole === "admin") {
              navigate("/admin/dashboard", { replace: true });
            } else if (userRole === "doctor") {
              navigate("/doctor-dashboard", { replace: true });
            } else {
              navigate("/", { replace: true });
            }
          }
        } catch (error) {
          console.error("Backend Sync Error:", error);
        } finally {
          setLoadingRole(false);
        }
      } else if (clerkLoaded && !user) {
        setLoadingRole(false);
      }
    };

    if (clerkLoaded) syncBackendUser();
  }, [user, clerkLoaded, getToken, navigate, location.pathname]);

  // Handle landing page redirections based on role
  useEffect(() => {
    if (!loadingRole && role) {
      // Admin Redirection
      if (role === "admin") {
        if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register") {
          navigate("/admin/dashboard", { replace: true });
        }
      } 
      // Doctor Redirection
      else if (role === "doctor") {
        if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register") {
          navigate("/doctor-dashboard", { replace: true });
        }
      }
      
      // Safety: Prevent non-admins from hitting admin routes
      if (role !== "admin" && location.pathname.startsWith("/admin")) {
        navigate("/", { replace: true });
      }
    }
  }, [role, loadingRole, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-blue-400"
          >
            MediZen <span className="text-white">Healthcare</span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="space-x-8 hidden md:flex font-medium items-center">
              <SignedIn>
                {role === "admin" && (
                  <Link to="/admin/dashboard" className="hover:text-blue-400 transition text-blue-100">
                    Admin Panel
                  </Link>
                )}

                {role === "doctor" && (
                  <>
                    <Link to="/doctor-dashboard" className="hover:text-blue-400 transition text-slate-300">
                      Dashboard
                    </Link>
                    <Link to="/doctor-settings" className="hover:text-blue-400 transition text-blue-100">
                      Profile
                    </Link>
                  </>
                )}

                {role === "patient" && (
                  <>
                    <Link to="/" className="hover:text-blue-400 transition text-slate-300">
                      Doctors
                    </Link>
                    <Link to="/my-appointments" className="hover:text-blue-400 transition text-blue-100">
                      My Appointments
                    </Link>
                    <Link to="/reports" className="hover:text-blue-400 transition text-blue-100">
                      Medical Reports
                    </Link>
                    <Link to="/profile" className="hover:text-blue-400 transition text-blue-100">
                      Profile
                    </Link>
                  </>
                )}
              </SignedIn>
            </nav>

            <SignedOut>
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full font-bold transition shadow-md"
              >
                Login
              </Link>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-3">
                {!loadingRole && (
                  <span className="text-[10px] bg-slate-800 px-2 py-1 rounded uppercase font-bold text-blue-400 border border-slate-700">
                    {role}
                  </span>
                )}
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className={`${location.pathname.startsWith('/admin') ? 'w-full flex-grow' : 'container mx-auto px-6 py-8 flex-grow'}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<DoctorListing />} />
          <Route path="/login/*" element={<LoginPage />} />
          <Route path="/register/*" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <SignedIn>
                <ProtectedRoute
                  allowedRole="patient"
                  currentRole={role}
                  loading={loadingRole}
                >
                  <PatientProfile />
                </ProtectedRoute>
              </SignedIn>
            }
          />

          <Route
            path="/reports"
            element={
              <SignedIn>
                <ProtectedRoute
                  allowedRole="patient"
                  currentRole={role}
                  loading={loadingRole}
                >
                  <MedicalReports />
                </ProtectedRoute>
              </SignedIn>
            }
          />

          <Route
            path="/my-appointments"
            element={
              <SignedIn>
                <ProtectedRoute allowedRole="patient" currentRole={role} loading={loadingRole}>
                  <MyAppointments />
                </ProtectedRoute>
              </SignedIn>
            }
          />

          {/* Payment Routes */}
          <Route path="/checkout" element={<PaymentCheckout />} />
          <Route path="/payment-status" element={<PaymentStatus />} />
          <Route path="/receipt" element={<ReceiptPage />} />

          {/* Nested Admin Routes */}
          <Route
            path="/admin"
            element={
              <SignedIn>
                <ProtectedRoute allowedRole="admin" currentRole={role} loading={loadingRole}>
                  <AdminLayout />
                </ProtectedRoute>
              </SignedIn>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="doctors" element={<AdminDoctors />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

           <Route
              path="/issue-prescription"
              element={
                <SignedIn>
                  <ProtectedRoute allowedRole="doctor" currentRole={role} loading={loadingRole}>
                    <PrescriptionForm />
                  </ProtectedRoute>
                </SignedIn>
              }
            />

            <Route
              path="/doctor-dashboard"
              element={
                <SignedIn>
                  <ProtectedRoute allowedRole="doctor" currentRole={role} loading={loadingRole}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                </SignedIn>
              }
            />

            <Route
              path="/doctor-settings"
              element={
                <SignedIn>
                  <ProtectedRoute allowedRole="doctor" currentRole={role} loading={loadingRole}>
                    <DoctorSettings />
                  </ProtectedRoute>
                </SignedIn>
              }
            />

            <Route
              path="/availability"
              element={
                <SignedIn>
                  <ProtectedRoute allowedRole="doctor" currentRole={role} loading={loadingRole}>
                    <AvailabilityManager />
                  </ProtectedRoute>
                </SignedIn>
              }
            />

            <Route
              path="/patient-reports/:patientId"
              element={
                <SignedIn>
                  <ProtectedRoute allowedRole="doctor" currentRole={role} loading={loadingRole}>
                    <PatientReportViewer />
                  </ProtectedRoute>
                </SignedIn>
              }
            />

            {/* Video Consultation Room (Shared - Accessible by both signed-in Doctor/Patient) */}
            <Route
              path="/video"
              element={
                <SignedIn>
                  <VideoRoom />
                </SignedIn>
              }
            />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="py-8 bg-white border-t border-slate-200 text-center text-slate-500 text-sm">
        &copy; 2026 MediZen Healthcare - Distributed Systems Assignment
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
       </Routes>
      </main>

      <footer className="py-8 bg-white border-t border-slate-200 text-center text-slate-500 text-sm">
        &copy; 2026 MediZen Healthcare - Distributed Systems Assignment
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
