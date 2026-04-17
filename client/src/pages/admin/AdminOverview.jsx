import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  Users, UserCog, CalendarDays, CreditCard, Wallet, ShieldCheck, Activity, FileText, UserPlus, Search, Loader2
} from "lucide-react";
import axios from "axios";

// Demo/statics for UI (replace with API data as needed)
const statsDemo = [
  { title: "Total Patients", value: "1,284", change: "+12.4%", icon: Users },
  { title: "Total Doctors", value: "86", change: "+4.1%", icon: UserCog },
  { title: "Total Appointments", value: "342", change: "+18.2%", icon: CalendarDays },
  { title: "Total Payments", value: "297", change: "+9.7%", icon: CreditCard },
  { title: "Revenue", value: "LKR 428,500", change: "+14.3%", icon: Wallet },
  { title: "Pending Verifications", value: "11", change: "Needs review", icon: ShieldCheck },
];
const recentAppointmentsDemo = [
  { id: "APT-1001", patient: "Nethmi Perera", doctor: "Dr. A. Fernando", specialty: "Cardiology", paymentStatus: "Paid", appointmentStatus: "Confirmed" },
  { id: "APT-1002", patient: "Kavindu Silva", doctor: "Dr. S. Jayawardena", specialty: "Dermatology", paymentStatus: "Pending", appointmentStatus: "Pending" },
  { id: "APT-1003", patient: "Dulani Wickramasinghe", doctor: "Dr. M. Peris", specialty: "Neurology", paymentStatus: "Paid", appointmentStatus: "Completed" },
];
const pendingDoctorsInitial = [
  { id: "DOC-201", name: "Dr. Ishara Senanayake", specialty: "Orthopedics", email: "ishara@medizen.com", experience: "7 years" },
  { id: "DOC-202", name: "Dr. Shenal Perera", specialty: "ENT", email: "shenal@medizen.com", experience: "5 years" },
];
const usersDemo = [
  { id: "USR-1", name: "Nethmi Perera", email: "nethmi@gmail.com", role: "patient", status: "active" },
  { id: "USR-2", name: "Dr. A. Fernando", email: "afernando@medizen.com", role: "doctor", status: "active" },
  { id: "USR-3", name: "Admin Sahan", email: "admin@medizen.com", role: "admin", status: "active" },
];
const badgeClasses = {
  Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Failed: "bg-red-100 text-red-700 border-red-200",
  Confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-100 text-red-700 border-red-200",
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  patient: "bg-cyan-100 text-cyan-700 border-cyan-200",
  doctor: "bg-violet-100 text-violet-700 border-violet-200",
  admin: "bg-slate-200 text-slate-700 border-slate-300",
};
const StatusBadge = ({ label }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClasses[label] || "bg-slate-100 text-slate-700 border-slate-200"}`}>{label}</span>
);
const StatCard = ({ title, value, change, icon: Icon }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 transition hover:shadow-md hover:border-blue-200 group">
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
  const [stats, setStats] = useState([]);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Auth check and dashboard data fetch
  useEffect(() => {
    let isMounted = true;
    const checkAuthAndFetch = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setError("Session expired. Please refresh.");
          setLoading(false);
          return;
        }
        
        // Fetch real dashboard stats from Admin Service
        const res = await axios.get("http://localhost:5009/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!isMounted) return;

        if (res.data && res.data.data) {
          const apiStats = res.data.data;
          
          // Map API data to our stats structure for the UI
          const updatedStats = [
            { title: "Total Patients", value: apiStats.totalPatients?.toLocaleString() || "0", change: "Real-time", icon: Users },
            { title: "Total Doctors", value: apiStats.totalDoctors?.toLocaleString() || "0", change: `${apiStats.pendingDoctorsCount || 0} pending`, icon: UserCog },
            { title: "Total Appointments", value: apiStats.totalAppointments?.toLocaleString() || "0", change: "Across platform", icon: CalendarDays },
            { title: "Total Transactions", value: apiStats.totalPayments?.toLocaleString() || "0", change: "Processed", icon: CreditCard },
            { title: "Revenue", value: `LKR ${apiStats.totalRevenue?.toLocaleString() || "0"}`, change: "Completed", icon: Wallet },
            { title: "Pending Verifications", value: apiStats.pendingDoctorsCount?.toString() || "0", change: "Needs review", icon: ShieldCheck },
          ];
          
          setStats(updatedStats);

          // Map real lists from DB to state
          if (apiStats.recentAppointments) {
            setRecentAppointments(apiStats.recentAppointments.map(apt => ({
              id: apt.appointmentId || apt._id,
              patient: apt.patientName || `Patient ${apt.patientId?.slice(-4) || '??'}`,
              doctor: apt.doctorName || `Dr. ${apt.doctorId?.slice(-4) || '??'}`,
              specialty: apt.specialty || "General",
              paymentStatus: apt.paymentStatus || "Paid",
              appointmentStatus: apt.status || "Confirmed"
            })));
          }

          if (apiStats.recentUsers) {
            setUsers(apiStats.recentUsers.map(u => ({
              id: u._id,
              name: u.name || u.email?.split('@')[0] || "Unknown",
              email: u.email,
              role: u.role,
              status: u.status || "active"
            })));
          }
        }

        setError(null);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setError("Failed to load real-time dashboard data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkAuthAndFetch();
    return () => { isMounted = false; };
  }, [navigate, getToken]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = userFilter === "all" || user.role === userFilter;
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, userFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <span className="text-blue-600 font-bold tracking-wide">Authorizing and loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <span className="text-red-600 font-bold tracking-wide">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 font-sans bg-slate-50 min-h-screen">
      {/* Header Section */}
      <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">
              MediZen Healthcare
            </p>
            <h1 className="text-3xl font-extrabold md:text-4xl tracking-tight">Admin Dashboard</h1>
            <p className="mt-3 max-w-2xl text-slate-400 text-sm md:text-base leading-relaxed">
              Global platform oversight: Monitor activity, manage user roles, and verify healthcare professionals.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 shadow-lg">
              Generate Reports
            </button>
            <button className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-lg shadow-blue-900/20">
              System Settings
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Recent Appointments */}
        <div className="xl:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="text-blue-600" size={20} />
              Recent Appointments
            </h2>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4 tracking-wider">VIEW ALL</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  <th className="px-3 py-4">Patient</th>
                  <th className="px-3 py-4">Doctor</th>
                  <th className="px-3 py-4">Specialty</th>
                  <th className="px-3 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-5 font-bold text-slate-900">{appointment.patient}</td>
                    <td className="px-3 py-5 text-slate-600 font-medium">{appointment.doctor}</td>
                    <td className="px-3 py-5 text-slate-600 font-medium">{appointment.specialty}</td>
                    <td className="px-3 py-5">
                      <div className="flex flex-col gap-1">
                        <StatusBadge label={appointment.paymentStatus} />
                        <StatusBadge label={appointment.appointmentStatus} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Activity Feed */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-slate-50 p-2.5 text-blue-600 border border-slate-100">
              <Activity size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Platform Activity</h2>
          </div>
          <div className="space-y-4">
            {[
              "New doctor verification request",
              "Payment PAY-5003 successful",
              "Appointment APT-1004 cancelled",
            ].map((item, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                <p className="text-sm text-slate-600 font-medium leading-tight">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* User Management */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-lg font-bold text-slate-900">User Management</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit shadow-inner">
              {["all", "patient", "doctor"].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserFilter(r)}
                  className={`rounded-lg px-4 py-1.5 text-[10px] font-bold transition uppercase tracking-tighter ${
                    userFilter === r ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <tbody className="divide-y divide-slate-50 font-bold">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4">
                      <p className="text-slate-900 leading-tight">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal uppercase mt-1">{user.email}</p>
                    </td>
                    <td className="py-4"><StatusBadge label={user.role} /></td>
                    <td className="py-4 text-right">
                      <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}