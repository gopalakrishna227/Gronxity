import React, { useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./ReportUser.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function ReportUser() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state || {};

  const reportedUserId = state.reportedUserId || state.profileId || "";
  const conversationId = state.conversationId || "";
  const reportedUserName = state.reportedUserName || "User";

  const [reason, setReason] = useState("Spam");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = useMemo(
    () => [
      "Spam",
      "Abusive language",
      "Fake profile",
      "Harassment",
      "Inappropriate content",
      "Other",
    ],
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reportedUserId) {
      alert("Reported user not found");
      return;
    }

    if (!description.trim()) {
      alert("Please enter description");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${API_BASE}/api/student/report-user`,
        {
          reportedUserId,
          profileId: reportedUserId,
          conversationId,
          reason,
          description: `${reason}: ${description.trim()}`,
        },
        { withCredentials: true }
      );

      alert("User reported successfully");
      navigate(-1);
    } catch (err) {
      console.error("Report user error:", err);
      alert(err.response?.data?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-user-page">
      <div className="report-user-card">
        <h2>Report User</h2>
        <p>
          You are reporting: <strong>{reportedUserName}</strong>
        </p>

        <form onSubmit={handleSubmit} className="report-user-form">
          <label>Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {reasons.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <label>Description</label>
          <textarea
            rows="6"
            placeholder="Explain the issue clearly..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="report-user-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}