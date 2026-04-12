import React, { useState } from "react";
import { BellRing, Save, ShieldAlert, Mail, Smartphone, Radio } from "lucide-react";

export default function AdminNotifications() {
  const [prefs, setPrefs] = useState({
    emailEnabled: true,
    smsEnabled: false,
    broadcastEnabled: true,
  });
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
        setSaving(false);
        alert("Notification preferences updated for all system users.");
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <BellRing className="text-blue-600" size={32} />
          Notification Settings
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Manage global notification channels and system broadcasts.</p>
      </div>

      <div className="rounded-[32px] bg-white shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <h2 className="text-xl font-bold relative z-10 flex items-center gap-3">
                <ShieldAlert className="text-blue-400" size={24} />
                Global Preferences
            </h2>
            <p className="text-slate-400 text-sm mt-1.5 font-medium relative z-10">Configure default notification behaviors across the MediZen platform.</p>
        </div>

        <div className="p-8 space-y-6">
          {[
            { id: 'emailEnabled', title: 'Email Notifications', desc: 'Send automated appointment reminders and verification emails.', icon: Mail },
            { id: 'smsEnabled', title: 'SMS Gateway', desc: 'Deliver critical alerts and OTP codes via mobile network.', icon: Smartphone },
            { id: 'broadcastEnabled', title: 'System Broadcasts', desc: 'Allow global announcements to appear in user dashboard feeds.', icon: Radio }
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-all shadow-sm">
                    <item.icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{item.desc}</p>
                </div>
              </div>
              <button 
                onClick={() => toggle(item.id)}
                className={`w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner ${prefs[item.id] ? "bg-blue-600" : "bg-slate-200"}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${prefs[item.id] ? "left-7" : "left-1"}`}></div>
              </button>
            </div>
          ))}
          
          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700 shadow-lg shadow-blue-900/10 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              <Save size={18} />
              {saving ? "Saving Changes..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 flex gap-4">
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl h-fit shadow-sm border border-amber-200/50">
            <ShieldAlert size={20} />
          </div>
          <div>
              <h4 className="font-bold text-amber-800 text-sm">Caution: Global Changes</h4>
              <p className="text-xs text-amber-700 font-medium mt-1 leading-relaxed">
                  Changing these settings affects all users across the platform immediately. 
                  Ensure you have verified system capacity before enabling high-volume gateways.
              </p>
          </div>
      </div>
    </div>
  );
}
