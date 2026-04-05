/**
 * Prescription Issuing Form
 * Collects diagnosis and medicine details to generate a PDF via Doctor Service.
 * Member 2 Logic: Calling the /prescriptions API.
 */
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Send, CheckCircle } from 'lucide-react';

const PrescriptionForm = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const appointmentId = searchParams.get("aptId");
    const patientId = searchParams.get("patientId");

    const [diagnosis, setDiagnosis] = useState('');
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '' }]);
    const [loading, setLoading] = useState(false);
    const [successUrl, setSuccessUrl] = useState('');

    const addMedicineRow = () => {
        setMedicines([...medicines, { name: '', dosage: '', frequency: '' }]);
    };

    const handlePrescription = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                appointmentId,
                doctorId: "DOC-01",
                patientId,
                patientName: "Simulation Patient", // Normally fetched
                diagnosis,
                medicines
            };

            // Call Member 2 Backend (Port 5003) to generate PDF
            const response = await axios.post('http://localhost:5003/api/doctors/prescriptions', payload);
            setSuccessUrl(response.data.pdfUrl);
        } catch (err) {
            console.error("Failed to issue prescription", err);
        }
        setLoading(false);
    };

    if (successUrl) return (
        <div className="h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-green-100">
                <CheckCircle className="text-green-500 mx-auto mb-4" size={60} />
                <h2 className="text-2xl font-bold text-slate-800">Prescription Issued!</h2>
                <p className="text-slate-500 mt-2 mb-8">The digital PDF has been generated and sent to the patient.</p>
                <a href={successUrl} target="_blank" rel="noreferrer" className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold mb-4">View PDF</a>
                <button onClick={() => navigate('/doctor-dashboard')} className="text-slate-500 font-bold hover:text-slate-800 transition">Back to Dashboard</button>
            </div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h2 className="text-3xl font-black text-slate-900 mb-8 underline decoration-blue-500 decoration-4">Issue Digital Prescription</h2>
            
            <form onSubmit={handlePrescription} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="mb-6">
                    <label className="block text-slate-700 font-bold mb-2 uppercase text-xs tracking-wider">Medical Diagnosis</label>
                    <textarea 
                        className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-blue-400 outline-none" 
                        rows="3" 
                        placeholder="Describe the condition..."
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-4 mb-8">
                    <label className="block text-slate-700 font-bold uppercase text-xs tracking-wider">Medicines & Dosage</label>
                    {medicines.map((med, index) => (
                        <div key={index} className="grid grid-cols-3 gap-3">
                            <input 
                                className="border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-400" 
                                placeholder="Medicine Name"
                                onChange={(e) => {
                                    const newMeds = [...medicines];
                                    newMeds[index].name = e.target.value;
                                    setMedicines(newMeds);
                                }}
                            />
                            <input 
                                className="border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-400" 
                                placeholder="Dosage (mg)"
                                onChange={(e) => {
                                    const newMeds = [...medicines];
                                    newMeds[index].dosage = e.target.value;
                                    setMedicines(newMeds);
                                }}
                            />
                            <input 
                                className="border-2 border-slate-100 rounded-xl p-3 text-sm focus:border-blue-400" 
                                placeholder="Freq (1-0-1)"
                                onChange={(e) => {
                                    const newMeds = [...medicines];
                                    newMeds[index].frequency = e.target.value;
                                    setMedicines(newMeds);
                                }}
                            />
                        </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={addMedicineRow}
                        className="flex items-center gap-1 text-blue-600 font-bold text-sm hover:underline"
                    >
                        <Plus size={16}/> Add another medicine
                    </button>
                </div>

                <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition"
                >
                    {loading ? "Generating Medical PDF..." : <><Send size={18}/> Generate & Finish Consultation</>}
                </button>
            </form>
        </div>
    );
};

export default PrescriptionForm;