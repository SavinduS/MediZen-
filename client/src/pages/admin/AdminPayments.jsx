import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { fetchAdminPayments } from "../../services/api";
import {
  CreditCard,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  LayoutGrid,
  Wallet,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

export default function AdminPayments() {
  const { getToken } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const params = {
        status: filterStatus !== "All" ? filterStatus : undefined,
        search: searchTerm || undefined,
      };

      const response = await fetchAdminPayments(params, token);
      const data = response.data?.data?.payments || response.data?.payments || [];
      setPayments(data);
    } catch (err) {
      console.error("Admin Payments API Error:", err);
      setError(err.response?.data?.message || "Failed to fetch transaction records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPayments();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [filterStatus, searchTerm]);

  const summary = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const completed = payments.filter((p) => p.status === "completed");
    const pending = payments.filter((p) => p.status === "pending");
    const failed = payments.filter((p) => p.status === "failed");

    return {
      totalRevenue: total,
      successCount: completed.length,
      pendingCount: pending.length,
      failedCount: failed.length,
    };
  }, [payments]);

  const summaryCards = [
    {
      title: "Total Revenue",
      value: `LKR ${summary.totalRevenue.toLocaleString()}`,
      icon: Wallet,
      iconWrap: "bg-blue-100 text-blue-600",
    },
    {
      title: "Successful",
      value: summary.successCount,
      icon: CheckCircle2,
      iconWrap: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Pending",
      value: summary.pendingCount,
      icon: Clock3,
      iconWrap: "bg-amber-100 text-amber-600",
    },
    {
      title: "Failed",
      value: summary.failedCount,
      icon: XCircle,
      iconWrap: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <div className="flex h-full min-h-0 flex-col gap-4 rounded-3xl bg-slate-50 p-4 md:p-5">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
              <div className="rounded-2xl bg-blue-100 p-2.5">
                <CreditCard className="text-blue-600" size={24} />
              </div>
              Financial Ledger
            </h1>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Transaction Monitoring & Audit Panel
            </p>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-slate-800">
            <Download size={16} />
            Export CSV
          </button>
        </div>

        {/* Payment Summary */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {card.title}
                    </p>
                    <h3 className="mt-2 text-lg md:text-xl font-extrabold text-slate-900 break-words">
                      {card.value}
                    </h3>
                  </div>

                  <div className={`rounded-2xl p-2.5 ${card.iconWrap}`}>
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search + Filter */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="relative lg:col-span-2">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Patient ID, Payment ID or Transaction ID..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative">
            <Filter
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <select
              className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Transactions</option>
              <option value="completed">Success Only</option>
              <option value="pending">Pending Only</option>
              <option value="failed">Failed Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-full overflow-auto">
            {loading ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 px-6 text-center">
                <Loader2 className="animate-spin text-blue-600" size={34} />
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Querying payment database...
                </p>
              </div>
            ) : error ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 px-6 text-center">
                <AlertCircle className="text-red-500" size={34} />
                <p className="max-w-md text-sm font-semibold text-red-500">{error}</p>
                <button
                  onClick={fetchPayments}
                  className="text-xs font-bold uppercase tracking-widest text-blue-600 hover:underline"
                >
                  Retry Connection
                </button>
              </div>
            ) : payments.length === 0 ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 px-6 text-center">
                <LayoutGrid size={42} className="text-slate-200" />
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                  No Transaction Records Found
                </p>
              </div>
            ) : (
              <table className="min-w-full text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-5 py-4">Ref IDs</th>
                    <th className="px-5 py-4">Patient</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Timestamp</th>
                    <th className="px-5 py-4 text-right">Details</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p._id} className="group transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <p className="font-mono text-[11px] font-semibold text-slate-600">
                            PAY: {p.paymentId || p._id?.slice(-8).toUpperCase()}
                          </p>
                          <p className="font-mono text-[11px] text-slate-400">
                            TXN: {p.txnId || "N/A"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-700">
                        {p.patientId || "Unknown"}
                      </td>

                      <td className="px-5 py-4 text-right text-sm md:text-base font-extrabold text-blue-600">
                        LKR {Number(p.amount || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-xl border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${
                            p.status === "completed"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                              : p.status === "pending"
                              ? "border-amber-200 bg-amber-50 text-amber-600"
                              : "border-red-200 bg-red-50 text-red-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-[11px] font-semibold uppercase text-slate-500">
                        <div>{new Date(p.createdAt).toLocaleDateString()}</div>
                        <div className="mt-1">
                          {new Date(p.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:scale-105 hover:bg-blue-600 hover:text-white">
                          <ArrowUpRight size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}