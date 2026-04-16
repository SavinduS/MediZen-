import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  Lock, ShieldCheck, Activity, Stethoscope, AlertTriangle, Info
} from 'lucide-react';

const PUBLISHABLE_KEY = "pk_test_51THJgGKzjX8XBXb9BbGFygfFM2fHHgeJMhDKuUX9EAaqXPyz1nwZA3g06lJUVIpdJaum9cInGZ1OCsIOvaL8bLO700oVflXnp4";
const stripePromise = loadStripe(PUBLISHABLE_KEY);

const CheckoutForm = ({ totalAmount, appointmentId, doctorName, doctorSpecialty }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardholderName, setCardholderName] = useState("");

  const baseStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1e293b',
        fontFamily: 'Inter, sans-serif',
        '::placeholder': { color: '#94a3b8' },
      },
      invalid: { color: '#ef4444' },
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || loading) return;
    setLoading(true);
    setError(null);

    try {
      let user = JSON.parse(localStorage.getItem("user") || "{}");
      const { data } = await axios.post('http://localhost:5007/api/payments/create-intent', {
        amount: totalAmount,
        appointmentId: appointmentId || "APT-SYNCED",
        patientId: user?.id || "user_123",
        patientName: user?.name || cardholderName || "Valued Patient",
        doctorName: doctorName || "Dr. Sanath Gunawardena",
        email: user?.email || "",
        phone: user?.phone || "",
        cardholderName
      });

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: { name: cardholderName || user?.name || "Patient" }
        }
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else if (result.paymentIntent.status === 'succeeded') {
        const completeRes = await axios.post(`http://localhost:5007/api/payments/${data.paymentId}/complete`);
        navigate('/payment-status', {
          state: {
            status: 'success',
            amount: totalAmount,
            paymentId: data.paymentId,
            referenceNumber: completeRes.data.payment.referenceNumber
          }
        });
      }
    } catch (err) {
      setError("Payment synchronization failed. Check connection.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Cardholder Name</label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            className="w-full py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            required
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block ml-1">Card Details</label>
          <div className="py-4 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <CardNumberElement options={{ ...baseStyle, showIcon: true }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="py-4 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <CardExpiryElement options={baseStyle} />
          </div>
          <div className="py-4 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <CardCvcElement options={baseStyle} />
          </div>
        </div>
      </div>

      <button type="submit" disabled={loading || !stripe} 
        className="w-full py-4 bg-[#2563eb] text-white text-lg font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 hover:shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
      >
        {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock size={20} /> <span>Pay LKR {totalAmount.toLocaleString()}</span></>}
      </button>
      
      <div className="flex items-center justify-center gap-2 opacity-70 pt-2">
        <ShieldCheck size={16} className="text-emerald-500" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Secure SSL Encrypted Connection</span>
      </div>
    </form>
  );
};

export default function PaymentCheckout() {
  const location = useLocation();
  const { doctorName = "Sanath Gunawardena", doctorSpecialty = "Cardiology", amount = 3000, appointmentId } = location.state || {};
  const totalAmount = Number(amount) + 500;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans overflow-hidden">
      <div className="w-full max-w-4xl min-h-[540px] bg-white rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-100">
        
        {/* Left: Summary Panel */}
        <div className="md:w-1/2 bg-slate-50/80 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
          <div className="space-y-8">
            <div className="flex items-center gap-3 text-[#2563eb]">
              <Activity size={24} />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#1e293b]">Order Summary</h2>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-[#2563eb] shadow-inner">
                <Stethoscope size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1e293b]">Dr. {doctorName}</h3>
                <p className="text-sm font-bold text-[#2563eb] uppercase tracking-widest mt-1">{doctorSpecialty}</p>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-wider">
                <span>Consultation Fee</span>
                <span className="text-[#1e293b]">LKR {amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-400 uppercase tracking-wider">
                <span>Service Fee</span>
                <span className="text-[#1e293b]">LKR 500</span>
              </div>
              <div className="h-px bg-slate-200 my-2"></div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-black text-[#1e293b] uppercase tracking-tighter">Total Amount</span>
                <span className="text-3xl font-black text-[#2563eb]">LKR {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-white/50 p-4 rounded-2xl border border-slate-200/50">
            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Your payment is processed securely. A digital receipt will be generated immediately upon successful transaction.
            </p>
          </div>
        </div>

        {/* Right: Payment Panel */}
        <div className="md:w-1/2 p-10 bg-white">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#1e293b] uppercase tracking-tighter mb-2">Payment</h1>
            <p className="text-sm text-slate-400 font-medium tracking-tight">Enter your card details to finalize the appointment.</p>
          </div>
          
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              totalAmount={totalAmount} 
              appointmentId={appointmentId}
              doctorName={doctorName} 
              doctorSpecialty={doctorSpecialty} 
            />
          </Elements>
        </div>

      </div>
    </div>
  );
}
