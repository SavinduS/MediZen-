/**
 * My Prescriptions Component
 * Purpose: Allows patients to view and download prescriptions issued by doctors.
 * Member 2 Responsibility: Patient consultation record management.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from "@clerk/clerk-react";
import { FileText, Download, Clock, User, ShieldCheck } from 'lucide-react';
import { fetchPatientPrescriptions } from "../services/api";

const MyPrescriptions = () => {
    const { user } = useUser();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await fetchPatientPrescriptions(user.id);
            setPrescriptions(response.data);
        } catch (error) {
            console.error("Failed to fetch prescriptions:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <header className="mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Prescriptions</h2>
                <p className="text-slate-500 font-medium">Access your digital medical records and prescribed medications.</p>
            </header>

            {prescriptions.length === 0 ? (
                <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                    <FileText size={64} className="mx-auto text-slate-200 mb-6" />
                    <p className="text-slate-500 font-bold text-xl">No prescriptions found.</p>
                    <p className="text-slate-400 mt-2">Your digital prescriptions will appear here after your consultations.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {prescriptions.map((px) => (
                        <div key={px._id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-500 flex flex-col group">
                            <div className="flex items-start justify-between mb-8">
                                <div className="bg-blue-50 p-5 rounded-3xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                    <FileText size={32} />
                                </div>
                                <div className="text-right">
                                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block mb-1">Appointment ID</span>
                                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">{px.appointmentId}</span>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2 uppercase">{px.diagnosis}</h3>
                                <div className="flex items-center gap-6">
                                    <p className="text-slate-500 text-xs font-bold flex items-center gap-1.5">
                                        <Clock size={14} className="text-blue-500" /> {new Date(px.issuedAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-slate-500 text-xs font-bold flex items-center gap-1.5">
                                        <User size={14} className="text-blue-500" /> Issued to {user?.fullName || user?.firstName || px.patientName}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 flex-grow">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Medication List</p>
                                <ul className="space-y-3">
                                    {px.medicines.map((m, i) => (
                                        <li key={i} className="flex items-center justify-between text-sm font-bold text-slate-700">
                                            <span>{m.name}</span>
                                            <span className="text-blue-600 text-[10px] bg-blue-50 px-2 py-1 rounded-md">{m.dosage}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <a 
                                href={`http://localhost:5003/prescriptions/prescription-${px.appointmentId}.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition shadow-lg active:scale-95"
                            >
                                <Download size={18} /> Download PDF Prescription
                            </a>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-12 bg-blue-600 p-8 rounded-[2.5rem] text-white flex items-center gap-6 shadow-2xl shadow-blue-200">
                <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                    <ShieldCheck size={32} />
                </div>
                <div>
                    <h4 className="text-xl font-bold mb-1">Authentic Medical Records</h4>
                    <p className="text-blue-100 text-sm font-medium">These documents are legally valid digital prescriptions generated by MediZen certified medical officers.</p>
                </div>
            </div>
        </div>
    );
};

export default MyPrescriptions;