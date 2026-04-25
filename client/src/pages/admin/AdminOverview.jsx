import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  AlertCircle,
  RefreshCw,
  Clock,
  InboxIcon,
} from "lucide-react";
import { fetchAdminStats } from "../../services/api";

// ─── Badge helpers ────────────────────────────────────────────────────────────
const badgeClasses = {
  // Payment statuses
  Paid:      "bg-emerald-100 text-emerald-700 border-emerald-200",
  paid:      "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",

  Pending:   "bg-amber-100 text-amber-700 border-amber-200",
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  PENDING:   "bg-amber-100 text-amber-700 border-amber-200",

  Failed:    "bg-red-100 text-red-700 border-red-200",
  failed:    "bg-red-100 text-red-700 border-red-200",
  FAILED:    "bg-red-100 text-red-700 border-red-200",

  Cancelled: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",

  Confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",

  // User roles
  patient: "bg-cyan-100 text-cyan-700 border-cyan-200",
  doctor:  "bg-violet-100 text-violet-700 border-violet-200",
  admin:   "bg-slate-200 text-slate-700 border-slate-300",

  // User status
  active:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
};

const StatusBadge = ({ label }) => (
  <span
    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
      badgeClasses[label] || "bg-slate-100 text-slate-700 border-slate-200"
    }`}
  >
    {label}
  </span>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, loading }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 transition hover:shadow-md hover:border-blue-200 group">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        {loading ? (
          <div className="mt-3 h-7 w-16 rounded bg-slate-100 animate-pulse" />
        ) : (
          <h3 className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        )}
        <p className="mt-2 text-xs font-medium text-blue-600">{sub}</p>
      </div>
      <div className="rounded-xl bg-slate-50 p-3 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
        <Icon size={20} />
      </div>
    </div>
  </div>
);

// ─── Time formatter ───────────────────────────────────────────────────────────
const timeAgo = (ts) => {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ─── Capitalize status (handles "COMPLETED", "Completed", "completed") ────────
const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminOverview() {
  const [data, setData]               = useState(null);
  const [userFilter, setUserFilter]   = useState("all");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const { getToken }                  = useAuth();

  // ── Fetch real data from backend ──────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Session expired. Please refresh the page.");
        return;
      }

      const res = await fetchAdminStats(token);
      const apiData = res?.data?.data || null;

      if (!apiData) {
        throw new Error("No data returned from admin stats API.");
      }

      console.log("[AdminOverview] Real data loaded:", apiData);
      setData(apiData);
    } catch (err) {
      console.error("[AdminOverview] Fetch error:", err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load dashboard data. Please check that all services are running."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ── Derive stat cards from real data ──────────────────────────────────────
  const stats = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: "Total Patients",
        value: (data.totalPatients ?? 0).toLocaleString(),
        sub: "Registered patients",
        icon: Users,
      },
      {
        title: "Total Doctors",
        value: (data.totalDoctors ?? 0).toLocaleString(),
        sub: `${data.pendingDoctorsCount ?? 0} pending verification`,
        icon: UserCog,
      },
      {
        title: "Total Appointments",
        value: (data.totalAppointments ?? 0).toLocaleString(),
        sub: "Across platform",
        icon: CalendarDays,
      },
      {
        title: "Total Transactions",
        value: (data.totalPayments ?? 0).toLocaleString(),
        sub: "Processed payments",
        icon: CreditCard,
      },
      {
        title: "Revenue",
        value: `LKR ${(data.totalRevenue ?? 0).toLocaleString()}`,
        sub: "From completed payments",
        icon: Wallet,
      },
      {
        title: "Pending Verifications",
        value: (data.pendingDoctorsCount ?? 0).toString(),
        sub: "Doctors awaiting review",
        icon: ShieldCheck,
      },
    ];
  }, [data]);

  // ── Normalize recent appointments ─────────────────────────────────────────
  const recentAppointments = useMemo(() => {
    if (!data?.recentAppointments) return [];
    return data.recentAppointments.map((apt) => ({
      id:                apt._id || apt.appointmentId || apt.id,
      patient:           apt.patientName  || "Unknown Patient",
      doctor:            apt.doctorName   || "Unknown Doctor",
      specialty:         apt.specialty    || "General",
      paymentStatus:     capitalize(apt.paymentStatus || "Pending"),
      appointmentStatus: capitalize(apt.status        || "Pending"),
    }));
  }, [data]);

  // ── Normalize recent users ────────────────────────────────────────────────
  const recentUsers = useMemo(() => {
    if (!data?.recentUsers) return [];
    return data.recentUsers.map((u) => ({
      id:     u._id  || u.id,
      name:   u.name || u.email?.split("@")[0] || "Unknown",
      email:  u.email,
      role:   u.role   || "patient",
      status: u.status || "active",
    }));
  }, [data]);

  // ── Filter users by role ──────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    if (userFilter === "all") return recentUsers;
    return recentUsers.filter((u) => u.role === userFilter);
  }, [recentUsers, userFilter]);

  // ── Normalize recent activity ─────────────────────────────────────────────
  const recentActivity = useMemo(() => {
    if (!data?.recentActivity || data.recentActivity.length === 0) return [];
    return data.recentActivity.map((a) => ({
      action:    a.action,
      timestamp: a.timestamp,
      targetId:  a.targetId,
    }));
  }, [data]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-blue-600 font-bold tracking-wide">Loading dashboard data...</p>
        <p className="text-slate-400 text-xs mt-1">Fetching from all microservices</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6">
        <div className="bg-red-50 p-10 rounded-3xl border border-red-100 max-w-md w-full text-center">
          <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl -mr-24 -mt-24" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">
              MediZen Healthcare
            </p>
            <h1 className="text-3xl font-extrabold md:text-4xl tracking-tight">Admin Dashboard</h1>
            <p className="mt-3 max-w-2xl text-slate-400 text-sm leading-relaxed">
              Global platform oversight — monitor activity, manage users, and verify healthcare professionals.
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 self-start rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 text-sm font-bold text-white transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((item) => (
          <StatCard key={item.title} {...item} loading={loading} />
        ))}
      </section>

      {/* ── Appointments + Activity ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">

        {/* Recent Appointments */}
        <div className="xl:col-span-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="text-blue-600" size={20} />
              Recent Appointments
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {recentAppointments.length} record{recentAppointments.length !== 1 ? "s" : ""}
            </span>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <InboxIcon className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm font-medium">No appointments found</p>
            </div>
          ) : (
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
                  {recentAppointments.map((apt, idx) => (
                    <tr key={apt.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-5 font-bold text-slate-900">{apt.patient}</td>
                      <td className="px-3 py-5 text-slate-600 font-medium">{apt.doctor}</td>
                      <td className="px-3 py-5 text-slate-600 font-medium">{apt.specialty}</td>
                      <td className="px-3 py-5">
                        <div className="flex flex-col gap-1">
                          <StatusBadge label={apt.paymentStatus} />
                          <StatusBadge label={apt.appointmentStatus} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Platform Activity */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-slate-50 p-2.5 text-blue-600 border border-slate-100">
              <Activity size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Platform Activity</h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <InboxIcon className="w-8 h-8 text-slate-200 mb-3" />
              <p className="text-slate-400 text-xs font-medium">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 font-medium leading-tight capitalize">
                      {item.action?.replace(/_/g, " ") || "System event"}
                    </p>
                    {item.timestamp && (
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock size={9} />
                        {timeAgo(item.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── User Management ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Users</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Latest registered accounts
            </p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit shadow-inner">
            {["all", "patient", "doctor", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => setUserFilter(r)}
                className={`rounded-lg px-4 py-1.5 text-[10px] font-bold transition uppercase tracking-tighter ${
                  userFilter === r
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center border-2 border-dashed border-slate-100 rounded-xl">
            <Users className="w-8 h-8 text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm font-medium">
              {userFilter === "all" ? "No users found" : `No ${userFilter}s found`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  <th className="px-3 py-4">Name</th>
                  <th className="px-3 py-4">Email</th>
                  <th className="px-3 py-4">Role</th>
                  <th className="px-3 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id || idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-3 py-4 font-bold text-slate-900">{user.name}</td>
                    <td className="px-3 py-4 text-slate-500 text-xs font-medium">{user.email}</td>
                    <td className="px-3 py-4">
                      <StatusBadge label={user.role} />
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge label={user.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}