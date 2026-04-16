import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from "@clerk/clerk-react"; 
import { useNavigate } from 'react-router-dom';
import { Calendar, Video, Clock, CheckCircle } from 'lucide-react';

const MyAppointments = () => {
    const { user, isLoaded } = useUser(); // Get real user data
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return; 
            try {
                // IMPORTANT: Fetching data by real logged-in Email
                const patientEmail = user.primaryEmailAddress.emailAddress;
                const res = await axios.get(`http://localhost:5004/api/appointments/patient/${patientEmail}`);
                setAppointments(res.data);
            } catch (err) {
                console.error("Clinical Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        if (isLoaded) fetchHistory();
    }, [user, isLoaded]);

    if (!isLoaded || loading) return <div className="p-10 text-center font-bold text-blue-600">Syncing Clinical Records...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 lg:p-10">
            <header className="mb-12">
                <h2 className="text-4xl font-black text-slate-900">Consultation History</h2>
                <p className="text-slate-500 font-medium">Hello {user?.firstName}, here are your verified medical sessions.</p>
            </header>

            <div className="grid gap-6">
                {appointments.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold mb-4">No appointments found for your account.</p>
                        <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Book a Specialist</button>
                    </div>
                ) : (
                    appointments.map(apt => (
                        <div key={apt._id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-xl transition-all">
                            <div className="flex gap-6 items-center">
                                <div className="bg-blue-50 p-5 rounded-3xl text-blue-600"><Calendar size={28} /></div>
                                <div>
                                    <span className="text-[10px] font-black text-blue-500 uppercase px-2 py-0.5 bg-blue-50 rounded-md">{apt.appointmentId}</span>
                                    <h3 className="text-xl font-bold text-slate-800">Video Consultation</h3>
                                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase"><Clock size={12} className="inline mr-1"/> {new Date(apt.slotTime).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase ${apt.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>● {apt.status}</span>
                                <button 
                                    onClick={() => navigate(`/video?aptId=${apt.appointmentId}&role=patient`)}
                                    className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase transition shadow-lg active:scale-95"
                                >
                                    Join Call
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