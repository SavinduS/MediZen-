import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50 overflow-hidden relative">
      {/* Sidebar (Left) */}
      <AdminSidebar />

      {/* Main Content (Right) */}
      <main className="flex-grow overflow-y-auto p-8 lg:p-12 ml-72">
        <div className="max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
