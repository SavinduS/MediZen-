import React, { useEffect, useState } from 'react';
import { fetchDoctors, bookAppointment } from '../services/api';

const DoctorListing = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Booking Modal
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingData, setBookingData] = useState({ slotTime: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const response = await fetchDoctors();
      setDoctors(response.data);
      setLoading(false);
    } catch (error) {
      console.error("API Error:", error);
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patientId: "PAT-TEST-01", // Normally this comes from Auth Context
        doctorId: selectedDoctor.doctorId,
        slotTime: bookingData.slotTime
      };

      const response = await bookAppointment(payload);
      setMessage(`✅ Appointment booked! ID: ${response.data.data.appointmentId}`);
      setTimeout(() => {
        setSelectedDoctor(null); // Close modal
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage(`❌ Booking failed: ${error.response?.data?.message || 'Conflict'}`);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Our Specialists</h2>
        <p className="text-slate-500 mt-2">Choose a doctor and schedule your consultation in seconds.</p>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {doctors.map(doctor => (
          <div key={doctor._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-lg uppercase">
                  {doctor.specialization}
                </span>
                <span className="text-xl font-bold text-slate-900">LKR {doctor.fee}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Dr. {doctor.name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2">
                {doctor.bio || "Leading medical expert with specialized clinical experience."}
              </p>
              
              <button 
                onClick={() => setSelectedDoctor(doctor)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition shadow-lg active:scale-95"
              >
                Book Appointment
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- BOOKING MODAL (Pop-up) --- */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 p-6 text-white">
              <h3 className="text-xl font-bold">Book with Dr. {selectedDoctor.name}</h3>
              <p className="text-slate-400 text-sm mt-1">{selectedDoctor.specialization}</p>
            </div>
            
            <form onSubmit={handleBooking} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Consultation Time</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setBookingData({...bookingData, slotTime: e.target.value})}
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-sm font-medium ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorListing;