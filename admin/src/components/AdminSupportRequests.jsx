import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminSupportRequests.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminSupportRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/admin/support-requests`, {
        withCredentials: true,
      });
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Fetch support requests error:", err);
      alert(err.response?.data?.message || "Failed to fetch support requests");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${API_BASE}/api/admin/support-requests/${id}/status`,
        { status },
        { withCredentials: true }
      );

      fetchRequests();
    } catch (err) {
      console.error("Update status error:", err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) return <p style={{ padding: "20px" }}>Loading support requests...</p>;

  return (
    <div className="admin-support-page">
      <h1>Help & Support Requests</h1>

      <div className="admin-support-list">
        {requests.length === 0 ? (
          <p>No support requests found.</p>
        ) : (
          requests.map((item) => (
            <div className="support-card" key={item._id}>
              <div className="support-top">
                <h3>{item.name || "Student"}</h3>
                <span className={`status-badge ${item.status}`}>{item.status}</span>
              </div>

              <p><strong>Email:</strong> {item.email}</p>
              <p><strong>Phone:</strong> {item.phone}</p>
              <p><strong>Message:</strong> {item.message}</p>
              <p><strong>Date:</strong> {new Date(item.createdAt).toLocaleString()}</p>

              <div className="support-actions">
                <button onClick={() => updateStatus(item._id, "new")}>New</button>
                <button onClick={() => updateStatus(item._id, "in-progress")}>In Progress</button>
                <button onClick={() => updateStatus(item._id, "resolved")}>Resolved</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}