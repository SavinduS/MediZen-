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
  Lock, ShieldCheck, Activity, Info, Stethoscope, ChevronLeft, AlertTriangle
} from 'lucide-react';

/**
 * 🛠️ FINAL SYNCHRONIZED STRIPE CONFIG
 * Account ID: 51THJgGKz
 */
const PUBLISHABLE_KEY = "pk_test_51THJgGKzjX8XBXb9BbGFygfFM2fHHgeJMhDKuUX9EAaqXPyz1nwZA3g06lJUVIpdJaum9cInGZ1OCsIOvaL8bLO700oVflXnp4";
const stripePromise = loadStripe(PUBLISHABLE_KEY);

const CheckoutForm = ({ totalAmount, appointmentId, doctorName, doctorSpecialty }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // Get logged-in user email from localStorage (or your auth state)
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem("user"));
      } catch (e) {}
      const email = user?.email || "";
      const phone = user?.phone || "";

      // 1. Create Intent using your backend API
      const { data } = await axios.post('http://localhost:5007/api/payments/create-intent', {
        amount: totalAmount,
        appointmentId: appointmentId || "APT-SYNCED",
        patientId: user?.id || "user_123",
        email,
        phone
      });

      // 2. Confirm Payment using the returned clientSecret
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: { name: user?.name || 'Test Patient' }
        }
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
      } else if (result.paymentIntent.status === 'succeeded') {
        // 3. Finalize on backend to trigger RabbitMQ Notifications
        await axios.post(`http://localhost:5007/api/payments/${data.paymentId}/complete`);
        
        navigate('/payment-status', { 
            state: { status: 'success', transactionId: result.paymentIntent.id, amount: totalAmount, paymentId: data.paymentId } 
        });
      }
    } catch (err) {
      setError("Payment synchronization failed. Ensure Backend Secret Key matches the Frontend Publishable Key.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Card Number</label>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-inner focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <CardNumberElement options={{ ...baseStyle, showIcon: true }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Expiry Date</label>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-inner focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <CardExpiryElement options={baseStyle} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">CVC</label>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-inner focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <CardCvcElement options={baseStyle} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
          <Info size={14} /> {error}
        </div>
      )}

      <div className="pt-4">
        <button type="submit" disabled={loading || !stripe} 
          className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Lock size={16} /> <span>Confirm Payment</span></>
          )}
        </button>
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-tighter">SECURE SSL ENCRYPTED CONNECTION</span>
        </div>
      </div>
    </form>
  );
};

export default function PaymentCheckout() {
  const location = useLocation();
  const { doctorName = "Anuradha Jayathilaka", doctorSpecialty = "Cardiologist", amount = 2000, appointmentId } = location.state || {};
  const totalAmount = Number(amount) + 500;

  return (
    <div className="h-[calc(100vh-160px)] w-full bg-slate-50 flex items-center justify-center font-sans overflow-hidden">
      <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl flex overflow-hidden border border-slate-100 h-[600px]">
        
        {/* Left: Summary Panel */}
        <div className="w-5/12 bg-white p-12 border-r-2 border-blue-50 flex flex-col justify-between">
          <div className="space-y-10">
            <div className="flex items-center gap-3 text-blue-600">
              <Activity size={32} />
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Payment Summary</h2>
            </div>
            
            <div className="space-y-8">
              <div className="p-5 rounded-2xl bg-blue-50/30 border border-blue-100/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Assigning Doctor</p>
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white rounded-full text-blue-600 shadow-md border border-blue-50">
                    <Stethoscope size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-800 tracking-tight uppercase">Dr. {doctorName}</p>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">{doctorSpecialty}</p>
                  </div>
                </div>
              </div>

              <div className="px-2 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                  <span className="uppercase tracking-wider">Consultation</span>
                  <span className="text-slate-800">LKR {amount}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-400">
                  <span className="uppercase tracking-wider">Service Fee</span>
                  <span className="text-slate-800">LKR 500</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t-2 border-slate-50 p-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Payable</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter uppercase text-blue-600">LKR {totalAmount}</p>
          </div>
        </div>

        {/* Right: Payment Panel */}
        <div className="w-7/12 p-16 flex flex-col justify-center bg-white">
          <div className="mb-12">
            <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Payment Details</h1>
            <p className="text-sm text-slate-400 font-medium leading-relaxed tracking-tight">Complete your booking securely using Stripe Elements.</p>
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
