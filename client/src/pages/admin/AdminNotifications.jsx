import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminSidebar from "../../components/AdminSidebar";
import { Bell, Mail, Smartphone, Save, History, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

export default function AdminNotifications() {
  const [prefs, setPrefs] = useState({ emailEnabled: true, smsEnabled: false });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const userId = "admin_001"; // Mock Admin ID

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, hRes] = await Promise.all([
        axios.get(`http://localhost:5008/notifications/prefs/${userId}`),
        axios.get(`http://localhost:5008/notifications/${userId}`)
      ]);
      if (pRes.data) setPrefs(pRes.data);
      setHistory(hRes.data);
    } catch (err) {
      console.error("Fetch error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      await axios.put('http://localhost:5008/notifications/prefs', { userId, ...prefs });
      setMsg({ type: 'success', text: 'Settings Saved Successfully' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Update Failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar />
      <main className="flex-grow ml-72 p-12">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4 tracking-tight">
                <Bell className="text-blue-600" size={44} /> Notifications
              </h1>
              <p className="text-slate-400 font-bold mt-2 uppercase text-[10px] tracking-[0.2em]">System Communication Hub</p>
            </div>
            <button onClick={fetchData} className="p-4 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-colors">
              <RefreshCw size={20} />
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-12">
                <h3 className="text-xl font-black text-slate-800 mb-10 flex items-center gap-3">
                  <Smartphone size={24} className="text-blue-600" /> Preferences
                </h3>
                <div className="space-y-8">
                  {[{ k: 'emailEnabled', l: 'Email Portal', i: <Mail size={20}/> },
                    { k: 'smsEnabled', l: 'SMS Gateway', i: <Smartphone size={20}/> }].map((c) => (
                    <div key={c.k} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl transition-colors ${prefs[c.k] ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {c.i}
                        </div>
                        <span className="font-black text-slate-600 text-xs uppercase tracking-widest">{c.l}</span>
                      </div>
                      <button onClick={() => setPrefs({...prefs, [c.k]: !prefs[c.k]})} className={`w-12 h-7 rounded-full transition-all relative ${prefs[c.k] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 bg-white w-5 h-5 rounded-full transition-all ${prefs[c.k] ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={handleSave} disabled={saving} className="w-full mt-12 py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} {saving ? 'Saving...' : 'Update Settings'}
                </button>

                {msg.text && <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black uppercase text-center ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <History size={24} className="text-blue-600" /> Dispatch Logs
                  </h3>
                  <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest">History</span>
                </div>
                <div className="overflow-y-auto max-h-[600px]">
                  {loading ? <div className="p-32 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></div> :
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em]">
                          <th className="px-10 py-6">Status</th>
                          <th className="px-10 py-6">Activity</th>
                          <th className="px-10 py-6">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {history.map((log) => (
                          <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-10 py-6"><CheckCircle size={18} className="text-emerald-500" /></td>
                            <td className="px-10 py-6 text-sm font-bold text-slate-700">{log.logMessage}</td>
                            <td className="px-10 py-6 text-xs text-slate-400 font-bold uppercase tracking-tighter">{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
