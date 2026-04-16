import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="w-full min-h-screen flex bg-slate-50">
      {/* Sidebar (Left) */}
      <AdminSidebar />

      {/* Main Content (Right) */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
