/**
 * Doctor Listing & Booking Component
 * Purpose: Allows patients to view available doctors and schedule consultations.
 * Member 2 Responsibility: Integrated with Clerk (Member 1) for Patient Auth.
 */

import React, { useEffect, useState } from 'react';
import { fetchDoctors, bookAppointment } from '../services/api';
import { useUser } from "@clerk/clerk-react"; // Hook to get logged-in user details
import { useNavigate } from 'react-router-dom'; // For navigation to login/appointments
import { Stethoscope, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

const DoctorListing = () => {
  const { user, isSignedIn } = useUser(); // Get auth state from Clerk
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States for Booking Modal
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingData, setBookingData] = useState({ slotTime: '' });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  /**
   * Handle the Appointment Booking Process
   * Ensures the user is logged in before allowing a reservation.
   */
  const handleBooking = async (e) => {
    e.preventDefault();
    
    // 1. Double check if user is signed in
    if (!isSignedIn) {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // 2. Build the payload using REAL user data from Clerk
      const payload = {
        patientId: user.primaryEmailAddress.emailAddress, // Use email as unique identifier
        doctorId: selectedDoctor.doctorId,
        slotTime: bookingData.slotTime
      };

      const response = await bookAppointment(payload);
      
      // Redirect to checkout with full appointment details
      navigate('/checkout', {
        state: {
          appointmentId: response.data.data.appointmentId,
          doctorId: selectedDoctor.doctorId,
          doctorName: selectedDoctor.name,
          doctorSpecialty: selectedDoctor.specialization,
          appointmentDateTime: bookingData.slotTime,
          amount: selectedDoctor.fee
        }
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Conflict detected';
      setMessage(`❌ Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-slate-500 font-medium">Finding available specialists...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
          World-Class <span className="text-blue-600">Specialists</span>
        </h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Skip the waiting room. Book expert doctors for real-time video consultations in just a few clicks.
        </p>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {doctors.map(doctor => (
          <div key={doctor._id} className="group bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-500 overflow-hidden flex flex-col">
            <div className="p-8 flex-grow">
              <div className="flex items-center justify-between mb-6">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Stethoscope size={24} />
                </div>
                <div className="text-right">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block">Session Fee</span>
                    <span className="text-xl font-black text-slate-900">LKR {doctor.fee}</span>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">Dr. {doctor.name}</h3>
              <p className="text-blue-500 font-bold text-sm mb-4 uppercase tracking-tight">{doctor.specialization}</p>
              
              <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 italic">
                "{doctor.bio || "Expert consultant committed to providing high-quality patient care and diagnosis."}"
              </p>
            </div>
            
            <div className="p-8 pt-0">
              <button 
                onClick={() => {
                  if(!isSignedIn) {
                    navigate('/login');
                  } else {
                    setSelectedDoctor(doctor);
                  }
                }}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-blue-600 transition shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                {isSignedIn ? 'Book Consultation' : 'Sign in to Book'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- BOOKING MODAL (Protected by Clerk session) --- */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden transform animate-in slide-in-from-bottom-8">
            <div className="bg-slate-900 p-8 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Clock size={80} />
                </div>
              <h3 className="text-2xl font-bold">Schedule Session</h3>
              <p className="text-blue-400 text-sm font-medium mt-1">With Dr. {selectedDoctor.name}</p>
            </div>
            
            <form onSubmit={handleBooking} className="p-8 space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                    <Clock size={16} className="text-blue-600" /> Choose Your Time Slot
                </label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white transition-all outline-none font-medium"
                  onChange={(e) => setBookingData({...bookingData, slotTime: e.target.value})}
                />
                <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                    <ShieldCheck size={12}/> Secure end-to-end encrypted booking
                </p>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-pulse ${message.includes('✅') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {message.includes('✅') ? <ShieldCheck size={20}/> : <AlertCircle size={20}/>}
                  {message}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => { setSelectedDoctor(null); setMessage(''); }}
                  className="flex-1 px-4 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition active:scale-95"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-200 disabled:bg-slate-300 active:scale-95"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm'}
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