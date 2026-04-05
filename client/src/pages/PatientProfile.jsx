import React, { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";

const PatientProfile = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    bloodGroup: "",
    allergies: "",
    contact: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = await getToken();
    // Pass clerk name as query params to sync automatically
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
    if (res.data.clerkId) setFormData(res.data);
    setLoading(false);
  }, [getToken, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = await getToken();
    await axios.put("http://localhost:5002/api/patient/profile", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("Profile Updated Successfully!");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border mt-10">
      <h2 className="text-2xl font-bold mb-6">Patient Profile</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full border p-2 rounded mt-1"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Date of Birth</label>
          <input
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            className="w-full border p-2 rounded mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Blood Group</label>
          <select
            value={formData.bloodGroup}
            onChange={(e) =>
              setFormData({ ...formData, bloodGroup: e.target.value })
            }
            className="w-full border p-2 rounded mt-1"
          >
            <option value="">Select</option>
            <option value="A+">A+</option>
            <option value="O+">O+</option>
            <option value="B+">B+</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Allergies</label>
          <textarea
            value={formData.allergies}
            onChange={(e) =>
              setFormData({ ...formData, allergies: e.target.value })
            }
            className="w-full border p-2 rounded mt-1"
            placeholder="e.g. Penicillin, Peanuts"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Contact Number</label>
          <input
            type="text"
            value={formData.contact}
            onChange={(e) =>
              setFormData({ ...formData, contact: e.target.value })
            }
            className="w-full border p-2 rounded mt-1"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default PatientProfile;
