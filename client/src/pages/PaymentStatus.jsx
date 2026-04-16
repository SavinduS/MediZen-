import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Download,
  Loader2,
  RefreshCcw
} from 'lucide-react';

export default function PaymentStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const status = location.state?.status || queryParams.get('status') || 'failed';
  const referenceNumber = location.state?.referenceNumber || queryParams.get('reference') || 'REF-2026-00005';
  const amount = location.state?.amount || '3500';
  const paymentId = location.state?.paymentId || '';

  const [downloading, setDownloading] = useState(false);
  const isSuccess = status === 'success';

  const handleDownloadReceipt = async () => {
    if (!paymentId) return alert('Payment reference not found.');
    setDownloading(true);
    try {
      const response = await axios.get(`http://localhost:5007/api/payments/receipt/${paymentId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${referenceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden text-center transform transition-all">
        
        {/* Header Section */}
        <div className="pt-12 pb-8 border-b border-slate-50">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {isSuccess ? <CheckCircle2 size={48} className="text-emerald-500" /> : <XCircle size={48} className="text-red-500" />}
          </div>
          <h1 className="text-3xl font-black text-[#1e293b] uppercase tracking-tighter leading-tight">
            {isSuccess ? 'Payment Successful' : 'Payment Failed'}
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3">Digital Payment Receipt</p>
        </div>

        {/* Details Section */}
        <div className="p-10 space-y-6">
          <div className="bg-slate-50 rounded-3xl border border-slate-100 p-8 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reference</span>
              <span className="text-sm font-black text-[#1e293b]">{referenceNumber}</span>
            </div>
            <div className="h-px bg-slate-200/60"></div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Amount Paid</span>
              <span className="text-2xl font-black text-[#2563eb]">LKR {Number(amount).toLocaleString()}</span>
            </div>
          </div>

          {/* Action Button */}
          {isSuccess ? (
            <button
              onClick={handleDownloadReceipt}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#1e293b] text-white text-sm font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
              <span>DOWNLOAD PDF RECEIPT</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-3 py-4 bg-red-600 text-white text-sm font-black rounded-2xl shadow-xl hover:bg-red-700 transition-all active:scale-[0.98]"
            >
              <RefreshCcw size={20} />
              <span>TRY PAYMENT AGAIN</span>
            </button>
          )}

          {/* Footer Link */}
          <div className="pt-4">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-[#2563eb] transition-colors group">
              <span>Return to Dashboard</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
