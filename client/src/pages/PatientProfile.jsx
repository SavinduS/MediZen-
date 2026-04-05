import React, { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import {
  User,
  Calendar,
  Droplets,
  AlertTriangle,
  Phone,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";

const inputClass =
  "w-full mt-1.5 px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500";

const PatientProfile = () => {
  const { getToken } = useAuth();
  const { user, isLoaded: clerkUserLoaded } = useUser();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    bloodGroup: "",
    allergies: "",
    contact: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [toast, setToast] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.imageUrl]);

  const fetchProfile = useCallback(async () => {
    setLoadError(null);
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const params = new URLSearchParams();
      if (user) {
        params.append("firstName", user.firstName || "");
        params.append("lastName", user.lastName || "");
      }

      const res = await axios.get(
        `http://localhost:5002/api/patient/profile?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.data?.clerkId) setFormData(res.data);
    } catch (err) {
      console.error(err);
      setLoadError("We could not load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getToken, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      await axios.put("http://localhost:5002/api/patient/profile", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setToast({ type: "success", message: "Profile updated successfully." });
    } catch (err) {
      console.error(err);
      setToast({
        type: "error",
        message: "Could not save your profile. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" aria-hidden />
        <p className="text-slate-600 text-sm font-medium">Loading your profile…</p>
      </div>
    );
  }

  const showClerkAvatar =
    clerkUserLoaded && user?.imageUrl && !avatarFailed;

  const initials = (() => {
    const a = (formData.firstName || user?.firstName || "").trim();
    const b = (formData.lastName || user?.lastName || "").trim();
    if (a && b) return `${a[0]}${b[0]}`.toUpperCase();
    if (a) return a.slice(0, 2).toUpperCase();
    if (b) return b.slice(0, 2).toUpperCase();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) return email.slice(0, 2).toUpperCase();
    return "";
  })();

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-5 py-8 sm:py-10 pb-16">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] max-w-md mx-auto sm:mx-0 rounded-xl border px-4 py-3 flex items-start gap-3 shadow-xl ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" aria-hidden />
          )}
          <p className="text-sm font-medium flex-1 pr-6">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 text-current opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 sm:px-8 py-6 sm:py-8 text-white">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl ring-2 ring-white/25 shadow-lg overflow-hidden bg-slate-700/80 flex items-center justify-center">
              {showClerkAvatar ? (
                <img
                  src={user.imageUrl}
                  alt="Profile photo from your connected account"
                  width={96}
                  height={96}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={() => setAvatarFailed(true)}
                />
              ) : initials ? (
                <span className="text-2xl sm:text-3xl font-bold text-blue-200 tracking-tight" aria-hidden>
                  {initials}
                </span>
              ) : (
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-blue-300" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Patient profile</h1>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                Keep your details current so your care team has accurate information.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          {loadError && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  fetchProfile();
                }}
                className="shrink-0 text-sm font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-800"
              >
                Retry
              </button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label htmlFor="firstName" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={inputClass}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={inputClass}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dob" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar className="h-4 w-4 text-slate-400" aria-hidden />
                Date of birth
              </label>
              <input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className={inputClass}
                max={today}
              />
            </div>

            <div>
              <label htmlFor="bloodGroup" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Droplets className="h-4 w-4 text-slate-400" aria-hidden />
                Blood group
              </label>
              <select
                id="bloodGroup"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className={inputClass}
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A−</option>
                <option value="B+">B+</option>
                <option value="B-">B−</option>
                <option value="O+">O+</option>
                <option value="O-">O−</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB−</option>
              </select>
            </div>

            <div>
              <label htmlFor="allergies" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <AlertTriangle className="h-4 w-4 text-amber-500/80" aria-hidden />
                Allergies
              </label>
              <textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className={`${inputClass} min-h-[100px] resize-y`}
                placeholder="e.g. Penicillin, peanuts"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="contact" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Phone className="h-4 w-4 text-slate-400" aria-hidden />
                Contact number
              </label>
              <input
                id="contact"
                type="tel"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className={inputClass}
                autoComplete="tel"
                inputMode="tel"
              />
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save profile"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
