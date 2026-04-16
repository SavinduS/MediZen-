import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminTable from "../../components/AdminTable";
import { 
  Bell, Mail, Smartphone, Loader2, RefreshCw, MessageSquare, 
  Clock, ShieldCheck
} from 'lucide-react';

export default function AdminNotifications() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prefs, setPrefs] = useState({ emailEnabled: true, smsEnabled: true });
  const [saving, setSaving] = useState(false);

  const userId = "admin_001";

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lRes, pRes] = await Promise.all([
        axios.get("http://localhost:5008/api/notifications/logs"),
        axios.get(`http://localhost:5008/api/notifications/prefs/${userId}`).catch(() => ({ data: { data: { emailEnabled: true, smsEnabled: true } } }))
      ]);
      // Sorting: Latest first
      const data = lRes.data.data || [];
      const sorted = [...data].sort((a, b) => new Date(b.sentAt || b.createdAt) - new Date(a.sentAt || a.createdAt));
      setLogs(sorted);
      if (pRes.data?.data) setPrefs(pRes.data.data);
    } catch (err) {
      setError("Notification service unreachable (Port 5008).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    setSaving(true);
    try {
      await axios.put("http://localhost:5008/api/notifications/prefs", { userId, ...newPrefs });
    } catch (err) {
      console.error("Failed to update prefs");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { 
      header: "Type", 
      render: (l) => (
        <div className={`p-2.5 rounded-xl inline-flex ${l.type === 'email' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
          {l.type === 'email' ? <Mail size={18} /> : <MessageSquare size={18} />}
        </div>
      )
    },
    { 
      header: "Recipient", 
      render: (l) => (
        <div className="text-sm font-black text-slate-900">{l.recipient || 'Patient'}</div>
      )
    },
    { 
      header: "Message Type", 
      render: (l) => <p className="text-xs font-bold text-slate-500 line-clamp-1 max-w-xs">{l.message}</p>
    },
    { 
      header: "Status", 
      render: (l) => (
        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
          l.status === 'sent' || l.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {l.status}
        </span>
      )
    },
    { 
      header: "Timestamp", 
      align: "right",
      render: (l) => (
        <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
          <Clock size={12} /> {new Date(l.sentAt || l.createdAt).toLocaleString()}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-8 p-8 h-full bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden font-sans">
      
      {/* System Status / Global Alerts Header */}
      <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#2563eb] text-white rounded-2xl">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase">System Alerts Status</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Notification Gateways</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {[
            { key: 'emailEnabled', label: 'Email Portal', icon: Mail },
            { key: 'smsEnabled', label: 'SMS Gateway', icon: MessageSquare }
          ].map(item => (
            <div key={item.key} className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
              <item.icon size={14} className={prefs[item.key] ? "text-[#2563eb]" : "text-slate-300"} />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{item.label}</span>
              <button 
                onClick={() => handleToggle(item.key)}
                className={`w-9 h-5 rounded-full transition-all relative ${prefs[item.key] ? 'bg-[#2563eb]' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${prefs[item.key] ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight uppercase">
            Dispatch Center
          </h1>
          <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-[0.2em]">Real-time Communication Audit Logs</p>
        </div>
        <button onClick={fetchData} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all border border-slate-100">
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <AdminTable 
          columns={columns} 
          data={logs} 
          loading={loading} 
          error={error} 
          onRetry={fetchData} 
          emptyMessage="No Outgoing Notifications Found"
        />
      </div>
    </div>
  );
}
