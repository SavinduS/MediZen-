import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, Link } from 'react-router-dom';
import { Download, Printer, ArrowLeft, Loader2, AlertCircle, FileCheck } from 'lucide-react';

export default function ReceiptPage() {
  const location = useLocation();
  const { transactionId, paymentId, amount, date } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    const idToUse = paymentId || transactionId;
    try {
      const response = await axios.get(`http://localhost:5007/payments/${idToUse}/receipt`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MediZen_Receipt_${idToUse}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Could not generate PDF. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-4 font-sans">
      <div className="max-w-xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-blue-600 transition-colors mb-10">
          <ArrowLeft size={16} /> Dashboard
        </Link>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-12 text-center border-b border-dashed border-slate-100 bg-slate-50/30">
            <div className="w-24 h-24 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl transform rotate-3">
              <FileCheck size={48} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">E-Receipt</h1>
            <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em]">Official Medical Record</p>
          </div>

          <div className="p-12 space-y-10">
            <div className="grid grid-cols-2 gap-y-8 gap-x-12">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Transaction ID</p>
                <p className="font-bold text-slate-800 text-sm truncate">{transactionId}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Date</p>
                <p className="font-bold text-slate-800 text-sm">{date ? new Date(date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Description</p>
                <p className="font-bold text-slate-800 text-sm">Tele-Consultation</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Paid</p>
                <p className="text-3xl font-black text-blue-600">${amount?.toFixed(2)}</p>
              </div>
            </div>

            {error && <div className="flex items-center gap-2 p-5 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100"><AlertCircle size={18} /> {error}</div>}

            <div className="pt-6 flex flex-col gap-4">
              <button onClick={handleDownload} disabled={loading} className="w-full flex items-center justify-center gap-3 py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
                {loading ? 'Generating PDF...' : 'Download PDF Receipt'}
              </button>
              <button className="w-full flex items-center justify-center gap-3 py-6 bg-white border-2 border-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-50 transition-all">
                <Printer size={22} /> Print Document
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
