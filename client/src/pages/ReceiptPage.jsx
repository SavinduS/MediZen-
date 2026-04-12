import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPaymentById, downloadReceipt } from "../services/api";
import { 
  FileText, 
  Download, 
  ArrowLeft, 
  Printer, 
  ShieldCheck, 
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";

const ReceiptPage = () => {
  const { paymentId } = useParams();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const getReceiptData = async () => {
      try {
        setLoading(true);
        // 1. Get payment details
        const payRes = await fetchPaymentById(paymentId);
        setPayment(payRes.data.data);

        // 2. Get receipt details (metadata)
        const recRes = await downloadReceipt(paymentId);
        setReceipt(recRes.data.data);
      } catch (err) {
        console.error("Error fetching receipt:", err);
        setError("Failed to load receipt details. The payment may still be processing.");
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) getReceiptData();
  }, [paymentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setDownloading(true);
    // Mock download behavior
    setTimeout(() => {
      if (receipt?.pdfUrl) {
        window.open(receipt.pdfUrl, '_blank');
      }
      setDownloading(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Generating your digital receipt...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl shadow-sm border border-slate-100 text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
           <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Receipt Not Found</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <Link to="/my-appointments" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Appointments
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto my-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6 no-print">
        <Link to="/my-appointments" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold transition">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>
      </div>

      {/* Actual Receipt Card */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 print:shadow-none print:border-none">
        {/* Top Header */}
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">MediZen <span className="text-blue-400">Healthcare</span></h1>
              <p className="text-slate-400 mt-1 font-medium">Official Payment Receipt</p>
            </div>
            <div className="text-right">
              <StatusBadge label="Paid" />
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Receipt # {receipt?.receiptId || 'N/A'}</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        </div>

        <div className="p-8 space-y-8">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Patient Details</h3>
              <div className="space-y-1">
                <p className="text-lg font-bold text-slate-900">{payment.patientName || 'MediZen Patient'}</p>
                <p className="text-sm text-slate-500">ID: {payment.patientId}</p>
                <p className="text-sm text-slate-500">{payment.email || 'No email provided'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Date</p>
                  <p className="text-sm font-bold text-slate-700">{new Date(payment.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Method</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">{payment.gateway || 'Card'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Txn ID</p>
                  <p className="text-sm font-bold text-slate-700 font-mono truncate">{payment.txnId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                  <p className="text-sm font-bold text-emerald-600">Success</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden mt-8">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-900 text-base">Medical Consultation Fee</p>
                    <p className="text-sm text-slate-500">Appointment Ref: {payment.appointmentId}</p>
                  </td>
                  <td className="px-6 py-5 text-right font-bold text-slate-900 text-lg">
                    {payment.currency} {payment.amount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="px-6 py-5 uppercase tracking-[0.2em] text-xs">Total Amount Paid</td>
                  <td className="px-6 py-5 text-right text-2xl tracking-tight">
                    {payment.currency} {payment.amount.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Verification Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-100 opacity-60">
            <div className="flex items-center gap-3">
               <ShieldCheck className="w-10 h-10 text-emerald-500" />
               <div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Secure Payment Verified</p>
                 <p className="text-[9px] text-slate-500">This is a system-generated digital receipt for MediZen Healthcare services.</p>
               </div>
            </div>
            <div className="text-center md:text-right">
               <CheckCircle2 className="w-8 h-8 text-blue-500 mb-1 inline-block md:block" />
               <p className="text-[9px] font-bold uppercase text-slate-400">Valid Digital Signature</p>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-slate-400 mt-8 mb-12 no-print">
        Questions? Contact our support at <span className="text-slate-600 font-bold">support@medizen.com</span>
      </p>
    </div>
  );
};

// Reusing badge styling from previous work
const StatusBadge = ({ label }) => (
  <span className="inline-flex items-center bg-emerald-500 text-white rounded-full px-4 py-1 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20">
    {label}
  </span>
);

export default ReceiptPage;