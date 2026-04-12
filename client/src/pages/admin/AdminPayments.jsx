import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { CreditCard, Search, Filter, Download } from "lucide-react";
import { fetchAdminPayments } from "../../services/api";

const badgeClasses = {
  Paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

const StatusBadge = ({ label }) => (
  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClasses[label] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
    {label}
  </span>
);

export default function AdminPayments() {
  const { getToken } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPayments = async () => {
      try {
        const token = await getToken();
        const res = await fetchAdminPayments({}, token);
        setPayments(res.data.data.payments || res.data.payments || []);
      } catch (err) {
        console.error("Failed to fetch payments", err);
      } finally {
        setLoading(false);
      }
    };
    getPayments();
  }, [getToken]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <CreditCard className="text-blue-600" size={32} />
            Transactions
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Monitor and manage platform financial activity.</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 shadow-sm">
                <Filter size={16} /> Filter
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 shadow-sm">
                <Download size={16} /> Export
            </button>
        </div>
      </div>

      <div className="rounded-[32px] bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                <th className="px-8 py-5">Transaction ID</th>
                <th className="px-6 py-5">Patient</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                    <td className="px-8 py-6 font-bold text-slate-900 font-mono tracking-tighter uppercase">{p.paymentId || p._id.slice(-8)}</td>
                    <td className="px-6 py-6 text-slate-600 font-medium">{p.patientId || "N/A"}</td>
                    <td className="px-6 py-6 font-bold text-slate-900">LKR {p.amount.toLocaleString()}</td>
                    <td className="px-6 py-6 text-slate-400 text-xs font-bold">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-6 text-right"><StatusBadge label={p.status} /></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="py-20 text-center text-slate-400 italic">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
