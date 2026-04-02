import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Calendar, Video, Clock } from 'lucide-react';

const MyAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const navigate = useNavigate();
    
    // මෑතකදී අපි බුක් කරන්න පාවිච්චි කරපු ID එක මෙතනට දාන්න
    const patientId = "PAT-TEST-01"; 

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Appointment Service (5004) එකෙන් දත්ත ලබා ගැනීම
                const res = await axios.get(`http://localhost:5004/api/appointments/patient/${patientId}`);
                setAppointments(res.data);
            } catch (err) {
                console.error("Error fetching history:", err);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-6">
            <header className="mb-10">
                <h2 className="text-3xl font-bold text-slate-800">My Consultation History</h2>
                <p className="text-slate-500">Track and join your upcoming medical sessions.</p>
            </header>

            <div className="grid gap-6">
                {appointments.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl text-center border-2 border-dashed border-slate-200">
                        <p className="text-slate-400">No appointments found for this patient.</p>
                    </div>
                ) : (
                    appointments.map(apt => (
                        <div key={apt._id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition">
                            <div className="flex gap-4 items-center">
                                <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
                                    <Calendar size={28} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">{apt.appointmentId}</p>
                                    <h3 className="text-xl font-bold text-slate-800">Consultation with {apt.doctorId}</h3>
                                    <div className="flex items-center gap-4 mt-1 text-slate-500 text-sm">
                                        <span className="flex items-center gap-1"><Clock size={14}/> {new Date(apt.slotTime).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <span className={`px-4 py-1 rounded-full text-xs font-bold ${apt.status === 'PENDING' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                    ● {apt.status}
                                </span>
                                <button 
                                    onClick={() => navigate(`/video?aptId=${apt.appointmentId}`)}
                                    className="flex-1 md:flex-none bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg active:scale-95"
                                >
                                    <Video size={18} /> Join Video Call
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyAppointments;