import React, { useState } from "react";
import axios from "axios";
import { useLocation, Link } from "react-router-dom";
import {
  Download,
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function ReceiptPage() {
  const location = useLocation();

  const {
    transactionId,
    transactionDisplayId,
    referenceNumber,
    paymentId,
    amount,
    date,
    doctorName,
    doctorSpecialty,
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const consultationFee =
    Number(amount || 0) > 500 ? Number(amount || 0) - 500 : Number(amount || 0);
  const serviceFee = Number(amount || 0) > 500 ? 500 : 0;

  const displayReference = referenceNumber || paymentId || "N/A";
  const displayTransaction = transactionDisplayId || transactionId || "N/A";
  const idToUse = paymentId || transactionId;

  const handleDownload = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(
        `http://localhost:5007/api/payments/${idToUse}/receipt`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `MediZen_Receipt_${displayReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Could not generate PDF receipt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 font-sans">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl print:shadow-none">
          {/* Header */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-8 text-white md:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                  <FileText size={28} />
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blue-200">
                    MediZen Smart Healthcare
                  </p>
                  <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                    Payment Receipt
                  </h1>
                  <p className="mt-2 text-sm text-slate-300">
                    Official confirmation of payment for your consultation booking.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start rounded-full bg-emerald-500/15 px-4 py-2 text-emerald-300 ring-1 ring-emerald-400/20">
                <CheckCircle2 size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Paid
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8 md:px-10 md:py-10">
            {/* Top info */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="Reference No" value={displayReference} mono />
              <InfoCard label="Transaction ID" value={displayTransaction} mono />
              <InfoCard
                label="Payment Date"
                value={date ? new Date(date).toLocaleDateString() : "N/A"}
              />
              <InfoCard label="Payment Method" value="Stripe Card Payment" />
            </div>

            {/* Patient/appointment + receipt summary */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
                  Consultation Details
                </h2>

                <div className="mt-5 space-y-4">
                  <Row
                    label="Service"
                    value="Tele-Consultation Appointment"
                  />
                  <Row
                    label="Doctor"
                    value={doctorName ? `Dr. ${doctorName}` : "Assigned Doctor"}
                  />
                  <Row
                    label="Specialty"
                    value={doctorSpecialty || "General Consultation"}
                  />
                  <Row
                    label="Status"
                    value="Payment Completed"
                    valueClass="text-emerald-600 font-bold"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-700">
                  Amount Summary
                </h2>

                <div className="mt-5 space-y-4">
                  <AmountRow
                    label="Consultation Fee"
                    value={`LKR ${consultationFee.toLocaleString()}`}
                  />
                  <AmountRow
                    label="Platform / Service Fee"
                    value={`LKR ${serviceFee.toLocaleString()}`}
                  />

                  <div className="border-t border-dashed border-slate-300 pt-4">
                    <AmountRow
                      label="Total Paid"
                      value={`LKR ${Number(amount || 0).toLocaleString()}`}
                      strong
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Security note */}
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-slate-700">
              <ShieldCheck size={18} className="mt-0.5 text-blue-600" />
              <p>
                This receipt was generated electronically by MediZen. It serves as
                a valid proof of payment and does not require a physical signature.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <button
                onClick={handleDownload}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Download size={18} />
                )}
                {loading ? "Generating PDF..." : "Download PDF"}
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-bold uppercase tracking-wider text-slate-700 transition hover:bg-slate-50"
              >
                <Printer size={18} />
                Print Receipt
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-8 py-5 text-center text-xs text-slate-500 md:px-10">
            For support, contact{" "}
            <span className="font-semibold text-slate-700">support@medizen.com</span>{" "}
            or call <span className="font-semibold text-slate-700">+94 11 234 5678</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, mono = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 break-words text-sm font-bold text-slate-800 ${
          mono ? "font-mono text-[13px]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value, valueClass = "" }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className={`text-right text-sm text-slate-800 ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

function AmountRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={`text-sm ${
          strong ? "font-extrabold text-slate-900" : "font-semibold text-slate-500"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-right ${
          strong
            ? "text-xl font-extrabold text-blue-600"
            : "text-sm font-bold text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}