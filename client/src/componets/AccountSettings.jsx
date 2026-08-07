import { useEffect, useState } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Lock,
  Phone,
  Trash2,
} from "lucide-react";
import "./AccountSettings.css";

const API_BASE = import.meta.env.VITE_API_URL;

const deleteReasons = [
  "I found a better platform",
  "I have privacy concerns",
  "I get too many notifications",
  "I am not using this account anymore",
  "Other",
];

export default function AccountSettings() {
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [deleteForm, setDeleteForm] = useState({
    reason: "",
    description: "",
    email: "",
    phone: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/student/dashboard`, {
        withCredentials: true,
      });

      const student = res.data.user || res.data.student || {};

      setProfileForm({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
      });

      setDeleteForm((prev) => ({
        ...prev,
        email: student.email || "",
        phone: student.phone || "",
      }));
    } catch (err) {
      console.error("Fetch student profile error:", err);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
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

  const handleDeleteChange = (e) => {
    const { name, value } = e.target;
    setDeleteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profileForm.name || !profileForm.email || !profileForm.phone) {
      alert("Please fill all profile fields");
      return;
    }

    try {
      setLoadingProfile(true);

      const res = await axios.put(
        `${API_BASE}/api/student/account-settings`,
        profileForm,
        { withCredentials: true }
      );

      alert(res.data.message || "Profile updated successfully");
    } catch (err) {
      console.error("Profile update error:", err);
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      alert("Please fill all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New password and confirm password do not match");
      return;
    }

    try {
      setLoadingPassword(true);

      const res = await axios.put(
        `${API_BASE}/api/student/change-password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        { withCredentials: true }
      );

      alert(res.data.message || "Password changed successfully");

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password change error:", err);
      alert(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleDeleteRequestSubmit = async (e) => {
    e.preventDefault();

    if (!deleteForm.reason || !deleteForm.email || !deleteForm.phone) {
      alert("Reason, email, and phone number are required");
      return;
    }

    try {
      setLoadingDelete(true);

      const res = await axios.post(
        `${API_BASE}/api/student/account-deletion-request`,
        deleteForm,
        { withCredentials: true }
      );

      alert(res.data.message || "Deletion request sent successfully");

      setDeleteForm((prev) => ({
        ...prev,
        reason: "",
        description: "",
      }));
    } catch (err) {
      console.error("Deletion request error:", err);
      alert(err.response?.data?.message || "Failed to send deletion request");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="account-settings-page">
      <div className="account-settings-card">
        <div className="account-settings-header">
          <h1>Account Settings</h1>
          <p>Manage your profile details, password, and account deletion request.</p>
        </div>

        <div className="account-settings-sections">
          <form className="account-section" onSubmit={handleProfileSubmit}>
            <div className="section-title-wrap">
              <h2>Profile Information</h2>
              <p>Update your name, email, and phone number directly.</p>
            </div>

            <div className="input-group">
              <label>
                <User size={18} />
                <span>Name</span>
              </label>
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="input-group">
              <label>
                <Mail size={18} />
                <span>Email ID</span>
              </label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="input-group">
              <label>
                <Phone size={18} />
                <span>Phone Number</span>
              </label>
              <input
                type="text"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="Enter your phone number"
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loadingProfile}>
              {loadingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <form className="account-section" onSubmit={handlePasswordSubmit}>
            <div className="section-title-wrap">
              <h2>Change Password</h2>
              <p>Update your password securely.</p>
            </div>

            <div className="input-group">
              <label>
                <Lock size={18} />
                <span>Current Password</span>
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
              />
            </div>

            <div className="input-group">
              <label>
                <Lock size={18} />
                <span>New Password</span>
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
              />
            </div>

            <div className="input-group">
              <label>
                <Lock size={18} />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loadingPassword}>
              {loadingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>

          <form className="account-section danger-section" onSubmit={handleDeleteRequestSubmit}>
            <div className="section-title-wrap">
              <h2>Account Deletion Request</h2>
              <p>
                Send a deletion request to admin. Your account will not be deleted
                immediately.
              </p>
            </div>

            <div className="input-group">
              <label>
                <Trash2 size={18} />
                <span>Select Reason</span>
              </label>
              <select
                name="reason"
                value={deleteForm.reason}
                onChange={handleDeleteChange}
              >
                <option value="">Select a reason</option>
                {deleteReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>
                <Trash2 size={18} />
                <span>Description</span>
              </label>
              <textarea
                name="description"
                rows="5"
                value={deleteForm.description}
                onChange={handleDeleteChange}
                placeholder="Write your reason in detail..."
              />
            </div>

            <div className="input-group">
              <label>
                <Mail size={18} />
                <span>Email ID</span>
              </label>
              <input
                type="email"
                name="email"
                value={deleteForm.email}
                onChange={handleDeleteChange}
                placeholder="Enter your email"
              />
            </div>

            <div className="input-group">
              <label>
                <Phone size={18} />
                <span>Phone Number</span>
              </label>
              <input
                type="text"
                name="phone"
                value={deleteForm.phone}
                onChange={handleDeleteChange}
                placeholder="Enter your phone number"
              />
            </div>

            <button type="submit" className="danger-btn" disabled={loadingDelete}>
              {loadingDelete ? "Sending..." : "Send Deletion Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}