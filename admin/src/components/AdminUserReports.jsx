import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminUserReports.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminUserReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/user-reports`, {
        withCredentials: true,
      });
      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Fetch reports error:", err);
      alert(err.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${API_BASE}/api/admin/user-reports/${id}/status`,
        { status },
        { withCredentials: true }
      );
      fetchReports();
    } catch (err) {
      console.error("Update report status error:", err);
      alert(err.response?.data?.message || "Failed to update report status");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <p style={{ padding: "20px" }}>Loading reports...</p>;

  return (
    <div className="admin-reports-page">
      <h1>Blocked / Reported User Requests</h1>

      <div className="admin-reports-list">
        {reports.length === 0 ? (
          <p>No user reports found.</p>
        ) : (
          reports.map((item) => (
            <div className="admin-report-card" key={item._id}>
              <div className="admin-report-top">
                <h3>{item.reporterName || "Student"}</h3>
                <span className={`report-status ${item.status}`}>
                  {item.status}
                </span>
              </div>

              <p><strong>Reporter Email:</strong> {item.reporterEmail}</p>
              <p><strong>Profile ID:</strong> {item.profileId}</p>
              <p><strong>Description:</strong> {item.description}</p>
              <p><strong>Date:</strong> {new Date(item.createdAt).toLocaleString()}</p>

              <div className="admin-report-actions">
                <button onClick={() => updateStatus(item._id, "pending")}>
                  Pending
                </button>
                <button onClick={() => updateStatus(item._id, "reviewed")}>
                  Reviewed
                </button>
                <button onClick={() => updateStatus(item._id, "action-taken")}>
                  Action Taken
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}