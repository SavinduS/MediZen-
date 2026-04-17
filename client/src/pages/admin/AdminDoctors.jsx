import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from "@clerk/clerk-react";
import AdminTable from "../../components/AdminTable";
import { 
  Users, Search, Shield, User, Calendar, 
  Mail, Download, ChevronRight, X, UserCheck, ShieldAlert,
  Stethoscope, Award, DollarSign, Filter, Loader2, CheckCircle2, XCircle,
  Plus, Pencil, Trash2, Save
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { fetchAdminDoctors, addDoctor, updateDoctor, deleteDoctor } from "../../services/api";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("ALL");
  const { getToken } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    _id: null,
    name: "",
    email: "",
    password: "",
    specialization: "General",
    qualifications: "",
    fee: "",
    bio: ""
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetchAdminDoctors({}, token);
      const data = res.data.data?.users || res.data.data || [];
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDoctors(sorted);
    } catch (err) {
      setError("Doctor service unreachable.");
      console.error("Fetch Doctors Error:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter(d => {
      const matchesSearch = (d.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpec = filterSpecialty === "ALL" || (d.specialization || "").toUpperCase() === filterSpecialty.toUpperCase();
      return matchesSearch && matchesSpec;
    });
  }, [doctors, searchTerm, filterSpecialty]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ _id: null, name: "", email: "", password: "", specialization: "General", qualifications: "", fee: "", bio: "" });
    setShowModal(true);
  };

  const handleOpenEdit = (doctor) => {
    setIsEditing(true);
    setFormData({
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email || "",
      password: "",
      specialization: doctor.specialization || "General",
      qualifications: Array.isArray(doctor.qualifications) ? doctor.qualifications.join(", ") : doctor.qualifications,
      fee: doctor.fee,
      bio: doctor.bio || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;
    try {
      const token = await getToken();
      await deleteDoctor(id, token);
      toast.success("Doctor deleted successfully");
      fetchData();
    } catch (err) {
      toast.error("Deletion failed");
      console.error("Delete Doctor Error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getToken();
      if (isEditing) {
        await updateDoctor(formData._id, formData, token);
        toast.success("Doctor updated successfully");
      } else {
        // Only send email and password if present
        const payload = { ...formData };
        if (!payload.email) delete payload.email;
        if (!payload.password) delete payload.password;
        await addDoctor(payload, token);
        toast.success("Doctor added successfully");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(isEditing ? "Update failed" : "Addition failed");
      console.error("Doctor Submit Error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { 
      header: "Doctor Name", 
      render: (d) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs border border-blue-100">
            {d.name?.charAt(0) || 'D'}
          </div>
          <div className="text-sm font-black text-slate-900">{d.name}</div>
        </div>
      )
    },
    { 
      header: "Specialization", 
      render: (d) => (
        <span className="px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-100">
          {d.specialization || 'General'}
        </span>
      )
    },
    { 
      header: "Fee (LKR)", 
      render: (d) => <span className="text-sm font-black text-blue-600 tracking-tight">{Number(d.fee || 0).toLocaleString()}</span>
    },
    { 
      header: "Status", 
      render: (d) => (
        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
          d.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {d.verified ? 'Verified' : 'Pending'}
        </span>
      )
    },
    {
      header: "Actions",
      align: "right",
      render: (d) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => handleOpenEdit(d)}
            className="p-2 rounded-xl bg-slate-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-100"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => handleDelete(d._id)}
            className="p-2 rounded-xl bg-slate-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm border border-slate-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const specialties = ["ALL", "CARDIOLOGY", "NEUROLOGY", "PEDIATRICS", "GENERAL"];

  return (
    <div className="flex flex-col gap-6 p-8 h-full bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden font-sans relative">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#1e293b] flex items-center gap-3 tracking-tight uppercase">
            <Stethoscope className="text-blue-600" size={32} /> Doctor Registry
          </h1>
          <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-[0.2em]">Full CRUD Administration</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-6 py-3 bg-[#2563eb] text-white text-xs font-black rounded-2xl shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest"
        >
          <Plus size={18} /> Add New Doctor
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="Search doctors by name..."
            className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[1.2rem] border border-slate-100 shadow-inner">
          {specialties.map(spec => (
            <button
              key={spec}
              onClick={() => setFilterSpecialty(spec)}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterSpecialty === spec ? 'bg-[#2563eb] text-white shadow-md' : 'bg-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AdminTable 
          columns={columns} 
          data={filteredDoctors} 
          loading={loading} 
          error={error} 
          onRetry={fetchData} 
          emptyMessage="No Registered Doctors Found"
        />
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#2563eb] text-white rounded-2xl shadow-lg">
                  {isEditing ? <Pencil size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1e293b] uppercase">{isEditing ? "Edit Doctor" : "Add Doctor"}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Profile Details</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Doctor Name</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="e.g. Dr. Sanath Gunawardena"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Email</label>
                  <input
                    type="email" value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="doctor@email.com"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Password</label>
                  <input
                    type="password" value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Specialization</label>
                  <select 
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Dermatology">Dermatology</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Consultation Fee (LKR)</label>
                  <input 
                    type="number" required value={formData.fee}
                    onChange={(e) => setFormData({...formData, fee: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="3000"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Qualifications</label>
                <input 
                  type="text" required value={formData.qualifications}
                  onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="e.g. MBBS, MD, MRCP"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Professional Bio</label>
                <textarea 
                  rows="3" value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                  placeholder="Brief description of experience..."
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" disabled={submitting}
                  className="w-full py-4 bg-[#1e293b] text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> {isEditing ? "Update Profile" : "Register Doctor"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
