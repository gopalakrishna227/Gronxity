import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDeletionRequests.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminDeletionRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/admin/account-deletion-requests`,
        { withCredentials: true }
      );

      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Fetch deletion requests error:", err);
      alert(err.response?.data?.message || "Failed to fetch deletion requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return <p style={{ padding: "20px" }}>Loading deletion requests...</p>;
  }

  return (
    <div className="admin-deletion-page">
      <h1>Account Deletion Requests</h1>

      <div className="admin-deletion-list">
        {requests.length === 0 ? (
          <p>No account deletion requests found.</p>
        ) : (
          requests.map((item) => (
            <div className="deletion-card" key={item._id}>
              <div className="deletion-card-top">
                <h3>{item.name || item.userId?.name || "User"}</h3>
                <span className={`deletion-status ${item.status || "pending"}`}>
                  {item.status || "pending"}
                </span>
              </div>

              <p>
                <strong>Email:</strong> {item.email}
              </p>
              <p>
                <strong>Phone:</strong> {item.phone}
              </p>
              <p>
                <strong>Reason:</strong> {item.reason}
              </p>
              <p>
                <strong>Description:</strong> {item.description || "No description"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}