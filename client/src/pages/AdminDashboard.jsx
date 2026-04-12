import React, { useMemo, useState } from "react";
import {
  Users,
  UserCog,
  CalendarDays,
  CreditCard,
  Wallet,
  ShieldCheck,
  Activity,
  FileText,
  UserPlus,
  Search,
} from "lucide-react";

const stats = [
  {
    title: "Total Patients",
    value: "1,284",
    change: "+12.4%",
    icon: Users,
  },
  {
    title: "Total Doctors",
    value: "86",
    change: "+4.1%",
    icon: UserCog,
  },
  {
    title: "Total Appointments",
    value: "342",
    change: "+18.2%",
    icon: CalendarDays,
  },
  {
    title: "Total Payments",
    value: "297",
    change: "+9.7%",
    icon: CreditCard,
  },
  {
    title: "Revenue",
    value: "LKR 428,500",
    change: "+14.3%",
    icon: Wallet,
  },
  {
    title: "Pending Verifications",
    value: "11",
    change: "Needs review",
    icon: ShieldCheck,
  },
];

const recentAppointments = [
  {
    id: "APT-1001",
    patient: "Nethmi Perera",
    doctor: "Dr. A. Fernando",
    specialty: "Cardiology",
    date: "2026-04-08",
    time: "09:30 AM",
    paymentStatus: "Paid",
    appointmentStatus: "Confirmed",
  },
  {
    id: "APT-1002",
    patient: "Kavindu Silva",
    doctor: "Dr. S. Jayawardena",
    specialty: "Dermatology",
    date: "2026-04-08",
    time: "11:00 AM",
    paymentStatus: "Pending",
    appointmentStatus: "Pending",
  },
  {
    id: "APT-1003",
    patient: "Dulani Wickramasinghe",
    doctor: "Dr. M. Peris",
    specialty: "Neurology",
    date: "2026-04-09",
    time: "02:00 PM",
    paymentStatus: "Paid",
    appointmentStatus: "Completed",
  },
];

const pendingDoctorsInitial = [
  {
    id: "DOC-201",
    name: "Dr. Ishara Senanayake",
    specialty: "Orthopedics",
    email: "ishara@medizen.com",
    experience: "7 years",
  },
  {
    id: "DOC-202",
    name: "Dr. Shenal Perera",
    specialty: "ENT",
    email: "shenal@medizen.com",
    experience: "5 years",
  },
];

const users = [
  {
    id: "USR-1",
    name: "Nethmi Perera",
    email: "nethmi@gmail.com",
    role: "patient",
    status: "active",
  },
  {
    id: "USR-2",
    name: "Dr. A. Fernando",
    email: "afernando@medizen.com",
    role: "doctor",
    status: "active",
  },
  {
    id: "USR-3",
    name: "Admin Sahan",
    email: "admin@medizen.com",
    role: "admin",
    status: "active",
  },
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
  <span
    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
      badgeClasses[label] || "bg-slate-100 text-slate-700 border-slate-200"
    }`}
  >
    {label}
  </span>
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

export default function AdminDashboard() {
  const [userFilter, setUserFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingDoctors, setPendingDoctors] = useState(pendingDoctorsInitial);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole = userFilter === "all" || user.role === userFilter;
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [userFilter, searchTerm]);

  const handleApprove = (id) => {
    setPendingDoctors((prev) => prev.filter((doctor) => doctor.id !== id));
  };

  const handleReject = (id) => {
    setPendingDoctors((prev) => prev.filter((doctor) => doctor.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
              Global platform oversight: Monitor activity, manage user roles, 
              and verify healthcare professionals.
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

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* Verification Queue */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={20} />
              Verification Queue
            </h2>
            <StatusBadge label={`${pendingDoctors.length} Pending`} />
          </div>

          <div className="space-y-4">
            {pendingDoctors.length > 0 ? (
              pendingDoctors.map((doctor) => (
                <div key={doctor.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-100">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{doctor.name}</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase mt-1">{doctor.specialty} • {doctor.experience}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(doctor.id)} className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm">Approve</button>
                      <button onClick={() => handleReject(doctor.id)} className="rounded-lg bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300">Reject</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 rounded-xl">No pending requests</div>
            )}
          </div>
        </div>

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
