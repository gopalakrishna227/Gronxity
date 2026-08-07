import { useState } from "react";
import axios from "axios";
import "./HelpSupport.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function HelpSupport() {
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.phone || !formData.email || !formData.message) {
      alert("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/api/student/help-support`,
        formData,
        { withCredentials: true }
      );

      alert(res.data.message || "Support request sent successfully");

      setFormData({
        phone: "",
        email: "",
        message: "",
      });
    } catch (err) {
      console.error("Help support error:", err);
      alert(err.response?.data?.message || "Failed to send support request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="help-support-page">
      <div className="help-support-card">
        <h1>Help & Support</h1>
        <p>Share your issue and our team will contact you.</p>

        <form onSubmit={handleSubmit} className="help-support-form">
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Gmail / Email ID"
            value={formData.email}
            onChange={handleChange}
          />

          <textarea
            name="message"
            rows="6"
            placeholder="How can we help you?"
            value={formData.message}
            onChange={handleChange}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}