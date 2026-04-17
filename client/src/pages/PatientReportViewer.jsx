/**
 * Patient Report Viewer Component
 * Purpose: Allows doctors to view medical reports uploaded by a specific patient.
 * Member 2 Responsibility: Patient Reports Viewer for clinical consultation.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPatientReportsById } from '../services/api';
import { FileText, Download, ArrowLeft, User, Calendar, Shield } from 'lucide-react';

const PatientReportViewer = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadReports = async () => {
            try {
                const response = await fetchPatientReportsById(patientId);
                setReports(response.data || []);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load patient reports:", err);
                setError("Could not retrieve medical records for this patient.");
                setLoading(false);
            }
        };

        if (patientId) loadReports();
    }, [patientId]);

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                
                <button 
                    onClick={() => navigate('/doctor-dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition mb-8 font-black text-xs uppercase tracking-widest"
                >
                    <ArrowLeft size={16} /> Return to Clinical Hub
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="bg-slate-900 p-8 md:p-12 text-white">
                        <div className="flex items-center gap-3 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                            <Shield size={14}/> Secure Medical Archive
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">Patient Medical Records</h2>
                        <p className="text-slate-400 font-medium">Reviewing history for Patient ID: <span className="text-white font-bold">{patientId}</span></p>
                    </div>

                    <div className="p-8 md:p-12">
                        {error ? (
                            <div className="text-center py-12">
                                <p className="text-red-500 font-bold">{error}</p>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500 font-bold">No medical reports found for this patient.</p>
                                <p className="text-slate-400 text-sm mt-1">The patient has not uploaded any diagnostic files yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {reports.map((report) => (
                                    <div key={report._id} className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-500 hover:shadow-xl transition-all duration-500 flex flex-col justify-between">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1 truncate max-w-[180px]">
                                                    {report.fileName || "Medical Report"}
                                                </h4>
                                                <p className="text-slate-400 text-xs font-bold flex items-center gap-1">
                                                    <Calendar size={12} /> {new Date(report.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <a 
                                            href={report.fileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition shadow-lg active:scale-95"
                                        >
                                            <Download size={14} /> Open Document
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex items-center gap-4 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <User size={20} />
                    </div>
                    <p className="text-blue-800 text-xs font-medium leading-relaxed">
                        <strong>Clinical Note:</strong> These records are shared securely between the patient and your medical account. Please ensure patient confidentiality while reviewing these documents.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PatientReportViewer;