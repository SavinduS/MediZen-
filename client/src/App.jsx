import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

// Pages
import DoctorListing from "./pages/DoctorListing";
import MyAppointments from "./pages/MyAppointments";
import LoginPage from "./pages/LoginPage"; // New
import SignupPage from "./pages/SignupPage"; // New

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes WITHOUT the header (Full screen) */}
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/register/*" element={<SignupPage />} />

        {/* Main App routes WITH the header */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-slate-50">
              <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                  <Link
                    to="/"
                    className="text-2xl font-bold tracking-tight text-blue-400"
                  >
                    MediZen <span className="text-white">Healthcare</span>
                  </Link>
                  <div className="flex items-center gap-6">
                    <nav className="space-x-8 hidden md:flex">
                      <Link to="/" className="hover:text-blue-400 transition">
                        Doctors
                      </Link>
                      <SignedIn>
                        <Link
                          to="/my-appointments"
                          className="hover:text-blue-400 transition"
                        >
                          Appointments
                        </Link>
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
                      <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                  </div>
                </div>
              </header>

              <main className="container mx-auto px-6 py-8">
                <Routes>
                  <Route path="/" element={<DoctorListing />} />
                  <Route
                    path="/my-appointments"
                    element={
                      <SignedIn>
                        <MyAppointments />
                      </SignedIn>
                    }
                  />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
