import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Building2,
  Mail,
  Phone,
  Lock,
  Save,
  ShieldCheck,
} from "lucide-react";
import "./Setting.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function Settings() {
  const [form, setForm] = useState({
    company: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    fetchRecruiterSettings();
  }, []);

  const fetchRecruiterSettings = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API_BASE}/api/recruiter/settings`, {
        withCredentials: true,
      });

      const recruiter = res.data?.recruiter || {};

      setForm({
        company: recruiter.company || "",
        email: recruiter.email || "",
        phone: recruiter.phone || "",
      });
    } catch (err) {
      console.error("Fetch recruiter settings error:", err);
      setMessage(err.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      setSavingProfile(true);

      const res = await axios.put(
        `${API_BASE}/api/recruiter/settings`,
        {
          company: form.company,
          email: form.email,
          phone: form.phone,
        },
        { withCredentials: true }
      );

      setMessage(res.data?.message || "Settings updated successfully");
    } catch (err) {
      console.error("Update recruiter settings error:", err);
      setMessage(err.response?.data?.message || "Failed to update settings");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage("");

    try {
      setSavingPassword(true);

      const res = await axios.put(
        `${API_BASE}/api/recruiter/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        },
        { withCredentials: true }
      );

      setPasswordMessage(res.data?.message || "Password changed successfully");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Recruiter change password error:", err);
      setPasswordMessage(
        err.response?.data?.message || "Failed to change password"
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="recruiter-settings-loading">Loading settings...</div>;
  }

  return (
    <div className="recruiter-settings-page">
      <div className="recruiter-settings-container">
        <div className="recruiter-settings-header">
          <h1>Recruiter Settings</h1>
          <p>Update your company, email, phone number and password.</p>
        </div>

        <div className="recruiter-settings-grid">
          <div className="settings-card">
            <div className="card-title-row">
              <ShieldCheck size={20} />
              <h2>Account Information</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="settings-form">
              <div className="settings-field">
                <label>Company Name</label>
                <div className="input-wrap">
                  <Building2 size={18} />
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleProfileChange}
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>Email ID</label>
                <div className="input-wrap">
                  <Mail size={18} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleProfileChange}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>Phone Number</label>
                <div className="input-wrap">
                  <Phone size={18} />
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {message && <p className="settings-message">{message}</p>}

              <button
                type="submit"
                className="settings-save-btn"
                disabled={savingProfile}
              >
                <Save size={18} />
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="settings-card">
            <div className="card-title-row">
              <Lock size={20} />
              <h2>Change Password</h2>
            </div>

            <form onSubmit={handleChangePassword} className="settings-form">
              <div className="settings-field">
                <label>Current Password</label>
                <div className="input-wrap">
                  <Lock size={18} />
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>New Password</label>
                <div className="input-wrap">
                  <Lock size={18} />
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div className="settings-field">
                <label>Confirm New Password</label>
                <div className="input-wrap">
                  <Lock size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {passwordMessage && (
                <p className="settings-message">{passwordMessage}</p>
              )}

              <button
                type="submit"
                className="settings-save-btn"
                disabled={savingPassword}
              >
                <Save size={18} />
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}