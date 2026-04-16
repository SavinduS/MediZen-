/**
 * Doctor Dashboard Component
 * Purpose: Allows medical professionals to view their upcoming consultations and manage patients.
 * Member 2 Responsibility: Core Consultation Logic & Prescription Flow.
 * Integrated with Clerk Auth (Member 1).
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react"; // Import Clerk hook to get logged-in user
import { ClipboardList, Clock, FileText, Video, User, Activity, Settings } from 'lucide-react';
import { fetchDoctorProfileByUserId } from '../services/api';
import axios from 'axios';

const DoctorDashboard = () => {
    const { user } = useUser(); // Access Clerk user object
    const [appointments, setAppointments] = useState([]);
    const [doctorInfo, setDoctorInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        /**
         * Fetch current appointment queue from the Appointment Service (Port 5004)
         */
        const fetchDoctorQueue = async () => {
            try {
                // 1. First, get the logged-in doctor's profile to find their internal doctorId
                const profileRes = await fetchDoctorProfileByUserId(user.id);
                const currentDoctor = profileRes.data;
                setDoctorInfo(currentDoctor);

                // 2. Requesting all appointments from the shared microservice
                const response = await axios.get('http://localhost:5004/api/appointments');
                
                /**
                 * Logic: Filter appointments to show ONLY those matching this doctor's ID
                 */
                const myQueue = response.data.filter(apt => 
                    apt.doctorId === currentDoctor.doctorId || apt.doctorId === currentDoctor._id.toString()
                );
                
                setAppointments(myQueue);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch doctor data:", error);
                setLoading(false);
            }
        };

        if (user) fetchDoctorQueue();
    }, [user]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                <div className="text-blue-600 font-bold tracking-widest">SECURE DATA SYNC...</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                
                {/* DASHBOARD HEADER - Dynamic Data from Clerk */}
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Hub</h2>
                        <p className="text-slate-500 font-medium italic">
                            Logged in as: <span className="text-blue-600 font-bold">{user?.fullName || "Medical Professional"}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200">
                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                            <Activity size={20}/>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">System Node</span>
                            <span className="text-xs font-bold text-slate-700">ONLINE_CORE_M2</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT SECTION: PATIENT QUEUE */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                                <ClipboardList className="text-blue-600" /> Pending Consultation Queue
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="animate-pulse bg-red-500 h-2 w-2 rounded-full"></span>
                                <span className="text-slate-500 text-[10px] font-black uppercase">Live Updates</span>
                            </div>
                        </div>
                        
                        {appointments.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200">
                                <User className="mx-auto text-slate-200 mb-4" size={48} />
                                <p className="text-slate-400 font-medium">Your consultation queue is currently empty.</p>
                            </div>
                        ) : (
                            appointments.map(apt => (
                                <div key={apt._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-blue-500 hover:shadow-xl transition-all duration-500">
                                    <div className="flex items-center gap-5 mb-4 md:mb-0">
                                        <div className="bg-slate-50 p-4 rounded-3xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                            <User size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-blue-100 uppercase">{apt.appointmentId}</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-slate-800 tracking-tight capitalize">ID: {apt.patientId}</h4>
                                            <p className="text-slate-400 flex items-center gap-1.5 text-xs font-bold mt-1">
                                                <Clock size={12} className="text-blue-500"/> {new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button 
                                            onClick={() => navigate(`/video?aptId=${apt.appointmentId}&role=doctor`)}
                                            className="flex-1 md:flex-none bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition shadow-lg active:scale-95"
                                            title="Initialize Secure Video Channel"
                                        >
                                            <Video size={20}/>
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/issue-prescription?aptId=${apt.appointmentId}&patientId=${apt.patientId}`)}
                                            className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100 active:scale-95"
                                        >
                                            Issue Rx
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* RIGHT SECTION: ANALYTICS & STATS */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-8 text-xl tracking-tight border-b border-slate-50 pb-4">Daily Report</h3>
                            <div className="space-y-6">
                                <div className="bg-slate-900 p-8 rounded-[2rem] text-center shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
                                        <ClipboardList size={60} />
                                    </div>
                                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-2">Queue Workload</p>
                                    <p className="text-6xl font-black text-white">{appointments.length}</p>
                                    <p className="text-xs text-blue-400 font-bold mt-4">Assigned Cases</p>
                                </div>
                                
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => navigate('/doctor-settings')}
                                        className="w-full py-4 bg-white text-slate-800 border-2 border-slate-100 rounded-2xl font-bold text-sm hover:border-blue-200 transition"
                                    >
                                        Edit Profile & Fees
                                    </button>
                                    <button 
                                        onClick={() => navigate('/availability')}
                                        className="w-full py-4 bg-white text-slate-800 border-2 border-slate-100 rounded-2xl font-bold text-sm hover:border-blue-200 transition"
                                    >
                                        Update Availability Slots
                                    </button>
                                    <button 
                                        onClick={() => navigate('/')}
                                        className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition"
                                    >
                                        Patient Portal View
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                             <div className="relative z-10">
                                <h4 className="font-bold text-lg mb-3">Clinical Compliance</h4>
                                <p className="text-blue-100 text-xs leading-relaxed font-medium">Automated Digital Prescriptions (Member 2 PDF Engine) ensure all medical sessions follow the regional healthcare standard ISO-2026.</p>
                             </div>
                             <div className="absolute -bottom-6 -right-6 opacity-20 transform rotate-12">
                                <FileText size={100} />
                             </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;