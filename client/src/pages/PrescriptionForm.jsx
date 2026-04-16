/**
 * Prescription Issuing Component
 * Purpose: Collects clinical diagnosis and medication data to generate a dynamic PDF.
 * Member 2 Responsibility: Digital Prescription Engine & PDFKit Integration (Port 5003).
 * Integrated with Clerk Auth for secure doctor identification.
 */

import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from "@clerk/clerk-react"; // Hook for access identity
import axios from 'axios';
import { Plus, Send, CheckCircle, FileText, Trash2, ShieldCheck } from 'lucide-react';

const PrescriptionForm = () => {
    const { user } = useUser(); // Get logged-in Doctor's data from Clerk
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Extract clinical IDs from the URL context
    const appointmentId = searchParams.get("aptId");
    const patientId = searchParams.get("patientId");

    const [diagnosis, setDiagnosis] = useState('');
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '' }]);
    const [loading, setLoading] = useState(false);
    const [successUrl, setSuccessUrl] = useState('');

    /**
     * Add a new medicine row to the form
     */
    const addMedicineRow = () => {
        setMedicines([...medicines, { name: '', dosage: '', frequency: '' }]);
    };

    /**
     * Remove a medicine row
     */
    const removeMedicineRow = (index) => {
        const updatedMeds = medicines.filter((_, i) => i !== index);
        setMedicines(updatedMeds);
    };

    /**
     * Triggers the PDF generation process in the Doctor Management Service (Port 5003)
     */
    const handlePrescription = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const payload = {
                appointmentId,
                // Using the real email of the logged-in doctor from Clerk
                doctorId: user?.primaryEmailAddress?.emailAddress || "DOC-CORE",
                patientId,
                // Passing a readable name placeholder for the PDF
                patientName: `Verified Patient (${patientId})`, 
                diagnosis,
                medicines
            };

            // Calling the Member 2 PDF Generation API
            const response = await axios.post('http://localhost:5003/api/doctors/prescriptions', payload);
            
            // Set the absolute URL to the generated PDF hosted on the backend server
            setSuccessUrl(response.data.pdfUrl);
        } catch (err) {
            console.error("Clinical System Error: Failed to issue prescription", err);
        } finally {
            setLoading(false);
        }
    };

    // Success State View: Shown after the PDF is generated
    if (successUrl) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-green-100 transform animate-in zoom-in duration-500">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-600" size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Prescription Issued</h2>
                <p className="text-slate-500 mt-3 mb-8 font-medium">The digital medical record has been securely generated and synced with the cloud.</p>
                
                <div className="space-y-3">
                    <a 
                        href={successUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-100"
                    >
                        <FileText size={20}/> View & Download PDF
                    </a>
                    <button 
                        onClick={() => navigate('/doctor-dashboard')} 
                        className="w-full py-4 text-slate-400 font-bold hover:text-slate-700 transition"
                    >
                        Back to Clinical Dashboard
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12">
            <header className="mb-12">
                <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-3">
                    <ShieldCheck size={16}/> MediZen Regulatory Compliance
                </div>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Clinical <span className="text-blue-600">Prescription</span></h2>
                <p className="text-slate-400 mt-2 font-medium uppercase text-[10px]">Session Context: {appointmentId}</p>
            </header>
            
            <form onSubmit={handlePrescription} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-10">
                
                {/* Diagnosis Input Section */}
                <section>
                    <label className="flex items-center gap-2 text-slate-800 font-black mb-4 uppercase text-xs tracking-widest">
                        Clinical Diagnosis & Observations
                    </label>
                    <textarea 
                        className="w-full border-2 border-slate-50 rounded-3xl p-6 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all outline-none text-slate-700 font-medium" 
                        rows="4" 
                        placeholder="Detail the patient's condition, symptoms, and medical findings..."
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        required
                    />
                </section>

                {/* Medication List Section */}
                <section className="space-y-6">
                    <label className="text-slate-800 font-black uppercase text-xs tracking-widest block">Medication Regimen</label>
                    
                    <div className="space-y-3">
                        {medicines.map((med, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 animate-in fade-in slide-in-from-left-4">
                                <input 
                                    className="md:col-span-5 border-2 border-slate-50 rounded-2xl p-4 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none text-sm font-bold" 
                                    placeholder="Medicine Name (e.g. Amoxicillin)"
                                    required
                                    onChange={(e) => {
                                        const newMeds = [...medicines];
                                        newMeds[index].name = e.target.value;
                                        setMedicines(newMeds);
                                    }}
                                />
                                <input 
                                    className="md:col-span-3 border-2 border-slate-50 rounded-2xl p-4 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none text-sm font-bold" 
                                    placeholder="Dosage (500mg)"
                                    required
                                    onChange={(e) => {
                                        const newMeds = [...medicines];
                                        newMeds[index].dosage = e.target.value;
                                        setMedicines(newMeds);
                                    }}
                                />
                                <input 
                                    className="md:col-span-3 border-2 border-slate-50 rounded-2xl p-4 bg-slate-50 focus:bg-white focus:border-blue-400 outline-none text-sm font-bold" 
                                    placeholder="Freq (1-0-1)"
                                    required
                                    onChange={(e) => {
                                        const newMeds = [...medicines];
                                        newMeds[index].frequency = e.target.value;
                                        setMedicines(newMeds);
                                    }}
                                />
                                {medicines.length > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => removeMedicineRow(index)}
                                        className="md:col-span-1 flex items-center justify-center text-slate-300 hover:text-red-500 transition"
                                    >
                                        <Trash2 size={20}/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button 
                        type="button" 
                        onClick={addMedicineRow}
                        className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest hover:text-blue-800 transition py-2 px-4 bg-blue-50 rounded-xl"
                    >
                        <Plus size={16}/> Add New Medicine Row
                    </button>
                </section>

                {/* Final Action Button */}
                <div className="pt-4 border-t border-slate-50">
                    <button 
                        disabled={loading}
                        type="submit" 
                        className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-blue-600 transition shadow-2xl shadow-slate-200 active:scale-95 disabled:bg-slate-300"
                    >
                        {loading ? "Finalizing Medical PDF..." : <><Send size={18}/> Generate & Verify Rx</>}
                    </button>
                    <p className="text-center text-[9px] text-slate-400 mt-6 uppercase font-bold tracking-widest">
                        Digital Signature of Dr. {user?.fullName || "Kamal Perera"} will be appended.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default PrescriptionForm;