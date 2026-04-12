import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { initiatePayment } from "../services/api";

const PaymentCheckout = () => {
  const { appointmentId } = useParams();
  const location = useLocation();
  const { user } = useUser();
  const navigate = useNavigate();

  // appointment details optional: can be passed from previous page using navigate(..., { state: {...} })
  const appointmentDetails = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // fallback values if no state is passed
  const patientId = appointmentDetails.patientId || user?.id || "PATIENT001";
  const doctorName = appointmentDetails.doctorName || "Dr. John Doe";
  const appointmentDate = appointmentDetails.date || "2026-04-10";
  const appointmentTime = appointmentDetails.time || "10:30 AM";
  const amount = appointmentDetails.amount || 2500;
  const paymentMethod = "card";

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        appointmentId,
        patientId,
        amount,
        paymentMethod,
        email: user?.primaryEmailAddress?.emailAddress || appointmentDetails.email,
        phone: user?.primaryPhoneNumber?.phoneNumber || appointmentDetails.phone
      };

      const response = await initiatePayment(payload);
      const data = response.data;

      // For demo purposes, we redirect back to our own status page with success=true
      // In a real Stripe integration, this would be the Stripe Checkout URL
      const mockCheckoutUrl = `${window.location.origin}/payment-status?success=true&paymentId=${data.payment.paymentId}`;
      
      // Simulate gateway redirect
      window.location.href = mockCheckoutUrl;
    } catch (err) {
      console.error("Payment initiation failed:", err);
      setError(
        err.response?.data?.message || "Failed to initiate payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Payment Checkout
        </h1>

        <div className="space-y-4 border rounded-xl p-6 bg-gray-50">
          <div className="flex justify-between border-b pb-3">
            <span className="font-medium text-gray-600">Appointment ID</span>
            <span className="text-gray-800">{appointmentId}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-medium text-gray-600">Patient ID</span>
            <span className="text-gray-800">{patientId}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-medium text-gray-600">Doctor</span>
            <span className="text-gray-800">{doctorName}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-medium text-gray-600">Date</span>
            <span className="text-gray-800">{appointmentDate}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-medium text-gray-600">Time</span>
            <span className="text-gray-800">{appointmentTime}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="font-medium text-gray-600">Payment Method</span>
            <span className="text-gray-800 capitalize">{paymentMethod}</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-lg font-semibold text-gray-700">Total Amount</span>
            <span className="text-2xl font-bold text-green-600">
              LKR {amount.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-5 bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleCancel}
            className="w-full sm:w-1/2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 rounded-xl transition"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handlePayment}
            className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Processing Payment..." : "Pay Now"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Secure payment processing for your appointment.
        </p>
      </div>
    </div>
  );
};

export default PaymentCheckout;