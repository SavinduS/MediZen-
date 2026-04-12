import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Users, Search, MoreVertical, Loader2, AlertCircle } from "lucide-react";
import { fetchAdminUsers, updateAdminUserStatus } from "../../services/api";

const badgeClasses = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
  patient: "bg-cyan-100 text-cyan-700 border-cyan-200",
  doctor: "bg-violet-100 text-violet-700 border-violet-200",
  admin: "bg-slate-200 text-slate-700 border-slate-300",
};

const StatusBadge = ({ label }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClasses[label] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
    {label}
  </span>
);

export default function AdminUsers() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userFilter, setUserFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const getUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const res = await fetchAdminUsers({ role: userFilter, search: searchTerm }, token);
      const data = res.data.data?.users || res.data.users || [];
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
      if (!err.response) {
        setError("Admin Service unreachable. Check port 5009.");
      } else {
        setError(err.response?.status === 404 ? "Users endpoint not found (404). Please check service port 5009." : "Failed to load user list.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      getUsers();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [userFilter, searchTerm]);

  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      setUpdatingId(id);
      const token = await getToken();
      await updateAdminUserStatus(id, newStatus, token);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            User Management
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Oversee accounts and roles for all system participants.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative group flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm shadow-sm"
          />
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit shrink-0">
          {["all", "patient", "doctor", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setUserFilter(r)}
              className={`rounded-xl px-5 py-2 text-xs font-bold transition uppercase tracking-tighter ${
                userFilter === r ? "bg-blue-600 text-white shadow-lg shadow-blue-900/10" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[32px] bg-white shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm font-bold">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                <th className="px-8 py-5">Member Details</th>
                <th className="px-6 py-5">Role</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Joined Date</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                    <td colSpan="5" className="py-32 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Syncing with Registry...</span>
                        </div>
                    </td>
                </tr>
              ) : error ? (
                <tr>
                    <td colSpan="5" className="py-32 text-center text-red-500">
                        <div className="flex flex-col items-center gap-2">
                            <AlertCircle size={32} />
                            <p className="font-bold">{error}</p>
                            <button onClick={getUsers} className="mt-4 text-blue-600 underline text-xs font-bold uppercase tracking-widest hover:text-blue-700 transition-colors">Retry Connection</button>
                        </div>
                    </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 text-xs uppercase font-bold">
                              {user.name?.slice(0,2) || '??'}
                          </div>
                          <div>
                              <p className="text-slate-900 leading-tight">{user.name}</p>
                              <p className="text-[10px] text-slate-400 font-normal uppercase mt-1">{user.email}</p>
                          </div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><StatusBadge label={user.role} /></td>
                    <td className="px-6 py-5"><StatusBadge label={user.status || 'active'} /></td>
                    <td className="px-6 py-5 text-slate-400 text-[10px] font-bold uppercase">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => handleStatusUpdate(user._id, user.status)}
                        disabled={updatingId === user._id}
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${
                            user.status === 'suspended' 
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" 
                            : "bg-red-50 text-red-600 hover:bg-red-100"
                        } opacity-0 group-hover:opacity-100 disabled:opacity-50 shadow-sm border border-transparent hover:border-current`}
                      >
                        {updatingId === user._id ? "..." : user.status === 'suspended' ? "Activate" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan="5" className="py-32 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                            <Users size={48} />
                            <p className="font-bold uppercase text-[10px] tracking-widest">No matching users found</p>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
