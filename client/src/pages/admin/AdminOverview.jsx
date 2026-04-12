import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { 
  Users, 
  UserCog, 
  CalendarDays, 
  CreditCard, 
  Wallet, 
  ShieldCheck,
  Activity,
  Loader2,
  AlertCircle
} from "lucide-react";
import { fetchAdminStats } from "../../services/api";

const StatCard = ({ title, value, change, icon: Icon, loading }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 transition hover:shadow-md hover:border-blue-200 group relative overflow-hidden">
    {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Loader2 className="w-5 h-8 text-blue-600 animate-spin" />
        </div>
    )}
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <h3 className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        <p className="mt-2 text-xs font-bold text-blue-600">{change}</p>
      </div>
      <div className="rounded-xl bg-slate-50 p-3 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

export default function AdminOverview() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      const res = await fetchAdminStats(token);
      setStats(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
      if (!err.response) {
        setError("Admin Service unreachable. Please ensure it is running on port 5009.");
      } else {
        setError(err.response?.status === 404 ? "Stats endpoint not found (404). Check port 5009." : "Failed to load stats.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStats();
  }, [getToken]);

  const statConfig = [
    { title: "Total Patients", value: stats?.totalPatients ?? "0", change: "+12.4%", icon: Users },
    { title: "Total Doctors", value: stats?.totalDoctors ?? "0", change: "+4.1%", icon: UserCog },
    { title: "Total Appointments", value: stats?.totalAppointments ?? "0", change: "+18.2%", icon: CalendarDays },
    { title: "Total Payments", value: stats?.totalPayments ?? "0", change: "+9.7%", icon: CreditCard },
    { title: "Revenue", value: `LKR ${stats?.totalRevenue ?? "0"}`, change: "+14.3%", icon: Wallet },
    { title: "Pending Verifications", value: stats?.pendingDoctors ?? "0", change: "Needs review", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 mt-2 font-medium">Real-time platform activity and growth metrics.</p>
        </div>
        {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-100 animate-bounce">
                <AlertCircle size={18} />
                <span className="text-xs font-bold uppercase">{error}</span>
                <button onClick={getStats} className="ml-2 underline hover:text-red-700">Retry</button>
            </div>
        )}
      </div>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {statConfig.map((item) => (
          <StatCard key={item.title} {...item} loading={loading} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-slate-50 p-2.5 text-blue-600 border border-slate-100">
              <Activity size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Platform Activity</h2>
          </div>
          <div className="space-y-4">
            {["New doctor verification request", "Payment successful", "Appointment cancelled"].map((item, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 group">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shadow-sm group-hover:scale-125 transition-transform"></div>
                <p className="text-sm text-slate-600 font-bold leading-tight">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-blue-600 p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <h2 className="text-2xl font-bold relative z-10">Quick Actions</h2>
            <p className="text-blue-100 mt-2 text-sm relative z-10 opacity-80 leading-relaxed font-medium">
                Perform common administrative tasks directly from the overview dashboard.
            </p>
            <div className="flex gap-3 mt-6 relative z-10">
                <button className="bg-white text-blue-600 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition hover:scale-105 active:scale-95">Generate Report</button>
                <button className="bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs border border-blue-400/30 transition hover:bg-blue-400 active:scale-95 shadow-lg">System Audit</button>
            </div>
        </div>
      </div>
    </div>
  );
}
