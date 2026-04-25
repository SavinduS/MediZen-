/**
 * Doctor Dashboard Component
 * Purpose: Allows medical professionals to view their upcoming consultations and manage patients.
 * Member 2 Responsibility: Core Consultation Logic & Prescription Flow.
 * Integrated with Clerk Auth (Member 1).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react"; 
import { ClipboardList, Clock, FileText, Video, User, Activity, Droplets, AlertCircle, Hash } from 'lucide-react';
import { fetchDoctorProfileByUserId, fetchPatientInternalProfile, fetchAllAuthUsers } from '../services/api';
import axios from 'axios';

const DoctorDashboard = () => {
    const { user } = useUser();
    const [appointments, setAppointments] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);
    const [doctorInfo, setDoctorInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [patientData, setPatientData] = useState({});
    const [usersMap, setUsersMap] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDoctorQueue = async () => {
            try {
                // 1. Get the logged-in doctor's profile
                const profileRes = await fetchDoctorProfileByUserId(user.id);
                const currentDoctor = profileRes.data;
                setDoctorInfo(currentDoctor);

                // 2. Fetch all appointments and users in parallel for efficiency
                const [appointmentsRes, authUsersRes] = await Promise.all([
                    axios.get('http://localhost:5004/api/appointments'),
                    fetchAllAuthUsers()
                ]);
                
                const allApts = appointmentsRes.data;
                setAllAppointments(allApts);

                // Map auth users by clerkId for O(1) email lookup
                const uMap = {};
                authUsersRes.data.data.forEach(u => {
                    uMap[u.clerkId] = u;
                });
                setUsersMap(uMap);

                // Filter for this doctor's queue
                const myQueue = allApts.filter(apt => 
                    apt.doctorId === currentDoctor.doctorId || apt.doctorId === currentDoctor._id.toString()
                );
                setAppointments(myQueue);

                // 3. Fetch Patient Internal Details (Blood group, allergies)
                const patientInfo = {};
                for (const apt of myQueue) {
                    if (!patientInfo[apt.patientId]) {
                        try {
                            const pRes = await fetchPatientInternalProfile(apt.patientId);
                            patientInfo[apt.patientId] = pRes.data;
                        } catch (err) {
                            console.error(`Failed to fetch details for patient ${apt.patientId}`, err);
                        }
                    }
                }
                setPatientData(patientInfo);
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch doctor data:", error);
                setLoading(false);
            }
        };

        if (user) fetchDoctorQueue();
    }, [user]);

    // Calculate appointment counts per patient across the entire system
    const appointmentStats = useMemo(() => {
        const stats = {};
        allAppointments.forEach(apt => {
            stats[apt.patientId] = (stats[apt.patientId] || 0) + 1;
        });
        return stats;
    }, [allAppointments]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                <div className="text-blue-600 font-bold tracking-widest uppercase">Initializing Clinical Hub...</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Hub</h2>
                        <p className="text-slate-500 font-medium italic">
                            Medical Officer: <span className="text-blue-600 font-bold">{user?.fullName || "Professional"}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200">
                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                            <Activity size={20}/>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Node Status</span>
                            <span className="text-xs font-bold text-slate-700">ONLINE_SECURE</span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                                <ClipboardList className="text-blue-600" /> Consultation Queue
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
                            appointments.map(apt => {
                                const patient = patientData[apt.patientId] || {};
                                const userAccount = usersMap[apt.patientId] || {};
                                const totalApts = appointmentStats[apt.patientId] || 0;

                                return (
                                <div key={apt._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-500 hover:shadow-xl transition-all duration-500">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                                        <div className="flex items-center gap-5 mb-4 md:mb-0">
                                            <div className="bg-slate-50 p-4 rounded-3xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                <User size={28} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-blue-100 uppercase">{apt.appointmentId}</span>
                                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-md border border-slate-200 uppercase flex items-center gap-1">
                                                        <Hash size={10} /> {totalApts} Appointments
                                                    </span>
                                                </div>
                                                <h4 className="text-xl font-bold text-slate-800 tracking-tight lowercase">
                                                    {userAccount.email || apt.patientId}
                                                </h4>
                                                {patient.firstName && (
                                                    <p className="text-blue-600 text-xs font-bold -mt-1 mb-1 capitalize">
                                                        Record Name: {patient.firstName}
                                                    </p>
                                                )}
                                                <p className="text-slate-400 flex items-center gap-1.5 text-[10px] font-bold">
                                                    <Clock size={10} className="text-blue-500"/> {new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.slotTime).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 w-full md:w-auto">
                                            <button 
                                                onClick={() => navigate(`/patient-reports/${apt.patientId}`)}
                                                className="flex-1 md:flex-none bg-blue-50 text-blue-600 p-4 rounded-2xl hover:bg-blue-100 transition shadow-sm active:scale-95"
                                                title="View Patient Medical Reports"
                                            >
                                                <FileText size={20}/>
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/video?aptId=${apt.appointmentId}&role=doctor`)}
                                                className="flex-1 md:flex-none bg-slate-900 text-white p-4 rounded-2xl hover:bg-blue-600 transition shadow-lg active:scale-95"
                                                title="Initialize Secure Video Channel"
                                            >
                                                <Video size={20}/>
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/issue-prescription?aptId=${apt.appointmentId}&patientId=${apt.patientId}&patientName=${encodeURIComponent(patient.firstName || userAccount.name || userAccount.email?.split('@')[0] || apt.patientId)}`)}
                                                className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100 active:scale-95"
                                            >
                                                Issue Rx
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Droplets size={16} className="text-red-500" />
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Blood Group</p>
                                                <p className="text-sm font-bold text-slate-700">{patient.bloodGroup || 'Not Provided'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle size={16} className="text-amber-500" />
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Allergies</p>
                                                <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{patient.allergies || 'None Reported'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )})
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-8 text-xl tracking-tight border-b border-slate-50 pb-4">Clinical Overview</h3>
                            <div className="space-y-6">
                                <div className="bg-slate-900 p-8 rounded-[2rem] text-center shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
                                        <ClipboardList size={60} />
                                    </div>
                                    <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-2">Queue Workload</p>
                                    <p className="text-6xl font-black text-white">{appointments.length}</p>
                                    <p className="text-xs text-blue-400 font-bold mt-4">Assigned Consultations</p>
                                </div>
                                
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => navigate('/doctor-settings')}
                                        className="w-full py-4 bg-white text-slate-800 border-2 border-slate-100 rounded-2xl font-bold text-sm hover:border-blue-200 transition"
                                    >
                                        Clinical Profile & Fees
                                    </button>
                                    <button 
                                        onClick={() => navigate('/availability')}
                                        className="w-full py-4 bg-white text-slate-800 border-2 border-slate-100 rounded-2xl font-bold text-sm hover:border-blue-200 transition"
                                    >
                                        Session Availability
                                    </button>
                                    <button 
                                        onClick={() => navigate('/')}
                                        className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition"
                                    >
                                        Switch to Portal View
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                             <div className="relative z-10">
                                <h4 className="font-bold text-lg mb-3">Clinical Compliance</h4>
                                <p className="text-blue-100 text-xs leading-relaxed font-medium">Securely generating digital prescriptions and managing patient records under Distributed Healthcare Standards.</p>
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