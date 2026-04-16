import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { fetchPaymentById, completePayment } from "../services/api";
import { CheckCircle, XCircle, Loader2, FileText, ArrowLeft } from "lucide-react";

const PaymentStatus = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);

  const successParam = query.get("success");
  const paymentId = query.get("paymentId");
  
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyAndComplete = async () => {
      if (!paymentId) {
        setError("Missing Payment ID");
        setLoading(false);
        return;
      }

      try {
        // 1. If we came back with success=true (mock gateway redirect), let's finalize it
        if (successParam === "true") {
          await completePayment(paymentId);
        }

        // 2. Fetch the latest status from backend
        const response = await fetchPaymentById(paymentId);
        setPayment(response.data.data);
      } catch (err) {
        console.error("Error verifying payment:", err);
        setError("Could not verify payment status with the server.");
      } finally {
        setLoading(false);
      }
    };

    verifyAndComplete();
  }, [paymentId, successParam]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Verifying Payment Status...</h2>
      </div>
    );
  }

  const isSuccess = payment?.status === "completed";

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-lg text-center border border-slate-100">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
            <p className="text-slate-500 mb-8 font-medium">
              Your consultation fee has been processed securely.
            </p>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Transaction ID</span>
                <span className="text-sm font-mono font-bold text-slate-800">{payment.txnId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Payment ID</span>
                <span className="text-sm font-bold text-slate-800">{payment.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Amount Paid</span>
                <span className="text-sm font-bold text-emerald-600">{payment.currency} {payment.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to={`/payment/receipt/${payment.paymentId}`}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-slate-200"
              >
                <FileText className="w-5 h-5" /> View Digital Receipt
              </Link>
              <Link
                to="/my-appointments"
                className="text-slate-500 hover:text-slate-800 font-semibold py-2 transition"
              >
                Return to Appointments
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-rose-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Failed</h1>
            <p className="text-slate-500 mb-8 font-medium">
              {error || "We couldn't process your payment. Please try again or contact support."}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-blue-200"
              >
                Try Again
              </button>
              <Link
                to="/"
                className="text-slate-500 hover:text-slate-800 font-semibold py-2 transition flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatus;