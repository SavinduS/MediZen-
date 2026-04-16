import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  CreditCard, 
  BellRing, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

const sidebarLinks = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "User Management", path: "/admin/users", icon: Users },
  { name: "Doctor Management", path: "/admin/doctors", icon: UserCheck },
  { name: "Transactions", path: "/admin/payments", icon: CreditCard },
  { name: "Notifications", path: "/admin/notifications", icon: BellRing },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 fixed left-0 top-20 bottom-0 z-40 shadow-xl animate-in slide-in-from-left duration-300">
      <div className="p-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 px-4">
          Admin Control
        </p>
        <nav className="space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/10" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"} />
                  <span className="font-bold text-sm">{link.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="rounded-2xl bg-slate-900 p-4 text-white">
          <div className="flex items-center gap-3 mb-4">
            <UserButton afterSignOutUrl="/" />
            <div>
              <p className="text-xs font-bold truncate">System Admin</p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Master Access</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 transition-colors text-xs font-bold">
            <LogOut size={14} />
            Logout Session
          </button>
        </div>
      </div>
    </aside>
  );
}
