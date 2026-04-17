import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@clerk/clerk-react";
import AdminTable from "../../components/AdminTable";
import { Users, Search, Mail, Shield, User } from 'lucide-react';
import { fetchAdminUsers } from "../../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { getToken } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetchAdminUsers({}, token);
      const data = res.data.data?.users || res.data.data || [];
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setUsers(sorted);
    } catch (err) {
      setError("Auth service unreachable. Please ensure the Gateway and Auth services are running.");
      console.error("Fetch Users Error:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = users.filter(u => 
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { 
      header: "User Name", 
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <User size={20} />
          </div>
          <div className="text-sm font-black text-slate-900">{u.email?.split('@')[0] || 'Unknown'}</div>
        </div>
      )
    },
    { 
      header: "Email", 
      render: (u) => (
        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tighter">
          <Mail size={10} /> {u.email}
        </div>
      )
    },
    { 
      header: "Role", 
      render: (u) => (
        <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
          <Shield size={10} /> {u.role || 'patient'}
        </span>
      )
    },
    { 
      header: "Status", 
      align: "right",
      render: () => (
        <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest">
          Active
        </span>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-8 p-8 h-full bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#1e293b] flex items-center gap-3 tracking-tight uppercase">
            <Users className="text-blue-600" size={32} /> User Directory
          </h1>
          <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-[0.2em]">Platform Access Monitoring</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
        <input
          type="text"
          placeholder="Search users by email..."
          className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <AdminTable 
          columns={columns} 
          data={filteredUsers} 
          loading={loading} 
          error={error} 
          onRetry={fetchData} 
          emptyMessage="No Registered Users Found"
        />
      </div>
    </div>
  );
}
