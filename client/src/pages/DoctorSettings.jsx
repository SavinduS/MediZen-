/**
 * Doctor Settings Component
 * Purpose: Allows medical professionals to update or delete their profile.
 * Member 2 Responsibility: Doctor Profile Enhancement.
 */

import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from "@clerk/clerk-react";
import { fetchDoctorProfileByUserId, updateDoctorProfile, deleteDoctorProfile } from '../services/api';
import { User, DollarSign, BookOpen, CheckCircle, Save, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorSettings = () => {
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        specialization: '',
        fee: 0,
        bio: '',
        verified: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return;
            try {
                const response = await fetchDoctorProfileByUserId(user.id);
                const data = response.data;
                setProfile({
                    specialization: data.specialization || '',
                    fee: data.fee || 0,
                    bio: data.bio || '',
                    verified: data.verified || false,
                    _id: data._id 
                });
                setLoading(false);
            } catch (error) {
                console.error("Failed to load doctor profile:", error);
                setMessage({ type: 'error', text: 'Failed to load profile settings.' });
                setLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await updateDoctorProfile(profile._id, {
                specialization: profile.specialization,
                fee: profile.fee,
                bio: profile.bio,
                verified: profile.verified
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error("Failed to update profile:", error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProfile = async () => {
        setDeleting(true);
        try {
            await deleteDoctorProfile(profile._id);
            // After deleting the doctor record, log them out or redirect
            await signOut();
            navigate('/');
        } catch (error) {
            console.error("Failed to delete profile:", error);
            setMessage({ type: 'error', text: 'Failed to delete profile. Please contact support.' });
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            <div className="max-w-3xl mx-auto pb-20">
                
                <button 
                    onClick={() => navigate('/doctor-dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition mb-6 font-bold text-sm uppercase tracking-widest"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mb-10">
                    <div className="bg-slate-900 p-8 md:p-12 text-white">
                        <h2 className="text-3xl font-black tracking-tight mb-2">Profile Settings</h2>
                        <p className="text-slate-400 font-medium">Manage your professional information and consultation fees.</p>
                    </div>

                    <form onSubmit={handleUpdate} className="p-8 md:p-12 space-y-8">
                        {message.text && (
                            <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                <p className="font-bold text-sm">{message.text}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <BookOpen size={14} className="text-blue-500" /> Specialization
                                </label>
                                <input 
                                    type="text"
                                    value={profile.specialization}
                                    onChange={(e) => setProfile({...profile, specialization: e.target.value})}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition outline-none font-medium text-slate-700"
                                    placeholder="e.g. Cardiologist"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <DollarSign size={14} className="text-blue-500" /> Consultation Fee ($)
                                </label>
                                <input 
                                    type="number"
                                    value={profile.fee}
                                    onChange={(e) => setProfile({...profile, fee: e.target.value})}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition outline-none font-medium text-slate-700"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                <User size={14} className="text-blue-500" /> Professional Bio
                            </label>
                            <textarea 
                                value={profile.bio}
                                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                                rows="4"
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition outline-none font-medium text-slate-700"
                                placeholder="Describe your experience and approach..."
                            ></textarea>
                        </div>

                        <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div className={`p-3 rounded-full ${profile.verified ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">Verification Status</p>
                                <p className="text-xs text-slate-500 font-medium">
                                    {profile.verified ? 'Your profile is verified and visible to patients.' : 'Your profile is pending verification by the admin.'}
                                </p>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={saving}
                            className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {saving ? 'Updating...' : <><Save size={18} /> Save Profile Changes</>}
                        </button>
                    </form>
                </div>

                {/* DANGER ZONE: DELETE PROFILE */}
                <div className="bg-red-50 rounded-[2.5rem] border border-red-100 p-8 md:p-12">
                    <div className="flex items-center gap-3 text-red-600 mb-4">
                        <Trash2 size={24} />
                        <h3 className="text-xl font-black uppercase tracking-tight">Danger Zone</h3>
                    </div>
                    <p className="text-red-700 font-medium text-sm mb-8 leading-relaxed">
                        Deleting your profile will permanently remove your consultation records and availability from the MediZen platform. This action cannot be undone.
                    </p>

                    {!showDeleteConfirm ? (
                        <button 
                            onClick={() => setShowDeleteConfirm(true)}
                            className="bg-white text-red-600 border-2 border-red-200 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition duration-300"
                        >
                            Delete Doctor Profile
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-red-800 font-black text-sm uppercase">Are you absolutely sure?</p>
                            <div className="flex flex-wrap gap-3">
                                <button 
                                    onClick={handleDeleteProfile}
                                    disabled={deleting}
                                    className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                                </button>
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="bg-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorSettings;