import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { 
  Users, Search, Plus, Eye, Edit3, Trash2, XCircle, 
  CheckCircle2, X, Loader2, AlertCircle, Save, Info,
  Award, Clock, DollarSign, Mail, Fingerprint, Calendar, ShieldCheck, MapPin
} from "lucide-react";
import { 
  fetchAdminDoctors, updateDoctor, deleteDoctor, addDoctor, fetchDoctorAvailability 
} from "../../services/api";
import toast, { Toaster } from 'react-hot-toast';

const badgeClasses = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function AdminDoctors() {
  const { getToken } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "", email: "", specialization: "", qualifications: "", 
    experience: "", fee: "", bio: ""
  });

  const getDoctorsList = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetchAdminDoctors({ search: searchTerm }, token);
      // Correcting the data parsing to match backend structure
      if (response.data && response.data.data && response.data.data.users) {
        setDoctors(response.data.data.users);
      } else {
        setDoctors([]);
      }
    } catch (err) {
      toast.error("Failed to fetch doctors list");
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(getDoctorsList, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const fetchAvailability = async (id) => {
    setLoadingAvailability(true);
    try {
      const token = await getToken();
      const response = await fetchDoctorAvailability(id, token);
      setAvailability(response.data || []);
    } catch (err) {
      console.error("Failed to fetch availability:", err);
      setAvailability([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleOpenView = (doctor) => {
    setSelectedDoctor(doctor);
    setShowViewModal(true);
    fetchAvailability(doctor._id);
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", specialization: "", qualifications: "", experience: "", fee: "", bio: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await addDoctor(formData, token);
      toast.success("Doctor registered successfully!");
      setShowAddModal(false);
      resetForm();
      getDoctorsList();
    } catch (err) {
      toast.error("Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await updateDoctor(selectedDoctor._id, formData, token);
      toast.success("Profile updated successfully!");
      setShowEditModal(false);
      getDoctorsList();
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (doctor) => {
    try {
      const token = await getToken();
      const newStatus = !doctor.verified;
      await updateDoctor(doctor._id, { verified: newStatus }, token);
      toast.success(`Doctor ${newStatus ? 'Activated' : 'Suspended'}`);
      getDoctorsList();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this doctor profile permanently?")) return;
    try {
      const token = await getToken();
      await deleteDoctor(id, token);
      toast.success("Doctor removed");
      getDoctorsList();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const openEdit = (doc) => {
    setSelectedDoctor(doc);
    setFormData({
      name: doc.name, email: doc.email, specialization: doc.specialization,
      qualifications: Array.isArray(doc.qualifications) ? doc.qualifications.join(', ') : doc.qualifications || "", 
      experience: doc.experience || "",
      fee: doc.fee || "", bio: doc.bio || ""
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-2">
      <Toaster position="top-right" />
      
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            Doctor Management
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage and monitor all medical professionals in the system.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Search by name or email..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm shadow-sm"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 shadow-lg active:scale-95 shrink-0"
          >
            <Plus size={18} /> Add Doctor
          </button>
        </div>
      </div>

      {/* List Section */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
           <div className="py-32 flex flex-col items-center justify-center gap-4">
             <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Records...</p>
           </div>
        ) : doctors.length > 0 ? (
          doctors.map((doctor) => (
            <div key={doctor._id} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-blue-200 group">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300 text-2xl font-bold">
                    {doctor.name.charAt(0)}
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{doctor.name}</h3>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${doctor.verified ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                        {doctor.verified ? "active" : "pending"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mt-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Information</p>
                        <p className="text-sm font-bold text-blue-600 uppercase">{doctor.specialization}</p>
                        <p className="text-xs text-slate-500 font-medium">{doctor.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                        <p className={`text-sm font-bold uppercase ${!doctor.verified ? 'text-amber-500' : 'text-emerald-600'}`}>
                            {doctor.verified ? 'Verified Member' : 'Pending Review'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row lg:flex-col gap-2 shrink-0 pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenView(doctor)} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition" title="View"><Eye size={18} /></button>
                    <button onClick={() => openEdit(doctor)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition" title="Edit"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(doctor._id)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-red-600 transition" title="Delete"><Trash2 size={18} /></button>
                  </div>
                  <button 
                    onClick={() => handleStatusUpdate(doctor)}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-bold transition active:scale-95 ${
                        doctor.verified
                        ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {doctor.verified ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                    {doctor.verified ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50 text-slate-400 font-bold">No Doctors Found</div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* VIEW DOCTOR PROFILE MODAL */}
      {showViewModal && selectedDoctor && (
        <Modal title="Doctor Full Profile" onClose={() => setShowViewModal(false)}>
          <div className="space-y-8">
            {/* Elegant Modern Header */}
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-blue-900/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="w-28 h-28 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-4xl font-black text-blue-600 shadow-lg shadow-blue-900/10">
                  {selectedDoctor.name.charAt(0)}
                </div>
                <div className="text-center md:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedDoctor.name}</h2>
                    {selectedDoctor.verified ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <ShieldCheck size={14} /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                        <AlertCircle size={14} /> Pending
                      </span>
                    )}
                  </div>
                  <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mt-2">{selectedDoctor.specialization}</p>
                  
                  {/* Qualifications */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                    {(Array.isArray(selectedDoctor.qualifications) ? selectedDoctor.qualifications : selectedDoctor.qualifications?.split(',') || []).map((q, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {q.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ProfileStat icon={Award} label="Experience" value={`${selectedDoctor.experience || 0} Years`} color="text-amber-500" />
              <ProfileStat icon={DollarSign} label="Consultation" value={`LKR ${selectedDoctor.fee}`} color="text-emerald-500" />
              <ProfileStat icon={Calendar} label="Member Since" value={new Date(selectedDoctor.createdAt).toLocaleDateString()} color="text-blue-500" />
              <ProfileStat icon={Fingerprint} label="System ID" value={selectedDoctor.doctorId} color="text-purple-500" />
            </div>

            {/* Weekly Consultation Schedule */}
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" /> Weekly Consultation Schedule
                </h4>
              </div>
              
              {loadingAvailability ? (
                <div className="flex items-center gap-3 py-4 text-slate-400">
                  <Loader2 className="animate-spin" size={18} />
                  <p className="text-xs font-bold uppercase tracking-widest">Fetching schedule...</p>
                </div>
              ) : availability.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availability.map((slot, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-bold text-slate-700">{slot.dayOfWeek}</span>
                      </div>
                      <span className="text-xs font-black text-blue-600 bg-white px-3 py-1 rounded-full border border-blue-50 shadow-sm">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 px-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                  <Clock className="text-slate-300" size={24} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No slots available</p>
                </div>
              )}
            </div>

            {/* Detailed Info Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Mail size={14} className="text-blue-500" /> Contact Details
                </h4>
                <div className="space-y-3">
                   <p className="text-sm font-bold text-slate-700 flex justify-between">Email: <span className="font-medium text-slate-500">{selectedDoctor.email}</span></p>
                   <p className="text-sm font-bold text-slate-700 flex justify-between">User UID: <span className="font-medium text-slate-500 truncate max-w-[150px]">{selectedDoctor.userId}</span></p>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin size={14} className="text-blue-500" /> Hospital / Location
                </h4>
                <p className="text-sm font-medium text-slate-500 italic">MediZen General Hospital - Colombo Branch</p>
              </div>
            </div>

            {/* Biography */}
            <div className="p-8 bg-blue-50/20 rounded-[2.5rem] border border-blue-100/50">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4">Professional Biography</h4>
              <p className="text-slate-600 text-sm leading-relaxed font-medium italic">
                "{selectedDoctor.bio || 'No professional biography has been provided for this medical profile.'}"
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD / EDIT DOCTOR MODAL */}
      {(showAddModal || showEditModal) && (
        <Modal title={showAddModal ? "Register New Doctor" : "Update Doctor Profile"} onClose={() => {setShowAddModal(false); setShowEditModal(false)}}>
          <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Name *" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Dr. John Smith" />
              <Input label="Email *" name="email" type="email" value={formData.email} onChange={handleInputChange} required placeholder="john@medizen.com" />
              <Input label="Specialization *" name="specialization" value={formData.specialization} onChange={handleInputChange} required placeholder="e.g. Neurology" />
              <Input label="Qualifications *" name="qualifications" value={formData.qualifications} onChange={handleInputChange} required placeholder="MBBS, MD (Comma separated)" />
              <Input label="Experience (Yrs)" name="experience" type="number" value={formData.experience} onChange={handleInputChange} placeholder="10" />
              <Input label="Fee (LKR)" name="fee" type="number" value={formData.fee} onChange={handleInputChange} placeholder="3000" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Professional Bio</label>
              <textarea 
                className="w-full p-4 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-500 min-h-[120px] transition-all bg-slate-50/20" 
                placeholder="Briefly describe the doctor's background..." 
                name="bio"
                value={formData.bio} 
                onChange={handleInputChange}
              />
            </div>
            <button disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-xl shadow-blue-900/10 active:scale-95 disabled:bg-slate-300">
              {isSubmitting ? <Loader2 className="animate-spin" size={20}/> : <><Save size={20}/> {showAddModal ? "Register Doctor" : "Update Profile"}</>}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

// Custom internal components
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
    <div className="bg-white rounded-[3.5rem] w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-500">
      <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
        <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-full transition active:scale-90"><X size={24}/></button>
      </div>
      <div className="p-10 max-h-[80vh] overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  </div>
);

const ProfileStat = ({ icon: Icon, label, value, color }) => (
  <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
    <div className={`p-2 w-fit rounded-xl bg-slate-50 ${color} mb-3`}>
      <Icon size={18} />
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-slate-800 mt-1">{value || 'N/A'}</p>
  </div>
);

const Input = ({ label, name, value, onChange, type="text", required=false, placeholder }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{label}</label>
    <input 
      type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-medium transition-all" 
    />
  </div>
);