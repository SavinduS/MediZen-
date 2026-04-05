import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import {
  Upload,
  FileText,
  Download,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Search,
  Calendar,
} from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MedicalReports = () => {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [filterName, setFilterName] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const yearOptions = useMemo(() => {
    const years = new Set([currentYear]);
    for (const r of reports) {
      const y = new Date(r.uploadedAt).getFullYear();
      if (!Number.isNaN(y)) years.add(y);
    }
    const minY = Math.min(...years);
    const maxY = currentYear;
    const list = [];
    for (let y = maxY; y >= minY; y--) list.push(y);
    return list;
  }, [reports, currentYear]);

  /** Max month index (1–12) allowed for the selected year (no future months). */
  const maxMonthForSelectedYear = useMemo(() => {
    if (!filterYear) return 12;
    const y = Number(filterYear);
    if (y < currentYear) return 12;
    if (y > currentYear) return 0;
    return currentMonth;
  }, [filterYear, currentYear, currentMonth]);

  useEffect(() => {
    if (!filterMonth) return;
    const m = Number(filterMonth);
    if (m > maxMonthForSelectedYear) {
      setFilterMonth(maxMonthForSelectedYear > 0 ? String(maxMonthForSelectedYear) : "");
    }
  }, [filterYear, maxMonthForSelectedYear, filterMonth]);

  const filteredReports = useMemo(() => {
    const q = filterName.trim().toLowerCase();
    const ySel = filterYear ? Number(filterYear) : null;
    const mSel = filterMonth ? Number(filterMonth) : null;

    return reports.filter((r) => {
      const d = new Date(r.uploadedAt);
      if (Number.isNaN(d.getTime())) return false;

      if (q && !String(r.fileName || "").toLowerCase().includes(q)) return false;
      if (ySel !== null && d.getFullYear() !== ySel) return false;
      if (mSel !== null && d.getMonth() + 1 !== mSel) return false;
      return true;
    });
  }, [reports, filterName, filterYear, filterMonth]);

  const hasActiveFilters = Boolean(
    filterName.trim() || filterYear || filterMonth,
  );

  const clearFilters = () => {
    setFilterName("");
    setFilterYear("");
    setFilterMonth("");
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchReports = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await axios.get("http://localhost:5002/api/patient/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setToast({
        type: "error",
        message: "Could not load reports. Pull to refresh or try again shortly.",
      });
    }
  }, [getToken]);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

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
      setPatientProfile(res.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [getToken, user]);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;
    (async () => {
      setListLoading(true);
      try {
        await Promise.all([fetchReports(), fetchProfile()]);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, fetchReports, fetchProfile]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setToast({ type: "error", message: "Please choose a file to upload." });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("fileName", file.name);

      const firstName = patientProfile?.firstName || user?.firstName;
      const lastName = patientProfile?.lastName || user?.lastName;

      if (firstName) {
        formData.append("patientName", `${firstName}_${lastName || ""}`);
      }

      formData.append("report", file);

      const token = await getToken();
      await axios.post("http://localhost:5002/api/patient/reports", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      await fetchReports();
      setToast({ type: "success", message: "Report uploaded successfully." });
    } catch (error) {
      console.error("Upload failed:", error);
      setToast({
        type: "error",
        message: "Upload failed. Check the file type and try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const token = await getToken();
      await axios.delete(`http://localhost:5002/api/patient/reports/${deleteTargetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTargetId(null);
      await fetchReports();
      setToast({ type: "success", message: "Report removed." });
    } catch (error) {
      console.error("Delete failed:", error);
      setToast({ type: "error", message: "Could not delete this report. Try again." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-5 py-8 sm:py-10 pb-24">
      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] max-w-md mx-auto sm:mx-0 rounded-xl shadow-lg border px-4 py-3 flex items-start gap-3 ${
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

      {/* Delete confirmation modal */}
      {deleteTargetId && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-6 sm:p-8">
            <h2 id="delete-dialog-title" className="text-lg font-semibold text-slate-900">
              Delete this report?
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              This action cannot be undone. The file will be removed from your medical reports list.
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Deleting…
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 shadow-sm overflow-hidden mb-8 sm:mb-10">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 sm:px-8 py-6 sm:py-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300 shrink-0">
                <FileText className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Medical reports</h1>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed max-w-xl">
                  Upload PDF, JPG, or PNG files. Keep your records organized in one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload */}
      <form
        onSubmit={handleUpload}
        className="rounded-2xl border-2 border-dashed border-blue-200/90 bg-gradient-to-b from-blue-50/80 to-white p-6 sm:p-10 mb-8 sm:mb-10 shadow-sm"
      >
        <div className="flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-4">
            <Upload className="h-7 w-7" aria-hidden />
          </div>
          <p className="text-slate-800 font-semibold text-base sm:text-lg mb-1">Upload a report</p>
          <p className="text-slate-500 text-sm mb-6">PDF, JPG, or PNG — max size depends on your server settings.</p>

          <label className="w-full max-w-md cursor-pointer">
            <span className="sr-only">Choose file</span>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer file:transition-colors"
            />
          </label>

          {file && (
            <p className="mt-3 text-xs text-slate-600 truncate max-w-full px-2">
              Selected: <span className="font-medium text-slate-800">{file.name}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={uploading || !file}
            className={`mt-6 inline-flex items-center justify-center gap-2 min-h-[44px] px-8 py-2.5 rounded-xl font-semibold text-sm transition w-full sm:w-auto ${
              uploading || !file
                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" aria-hidden />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden />
                Upload report
              </>
            )}
          </button>
        </div>
      </form>

      {/* List */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex flex-wrap items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600 shrink-0" aria-hidden />
            Past reports
            <span className="text-slate-400 font-normal text-base">
              ({hasActiveFilters ? `${filteredReports.length} of ${reports.length}` : reports.length})
            </span>
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 self-start sm:self-auto"
            >
              Clear filters
            </button>
          )}
        </div>

        {!listLoading && reports.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden />
              Filter reports
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label htmlFor="report-filter-name" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Search by name
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                    aria-hidden
                  />
                  <input
                    id="report-filter-name"
                    type="search"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="File name…"
                    autoComplete="off"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="report-filter-year" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Year
                </label>
                <select
                  id="report-filter-year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full py-2.5 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                >
                  <option value="">All years</option>
                  {yearOptions.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="report-filter-month" className="block text-xs font-medium text-slate-600 mb-1.5">
                  Month
                  {filterYear && Number(filterYear) === currentYear && (
                    <span className="font-normal text-slate-400 ml-1">(up to today)</span>
                  )}
                </label>
                <select
                  id="report-filter-month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full py-2.5 px-3 text-sm border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
                >
                  <option value="">All months</option>
                  {Array.from({ length: maxMonthForSelectedYear }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={String(m)}>
                      {MONTH_NAMES[m - 1]}
                    </option>
                  ))}
                </select>
                {filterYear && Number(filterYear) === currentYear && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Future months are not available for {currentYear}.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {listLoading ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-9 w-9 text-blue-600 animate-spin mb-3" aria-hidden />
          <p className="text-slate-600 text-sm font-medium">Loading your reports…</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <AlertCircle className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-slate-600 font-medium">No reports yet</p>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Upload a file above to see it listed here.
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <Search className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-slate-600 font-medium">No reports match your filters</p>
          <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
            Try a different name, year, or month — or clear filters to see everything.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:gap-4">
          {filteredReports.map((r) => (
            <li
              key={r._id}
              className="bg-white p-4 sm:p-5 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300/80 transition flex flex-col sm:flex-row sm:items-center gap-4 justify-between group"
            >
              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <div className="bg-slate-100 p-3 rounded-xl group-hover:bg-blue-50 transition shrink-0">
                  <FileText className="text-slate-600 group-hover:text-blue-600 h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-semibold text-slate-800 truncate text-sm sm:text-base" title={r.fileName}>
                    {r.fileName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(r.uploadedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end sm:justify-start">
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 text-sm font-semibold transition"
                >
                  View
                  <Download className="h-4 w-4" aria-hidden />
                </a>
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(r._id)}
                  className="inline-flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 p-2.5 transition"
                  title="Delete report"
                  aria-label={`Delete ${r.fileName}`}
                >
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MedicalReports;
