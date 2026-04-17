import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AdminTable from "../../components/AdminTable";
import { 
  CreditCard, Wallet, CheckCircle2, Clock3, XCircle, 
  Download, Calendar, ChevronRight, X, Search, FileText, Loader2
} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import { fetchAdminPayments } from "../../services/api";

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [reporting, setReporting] = useState(false);
  const { getToken } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetchAdminPayments({}, token);
      // Sorting: Latest first (LIFO)
      const data = res.data.data?.payments || res.data.data || [];
      const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPayments(sorted);
    } catch (err) {
      setError("Payment service unreachable.");
      console.error("Fetch Payments Error:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesStatus = filterStatus === "ALL" || p.status?.toUpperCase() === filterStatus;
      const matchesSearch = searchTerm === "" || 
        (p.paymentId && p.paymentId.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [payments, filterStatus, searchTerm]);

  const exportToCSV = () => {
    const headers = ["Transaction ID", "Patient", "Amount (LKR)", "Status", "Date"];
    const rows = filteredPayments.map(p => [
      `"${p.paymentId || p.txnId || 'N/A'}"`,
      `"${p.patientId || 'Unknown'}"`,
      p.amount,
      `"${p.status}"`,
      `"${new Date(p.createdAt).toLocaleDateString()}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MediZen_Financial_Records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("CSV Exported Successfully");
  };

  const handleGenerateReport = () => {
    setReporting(true);
    try {
      const doc = new jsPDF();
      const totalRevenue = payments.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.amount : 0), 0);
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text("Healthcare Platform - Financial Audit Report", 14, 22);
      
      // Summary Section
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
      
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(14, 36, 196, 36);
      
      doc.setFontSize(14);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("Summary Section", 14, 45);
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(`Total Revenue: LKR ${totalRevenue.toLocaleString()}`, 14, 55);
      doc.text(`Total Transaction Count: ${payments.length}`, 14, 62);
      doc.text(`Completed Payments: ${payments.filter(p => p.status === 'completed').length}`, 14, 69);
      
      // Table
      const tableColumn = ["Transaction ID", "Patient", "Amount", "Status", "Date"];
      const tableRows = payments.map(p => [
        p.paymentId || "N/A",
        p.patientId || "N/A",
        `LKR ${p.amount.toLocaleString()}`,
        p.status.toUpperCase(),
        new Date(p.createdAt).toLocaleDateString()
      ]);
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 78,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], fontSize: 10, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      
      doc.save(`MediZen_Financial_Audit_${new Date().toLocaleDateString()}.pdf`);
      toast.success("Professional Financial Report Generated");
    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast.error("Failed to generate PDF report");
    } finally {
      setReporting(false);
    }
  };

  const stats = [
    { title: "Total Revenue", value: `LKR ${payments.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.amount : 0), 0).toLocaleString()}`, icon: Wallet, bg: "bg-blue-100", color: "text-blue-600" },
    { title: "Success", value: payments.filter(p => p.status === 'completed').length, icon: CheckCircle2, bg: "bg-emerald-100", color: "text-emerald-600" },
    { title: "Pending", value: payments.filter(p => p.status === 'pending').length, icon: Clock3, bg: "bg-amber-100", color: "text-amber-700" },
    { title: "Total Records", value: payments.length, icon: FileText, bg: "bg-slate-100", color: "text-slate-600" },
  ];

  const columns = [
    { 
      header: "Reference ID", 
      render: (p) => (
        <span className="font-mono text-[11px] font-bold text-slate-400">
          {p.paymentId || p.txnId?.slice(0, 10).toUpperCase() || 'TXN-REF'}
        </span>
      )
    },
    { 
      header: "Amount (LKR)", 
      align: "right",
      render: (p) => <span className="text-sm font-black text-blue-600 tracking-tight">{Number(p.amount).toLocaleString()}</span>
    },
    { 
      header: "Status", 
      render: (p) => (
        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
          p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
          p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
        }`}>
          {p.status}
        </span>
      )
    },
    { 
      header: "Timestamp", 
      render: (p) => (
        <div className="flex flex-col text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
          <div className="flex items-center gap-1"><Calendar size={12}/> {new Date(p.createdAt).toLocaleDateString()}</div>
          <div className="text-slate-300 ml-4">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      )
    },
    {
      header: "",
      align: "right",
      render: (p) => (
        <button 
          onClick={() => setSelectedPayment(p)}
          className="p-2 rounded-xl bg-slate-50 text-[#2563eb] hover:bg-[#2563eb] hover:text-white transition-all shadow-sm border border-slate-100"
        >
          <ChevronRight size={18} />
        </button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-8 h-full bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden font-sans relative">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-[#1e293b] flex items-center gap-3 tracking-tight uppercase">
            <CreditCard className="text-blue-600" size={32} /> Financial Ledger
          </h1>
          <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-[0.2em]">Transaction Audit & Control</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleGenerateReport}
                disabled={reporting}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 text-xs font-black rounded-2xl shadow-sm hover:bg-slate-50 transition-all uppercase tracking-widest disabled:opacity-50"
            >
                {reporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} 
                Generate Financial Report
            </button>
            <button 
                onClick={exportToCSV}
                className="flex items-center gap-2 px-6 py-3 bg-[#1e293b] text-white text-xs font-black rounded-2xl shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest"
            >
                <Download size={16} /> Export CSV
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            placeholder="Search by Reference ID..."
            className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[1.2rem] border border-slate-100 shadow-inner">
          {["ALL", "COMPLETED", "PENDING", "FAILED"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-[#2563eb] text-white shadow-md' : 'bg-transparent text-slate-400 hover:text-slate-600'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.title} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.title}</p>
              <h3 className="text-lg font-black text-slate-900 mt-1">{s.value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${s.bg} ${s.color}`}><s.icon size={18} /></div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <AdminTable 
          columns={columns} 
          data={filteredPayments} 
          loading={loading} 
          error={error} 
          onRetry={fetchData} 
          emptyMessage="No Transactions Found"
        />
      </div>

      {/* Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#2563eb] text-white rounded-2xl shadow-lg">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1e293b] uppercase">Transaction Info</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Monitoring</p>
                </div>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference ID</p>
                  <p className="text-sm font-bold text-slate-700 font-mono">{selectedPayment.paymentId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</p>
                  <p className="text-lg font-black text-[#2563eb]">LKR {selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedPayment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedPayment.status}
                  </span>
                </div>
                 <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient ID</p>
                  <p className="text-sm font-bold text-slate-700 font-mono">{selectedPayment.patientId}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Calendar size={18} className="text-[#2563eb]" />
                <div className="text-xs font-bold text-slate-600">
                  Processed on {new Date(selectedPayment.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="p-8 pt-0">
              <button onClick={() => setSelectedPayment(null)} className="w-full py-4 bg-[#1e293b] text-white font-black rounded-2xl hover:bg-slate-800 transition-all uppercase tracking-widest shadow-lg">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
