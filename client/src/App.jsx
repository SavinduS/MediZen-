import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";
import axios from "axios";

// Pages
import DoctorListing from "./pages/DoctorListing";
import MyAppointments from "./pages/MyAppointments";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import VideoRoom from "./pages/VideoRoom";
import DoctorDashboard from "./pages/DoctorDashboard";
import PrescriptionForm from "./pages/PrescriptionForm";
import PatientProfile from "./pages/PatientProfile";
import MedicalReports from "./pages/MedicalReports";

// 1. Helper Component to protect routes and wait for the Role to load
const ProtectedRoute = ({ children, allowedRole, currentRole, loading }) => {
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center font-medium text-blue-600">
        Verifying Access...
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

  // Sync with Member 01 Auth Service
  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        try {
          const token = await getToken();
          const response = await axios.post(
            "http://localhost:5001/api/auth/sync",
            { email: user.primaryEmailAddress.emailAddress },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          // Set role and stop loading
          setRole(response.data.role.toLowerCase());
        } catch (error) {
          console.error("Backend Sync Error:", error);
        } finally {
          setLoadingRole(false);
        }
      } else if (clerkLoaded && !user) {
        setLoadingRole(false);
      }
    };

    if (clerkLoaded) syncUser();
  }, [user, clerkLoaded, getToken]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold tracking-tight text-blue-400"
          >
            MediZen <span className="text-white">Healthcare</span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="space-x-8 hidden md:flex font-medium">
              <Link to="/" className="hover:text-blue-400 transition">
                Doctors
              </Link>

              <SignedIn>
                {/* Show Patient links if role is 'patient' OR if we are still loading (to prevent flicker) */}
                {(role === "patient" || loadingRole) && (
                  <>
                    <Link
                      to="/my-appointments"
                      className="hover:text-blue-400 transition text-blue-100"
                    >
                      My Appointments
                    </Link>
                    <Link
                      to="/reports"
                      className="hover:text-blue-400 transition text-blue-100"
                    >
                      Medical Reports
                    </Link>
                    <Link
                      to="/profile"
                      className="hover:text-blue-400 transition text-blue-100"
                    >
                      Profile
                    </Link>
                  </>
                )}

                {role === "doctor" && (
                  <Link
                    to="/doctor-dashboard"
                    className="hover:text-blue-400 transition"
                  >
                    Dashboard
                  </Link>
                )}
                {role === "admin" && (
                  <Link to="/admin-panel" className="text-red-400 transition">
                    Admin
                  </Link>
                )}
              </SignedIn>
            </nav>

            <SignedOut>
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full font-medium"
              >
                Login
              </Link>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-3">
                {!loadingRole && (
                  <span className="text-[10px] bg-slate-700 px-2 py-1 rounded uppercase font-bold text-slate-300 border border-slate-600">
                    {role}
                  </span>
                )}
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<DoctorListing />} />
          <Route path="/login/*" element={<LoginPage />} />
          <Route path="/register/*" element={<SignupPage />} />

          {/* Patient Routes - Now uses the ProtectedRoute helper */}
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

          {/* Placeholder Routes for Member 02 & 03 */}
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
              path="/issue-prescription"
              element={
                <SignedIn>
                  <ProtectedRoute allowedRole="doctor" currentRole={role} loading={loadingRole}>
                    <PrescriptionForm />
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

          <Route
            path="/admin-panel"
            element={
              <SignedIn>
                <div>Admin Panel</div>
              </SignedIn>
            }
          />
        </Routes>
      </main>

      <footer className="py-6 text-center text-slate-400 text-sm">
        &copy; 2026 MediZen
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
