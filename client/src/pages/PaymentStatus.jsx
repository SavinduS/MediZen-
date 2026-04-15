import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, ArrowRight, FileDown, RefreshCcw, Loader2 } from 'lucide-react';

export default function PaymentStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  
  // Try to get data from state (direct navigate) or query params (Stripe redirect)
  const status = location.state?.status || queryParams.get('status') || 'failed';
  const transactionId = location.state?.transactionId || queryParams.get('session_id') || 'N/A';
  const amount = location.state?.amount || '0';
  const paymentId = location.state?.paymentId || '';

  const [downloading, setDownloading] = useState(false);
  const isSuccess = status === 'success';

  const handleDownloadReceipt = async () => {
    // If we don't have paymentId (Stripe redirect), we might need to fetch it by session_id/txnId
    // For now, assume it's passed or handled via backend lookup by txnId if needed
    const idToUse = paymentId || transactionId;
    if (!idToUse || idToUse === 'N/A') {
        alert("Payment reference not found. Cannot download receipt.");
        return;
    }

    setDownloading(true);
    try {
      const response = await axios.get(`http://localhost:5007/api/payments/${idToUse}/receipt`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${idToUse}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Receipt download failed:", err);
      alert("Receipt generation failed. Please ensure the payment was successful.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] bg-slate-50 flex items-center justify-center font-sans overflow-hidden">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl p-10 text-center border border-slate-100 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-2 ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />
        
        <div className="mb-6">
          {isSuccess ? (
            <div className="inline-flex p-4 rounded-full bg-emerald-50 text-emerald-500">
                <CheckCircle2 size={64} strokeWidth={1.5} />
            </div>
          ) : (
            <div className="inline-flex p-4 rounded-full bg-red-50 text-red-500">
                <XCircle size={64} strokeWidth={1.5} />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
          {isSuccess ? 'Payment Successful' : 'Payment Failed'}
        </h1>
        
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-8">
          {isSuccess ? "Transaction Verified" : "Transaction Declined"}
        </p>

        <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3 border border-slate-100">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</span>
            <span className="text-[10px] font-mono font-bold text-slate-600 truncate max-w-[150px]">{transactionId}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
            <span className="text-lg font-black text-blue-600">LKR {Number(amount).toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-3">
          {isSuccess ? (
            <button 
              onClick={handleDownloadReceipt}
              disabled={downloading}
              className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {downloading ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
              <span className="text-xs uppercase tracking-widest">Download Receipt</span>
            </button>
          ) : (
            <button 
              onClick={() => navigate('/checkout')}
              className="flex items-center justify-center gap-3 w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98]"
            >
              <RefreshCcw size={18} />
              <span className="text-xs uppercase tracking-widest">Try Again</span>
            </button>
          )}

          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 w-full py-3 text-slate-400 font-bold hover:text-blue-600 transition-colors text-xs uppercase tracking-widest"
          >
            Dashboard <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
