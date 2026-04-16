/**
 * Availability Manager Component
 * Purpose: Allows doctors to set their weekly consultation hours.
 * Member 2 Responsibility: Availability Logic & Scheduling Engine.
 */

import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/clerk-react";
import { fetchDoctorProfileByUserId, getDoctorAvailability, updateDoctorAvailability } from '../services/api';
import { Calendar, Clock, Plus, Trash2, Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AvailabilityManager = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const [doctorId, setDoctorId] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const loadAvailability = async () => {
            if (!user) return;
            try {
                // 1. Get internal doctor ID
                const profileRes = await fetchDoctorProfileByUserId(user.id);
                const docId = profileRes.data._id;
                setDoctorId(docId);

                // 2. Load existing slots
                const availRes = await getDoctorAvailability(docId);
                setSlots(availRes.data || []);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load availability:", error);
                setMessage({ type: 'error', text: 'Failed to load availability data.' });
                setLoading(false);
            }
        };

        loadAvailability();
    }, [user]);

    const handleAddSlot = (day) => {
        const newSlot = {
            dayOfWeek: day,
            startTime: '09:00',
            endTime: '17:00'
        };
        setSlots([...slots, newSlot]);
    };

    const handleRemoveSlot = (index) => {
        const updatedSlots = slots.filter((_, i) => i !== index);
        setSlots(updatedSlots);
    };

    const handleUpdateSlot = (index, field, value) => {
        const updatedSlots = [...slots];
        updatedSlots[index][field] = value;
        setSlots(updatedSlots);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await updateDoctorAvailability(doctorId, slots);
            setMessage({ type: 'success', text: 'Weekly availability updated successfully!' });
        } catch (error) {
            console.error("Failed to save availability:", error);
            setMessage({ type: 'error', text: 'Failed to save changes. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto pb-20">
                
                <button 
                    onClick={() => navigate('/doctor-dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition mb-6 font-bold text-sm uppercase tracking-widest"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mb-10">
                    <div className="bg-slate-900 p-8 md:p-12 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight mb-2">Availability Manager</h2>
                            <p className="text-slate-400 font-medium">Define your weekly consultation hours for patient booking.</p>
                        </div>
                        <div className="hidden md:block">
                            <Calendar size={48} className="text-blue-500 opacity-50" />
                        </div>
                    </div>

                    <div className="p-8 md:p-12">
                        {message.text && (
                            <div className={`p-4 rounded-2xl flex items-center gap-3 mb-8 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <p className="font-bold text-sm">{message.text}</p>
                            </div>
                        )}

                        <div className="space-y-12">
                            {DAYS.map(day => (
                                <div key={day} className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            {day}
                                        </h3>
                                        <button 
                                            onClick={() => handleAddSlot(day)}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition flex items-center gap-1 text-xs font-bold"
                                        >
                                            <Plus size={14} /> Add Slot
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {slots.filter(s => s.dayOfWeek === day).length === 0 ? (
                                            <p className="text-slate-400 text-xs italic py-2">No slots defined for {day}.</p>
                                        ) : (
                                            slots.map((slot, index) => {
                                                if (slot.dayOfWeek !== day) return null;
                                                return (
                                                    <div key={index} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group transition hover:border-blue-200">
                                                        <Clock size={16} className="text-slate-400" />
                                                        <div className="flex items-center gap-2 flex-grow">
                                                            <input 
                                                                type="time" 
                                                                value={slot.startTime}
                                                                onChange={(e) => handleUpdateSlot(index, 'startTime', e.target.value)}
                                                                className="bg-transparent font-bold text-slate-700 outline-none"
                                                            />
                                                            <span className="text-slate-300">-</span>
                                                            <input 
                                                                type="time" 
                                                                value={slot.endTime}
                                                                onChange={(e) => handleUpdateSlot(index, 'endTime', e.target.value)}
                                                                className="bg-transparent font-bold text-slate-700 outline-none"
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveSlot(index)}
                                                            className="text-slate-300 hover:text-red-500 transition"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100">
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-blue-600 text-white p-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {saving ? 'Saving...' : <><Save size={18} /> Save Weekly Availability</>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 flex gap-4">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 h-fit">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900 mb-1">How it works</h4>
                        <p className="text-blue-700 text-sm leading-relaxed">
                            These slots define when you are available for booking. Patients will see these hours on your profile and can book consultations accordingly. You can add multiple slots per day (e.g. morning and afternoon sessions).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvailabilityManager;