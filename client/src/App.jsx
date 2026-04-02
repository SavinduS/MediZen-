import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DoctorListing from './pages/DoctorListing';
import MyAppointments from './pages/MyAppointments';
import VideoRoom from './pages/VideoRoom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        {/* Modern Navigation Bar */}
        <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight text-blue-400">
              MediZen <span className="text-white">Healthcare</span>
            </h1>
            <nav className="space-x-8 hidden md:flex">
              <Link to="/" className="hover:text-blue-400 transition">Doctors</Link>
              <Link to="/my-appointments" className="hover:text-blue-400 transition">My Appointments</Link>
            </nav>
            <button className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-full font-medium transition shadow-md">
              Login
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="container mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<DoctorListing />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/video" element={<VideoRoom />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;