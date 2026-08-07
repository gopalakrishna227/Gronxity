import React, { useEffect, useState } from "react";
import axios from "axios";
import "./StudentRequests.css";

export default function StudentRequests() {
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incoming");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const incomingRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/requests/incoming`,
        { withCredentials: true }
      );

      const outgoingRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/requests/outgoing`,
        { withCredentials: true }
      );

      setIncomingRequests(incomingRes.data || []);
      setOutgoingRequests(outgoingRes.data || []);
    } catch (err) {
      console.error("Fetch requests error:", err);
      alert(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/student/request/accept/${requestId}`,
        {},
        { withCredentials: true }
      );

      alert(res.data.message || "Request accepted");
      fetchRequests();
    } catch (err) {
      console.error("Accept request error:", err);
      alert(err.response?.data?.message || "Failed to accept request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/student/request/reject/${requestId}`,
        {},
        { withCredentials: true }
      );

      alert(res.data.message || "Request rejected");
      fetchRequests();
    } catch (err) {
      console.error("Reject request error:", err);
      alert(err.response?.data?.message || "Failed to reject request");
    }
  };

  if (loading) {
    return <div className="requests-loading">Loading requests...</div>;
  }

  return (
    <div className="requests-page">
      <div className="requests-card">
        <h2 className="requests-title">Friend Requests</h2>

        <div className="requests-tabs">
          <button
            className={activeTab === "incoming" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("incoming")}
          >
            Incoming
          </button>

          <button
            className={activeTab === "outgoing" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("outgoing")}
          >
            Outgoing
          </button>
        </div>

        {activeTab === "incoming" && (
          <div className="requests-list">
            {incomingRequests.length === 0 ? (
              <p className="empty-text">No incoming requests</p>
            ) : (
              incomingRequests.map((request) => (
                <div className="request-item" key={request._id}>
                  <img
                    src={
                      request.sender?.profileImage ||
                      "https://via.placeholder.com/60"
                    }
                    alt="profile"
                    className="request-avatar"
                  />

                  <div className="request-info">
                    <h3>{request.sender?.name}</h3>
                    <p>{request.sender?.headline || "No headline"}</p>
                    <span>{request.sender?.email}</span>
                  </div>

                  <div className="request-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleAccept(request._id)}
                    >
                      Accept
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() => handleReject(request._id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "outgoing" && (
          <div className="requests-list">
            {outgoingRequests.length === 0 ? (
              <p className="empty-text">No outgoing requests</p>
            ) : (
              outgoingRequests.map((request) => (
                <div className="request-item" key={request._id}>
                  <img
                    src={
                      request.receiver?.profileImage ||
                      "https://via.placeholder.com/60"
                    }
                    alt="profile"
                    className="request-avatar"
                  />

                  <div className="request-info">
                    <h3>{request.receiver?.name}</h3>
                    <p>{request.receiver?.headline || "No headline"}</p>
                    <span>{request.receiver?.email}</span>
                  </div>

                  <div className="request-actions">
                    <button className="pending-btn">Pending</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}