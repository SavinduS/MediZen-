import React, { useState } from "react";
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
  const [open, setOpen] = useState(false);

  // Show sidebar on desktop, hamburger on mobile
  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className="fixed top-24 left-4 z-50 lg:hidden bg-blue-600 text-white p-2 rounded-full shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open sidebar"
      >
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 fixed left-0 top-20 bottom-0 z-40 shadow-xl animate-in slide-in-from-left duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:top-20 lg:left-0 lg:block`}
        style={{ transition: 'transform 0.3s' }}
      >
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
                  onClick={() => setOpen(false)}
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
      </aside>
      {/* Overlay for mobile when sidebar is open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
    </>
  );
}
