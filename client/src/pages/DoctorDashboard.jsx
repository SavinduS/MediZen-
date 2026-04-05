/**
 * Doctor Dashboard Component
 * Purpose: Allows medical professionals to view their upcoming consultations and manage patients.
 * Member 2 Responsibility: Core Consultation Logic & Prescription Flow.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, FileText, Video, User, Activity } from 'lucide-react';

const DoctorDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Placeholder Doctor Information (Normally retrieved via Member 1's Auth Service)
    const currentDoctorId = "DOC-01"; 

    useEffect(() => {
        /**
         * Fetch current appointment queue from the Appointment Service (Port 5004)
         */
        const fetchDoctorQueue = async () => {
            try {
                // Requesting all appointments to verify data flow
                const response = await axios.get('http://localhost:5004/api/appointments');
                
                // Filter appointments specifically for this doctor
                // Note: If list is still empty, verify the doctorId used during booking (PAT-TEST side)
                const myQueue = response.data.filter(apt => apt.doctorId === "DOC-01" || apt.doctorId === "DOC-99" || apt.doctorId === "DOC-88");
                
                setAppointments(myQueue);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch doctor queue:", error);
                setLoading(false);
            }
        };

        fetchDoctorQueue();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="animate-bounce text-blue-600 font-bold">Synchronizing Patient Queue...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                
                {/* DASHBOARD HEADER */}
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Dashboard</h2>
                        <p className="text-slate-500 font-medium">Welcome back, Dr. Kamal Perera. You have {appointments.length} sessions today.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200">
                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                            <Activity size={20}/>
                        </div>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide italic">Status: Online</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT SECTION: PATIENT QUEUE */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                                <ClipboardList className="text-blue-600" /> Upcoming Consultations
                            </h3>
                            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">LIVE QUEUE</span>
                        </div>
                        
                        {appointments.length === 0 ? (
                            <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium">No pending appointments found in your queue.</p>
                            </div>
                        ) : (
                            appointments.map(apt => (
                                <div key={apt._id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-blue-400 hover:shadow-md transition-all duration-300">
                                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                                        <div className="bg-slate-100 p-4 rounded-2xl text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{apt.appointmentId}</p>
                                            <h4 className="text-lg font-bold text-slate-800 tracking-tight">Patient: {apt.patientId}</h4>
                                            <p className="text-slate-400 flex items-center gap-1 text-xs font-semibold">
                                                <Clock size={12}/> Scheduled: {new Date(apt.slotTime).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button 
                                            onClick={() => navigate(`/video?aptId=${apt.appointmentId}`)}
                                            className="flex-1 md:flex-none bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition shadow-lg shadow-slate-200 active:scale-95"
                                            title="Join Video Room"
                                        >
                                            <Video size={20}/>
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/issue-prescription?aptId=${apt.appointmentId}&patientId=${apt.patientId}`)}
                                            className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-100 active:scale-95 text-sm"
                                        >
                                            <FileText size={18}/> Issue Prescription
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* RIGHT SECTION: QUICK ACTIONS & ANALYTICS */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-6 text-lg tracking-tight">Analytics Summary</h3>
                            <div className="space-y-4">
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-1">Queue Depth</p>
                                    <p className="text-4xl font-black text-slate-900">{appointments.length}</p>
                                    <p className="text-xs text-blue-500 font-bold mt-2">Active Patients</p>
                                </div>
                                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-blue-600 transition shadow-xl shadow-slate-200">
                                    Update Work Hours
                                </button>
                                <button 
                                    onClick={() => navigate('/')}
                                    className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-50 transition"
                                >
                                    Switch to Patient View
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
                             <h4 className="font-bold text-lg mb-2 italic">Pro Tip:</h4>
                             <p className="text-blue-100 text-xs leading-relaxed">Always verify the Patient's medical history from the "Patient Management Service" before issuing a prescription.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;