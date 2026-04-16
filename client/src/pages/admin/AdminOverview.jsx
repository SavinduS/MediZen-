import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCog, CalendarDays, Wallet, Loader2, FileText, Activity } from "lucide-react";
import axios from "axios";

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5009/api/admin/dashboard-stats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        setError("Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <span className="text-blue-600 font-bold tracking-wide">Authorizing and loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 p-6 font-sans bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Command Center</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Health System Intelligence</p>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Stats and Transactions (Spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Quick Summary Stats can go here */}
            
            {/* Your "Quick Actions" Card starts here */}
            <div className="rounded-2xl bg-blue-600 p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[220px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                        Quick Actions
                    </h2>
                    <p className="text-blue-100 mt-2 text-sm opacity-80 leading-relaxed font-medium max-w-md">
                        Perform common administrative tasks directly from the overview dashboard.
                    </p>
                    
                    <div className="flex gap-3 mt-6">
                        <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition hover:scale-105 active:scale-95 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Generate Report
                        </button>
                        <button className="bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-xs border border-blue-400/30 transition hover:bg-blue-400 active:scale-95 shadow-lg flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            System Audit
                        </button>
                    </div>
                </div>
            </div>
            {/* Quick Actions Card ends here */}
        </div>

        {/* Right Side: Activity Feed or Small Stats */}
        <div className="flex flex-col gap-8">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">System Health</h3>
                <div className="space-y-4 text-sm font-medium text-slate-500">
                    <p>Database: <span className="text-emerald-500 text-xs font-bold float-right uppercase">Online</span></p>
                    <p>API Gateway: <span className="text-emerald-500 text-xs font-bold float-right uppercase">Stable</span></p>
                    <p>Server Load: <span className="text-blue-500 text-xs font-bold float-right uppercase">Low</span></p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;