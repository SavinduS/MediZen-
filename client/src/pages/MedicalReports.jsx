import React, { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { Upload, FileText, Download, Loader2, Trash2 } from "lucide-react";

const MedicalReports = () => {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const [file, setFile] = useState(null);
  const [reports, setReports] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);

  // 1. Wrap fetchReports in useCallback to fix the dependency error
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
    }
  }, [getToken]);

  const fetchProfile = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // Ensure name is synced on this page too
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

  // 2. The useEffect now correctly depends on fetchReports and isLoaded
  useEffect(() => {
    if (isLoaded) {
      fetchReports();
      fetchProfile();
    }
  }, [isLoaded, fetchReports, fetchProfile]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      
      // Move metadata before file for better Multer compatibility
      formData.append("fileName", file.name);

      // Use profile from DB if it has name, otherwise use Clerk user
      const firstName = patientProfile?.firstName || user?.firstName;
      const lastName = patientProfile?.lastName || user?.lastName;

      if (firstName) {
        formData.append("patientName", `${firstName}_${lastName}`);
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
      // Reset the file input field manually
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

      // Refresh the list
      await fetchReports();
      alert("Report uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
      const token = await getToken();
      await axios.delete(`http://localhost:5002/api/patient/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchReports();
      alert("Report deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">
        My Medical Reports
      </h2>

      {/* Upload Section */}
      <form
        onSubmit={handleUpload}
        className="bg-blue-50 border-2 border-dashed border-blue-200 p-10 rounded-2xl text-center mb-10"
      >
        <Upload className="mx-auto text-blue-500 mb-4" size={48} />
        <p className="text-blue-700 font-medium mb-4">
          Upload PDF, JPG or PNG reports
        </p>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4 block mx-auto text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
        />

        <button
          type="submit"
          disabled={uploading || !file}
          className={`flex items-center justify-center gap-2 mx-auto px-8 py-2 rounded-lg font-semibold transition ${
            uploading || !file
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={20} /> Uploading...
            </>
          ) : (
            "Upload Report"
          )}
        </button>
      </form>

      {/* List Section */}
      <h3 className="text-xl font-bold mb-4 text-slate-700 flex items-center gap-2">
        <FileText size={20} /> Past Reports ({reports.length})
      </h3>

      {reports.length === 0 ? (
        <div className="text-center py-10 text-slate-400 bg-white border rounded-xl">
          No reports uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r) => (
            <div
              key={r._id}
              className="bg-white p-4 border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition flex justify-between items-center group"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-blue-50 transition">
                  <FileText className="text-slate-500 group-hover:text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 truncate max-w-[150px] md:max-w-[200px]">
                    {r.fileName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(r.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-md transition"
                >
                  View <Download size={14} />
                </a>
                <button
                  onClick={() => handleDelete(r._id)}
                  className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-md transition"
                  title="Delete Report"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalReports;
