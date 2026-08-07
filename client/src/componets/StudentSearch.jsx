import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Search, X, UserPlus, Check, Trash2, Bell, UserCheck, UserMinus } from "lucide-react";
import "./StudentSearch.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function StudentSearch() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents("");
    fetchIncomingRequests();
  }, []);

  const filteredStudents = useMemo(() => students || [], [students]);

  const fetchStudents = async (searchText) => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${API_BASE}/api/student/search?query=${encodeURIComponent(searchText)}`,
        { withCredentials: true }
      );

      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Search students error:", err);
      alert(err.response?.data?.message || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomingRequests = async () => {
    try {
      setRequestLoading(true);

      const res = await axios.get(`${API_BASE}/api/student/requests/incoming`, {
        withCredentials: true,
      });

      const data = Array.isArray(res.data) ? res.data : [];
      setIncomingRequests(data);
      setRequestCount(data.length);
    } catch (err) {
      console.error("Fetch incoming requests error:", err);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchStudents(value);
  };

  const clearSearch = () => {
    setQuery("");
    fetchStudents("");
  };

  const handleConnect = async (studentId) => {
    try {
      const res = await axios.post(
        `${API_BASE}/api/student/request/${studentId}`,
        {},
        { withCredentials: true }
      );

      setStudents((prev) =>
        prev.map((student) =>
          student._id === studentId
            ? { ...student, isRequested: true }
            : student
        )
      );

      alert(res.data.message || "Connection request sent");
    } catch (err) {
      console.error("Send request error:", err);
      alert(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleRemoveConnection = async (studentId) => {
    try {
      const res = await axios.delete(
        `${API_BASE}/api/student/connection/${studentId}`,
        { withCredentials: true }
      );

      setStudents((prev) =>
        prev.map((student) =>
          student._id === studentId
            ? { ...student, isConnected: false, isRequested: false }
            : student
        )
      );

      alert(res.data.message || "Connection removed");
    } catch (err) {
      console.error("Remove connection error:", err);
      alert(err.response?.data?.message || "Failed to remove connection");
    }
  };

  const handleAcceptRequest = async (requestId, senderId) => {
    try {
      setActionLoadingId(requestId);

      const res = await axios.put(
        `${API_BASE}/api/student/request/accept/${requestId}`,
        {},
        { withCredentials: true }
      );

      setIncomingRequests((prev) => prev.filter((item) => item._id !== requestId));
      setRequestCount((prev) => Math.max(prev - 1, 0));

      setStudents((prev) =>
        prev.map((student) =>
          student._id === senderId
            ? { ...student, isConnected: true, isRequested: false }
            : student
        )
      );

      alert(res.data.message || "Request accepted");
    } catch (err) {
      console.error("Accept request error:", err);
      alert(err.response?.data?.message || "Failed to accept request");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setActionLoadingId(requestId);

      const res = await axios.put(
        `${API_BASE}/api/student/request/reject/${requestId}`,
        {},
        { withCredentials: true }
      );

      setIncomingRequests((prev) => prev.filter((item) => item._id !== requestId));
      setRequestCount((prev) => Math.max(prev - 1, 0));

      alert(res.data.message || "Request rejected");
    } catch (err) {
      console.error("Reject request error:", err);
      alert(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoadingId("");
    }
  };

  const renderActionButton = (student) => {
    if (student.isConnected) {
      return (
        <button
          type="button"
          className="search-connected-btn"
          onClick={() => handleRemoveConnection(student._id)}
        >
          <UserMinus size={16} />
          <span>Connected</span>
        </button>
      );
    }

    if (student.isRequested) {
      return (
        <button type="button" className="search-requested-btn" disabled>
          <UserCheck size={16} />
          <span>Requested</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        className="search-follow-btn"
        onClick={() => handleConnect(student._id)}
      >
        <UserPlus size={16} />
        <span>Connect</span>
      </button>
    );
  };

  return (
    <>
      <div className="student-search-page">
        <div className="student-search-panel">
          <div className="student-search-topbar">
            <h2 className="student-search-heading">Search</h2>

            <button
              type="button"
              className="request-icon-btn"
              onClick={() => setRequestDrawerOpen(true)}
              title="Incoming requests"
            >
              <Bell size={20} />
              {requestCount > 0 && (
                <span className="request-badge">
                  {requestCount > 99 ? "99+" : requestCount}
                </span>
              )}
            </button>
          </div>

          <div className="search-box-wrap">
            <Search size={18} className="search-box-icon" />
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={handleSearch}
              className="search-box-input"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={clearSearch}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="search-results-list">
            {loading ? (
              <p className="search-state-text">Loading students...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="search-state-text">No students found</p>
            ) : (
              filteredStudents.map((student) => (
                <div className="search-user-row" key={student._id}>
                  <div
                    className="search-user-main"
                    onClick={() => navigate(`/student/profile/${student._id}`)}
                  >
                    <img
                      src={
                        student.profileImage && student.profileImage.trim() !== ""
                          ? student.profileImage
                          : student.avatar && student.avatar.trim() !== ""
                          ? student.avatar
                          : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt={student.name}
                      className="search-user-avatar"
                    />

                    <div className="search-user-info">
                      <h3>{student.name}</h3>
                      <p>{student.headline || "Student profile"}</p>
                      <span>{student.location || "Location not added"}</span>
                    </div>
                  </div>

                  {renderActionButton(student)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div
        className={`request-drawer-overlay ${
          requestDrawerOpen ? "drawer-open" : ""
        }`}
        onClick={() => setRequestDrawerOpen(false)}
      >
        <div
          className={`request-drawer ${requestDrawerOpen ? "drawer-open" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="request-drawer-header">
            <h3>Follow Requests</h3>
            <button
              type="button"
              className="request-drawer-close"
              onClick={() => setRequestDrawerOpen(false)}
            >
              <X size={22} />
            </button>
          </div>

          <div className="request-drawer-body">
            {requestLoading ? (
              <p className="drawer-state-text">Loading requests...</p>
            ) : incomingRequests.length === 0 ? (
              <p className="drawer-state-text">No incoming requests</p>
            ) : (
              incomingRequests.map((request) => {
                const sender = request.sender || {};
                const isLoading = actionLoadingId === request._id;

                return (
                  <div className="request-user-row" key={request._id}>
                    <div
                      className="request-user-main"
                      onClick={() => navigate(`/student/profile/${sender._id}`)}
                    >
                      <img
                        src={
                          sender.profileImage && sender.profileImage.trim() !== ""
                            ? sender.profileImage
                            : sender.avatar && sender.avatar.trim() !== ""
                            ? sender.avatar
                            : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt={sender.name || "Student"}
                        className="request-user-avatar"
                      />

                      <div className="request-user-info">
                        <h4>{sender.name || "Student"}</h4>
                        <p>{sender.headline || "requested to connect with you"}</p>
                      </div>
                    </div>

                    <div className="request-action-buttons">
                      <button
                        type="button"
                        className="request-confirm-btn"
                        onClick={() => handleAcceptRequest(request._id, sender._id)}
                        disabled={isLoading}
                      >
                        <Check size={16} />
                        <span>{isLoading ? "..." : "Accept"}</span>
                      </button>

                      <button
                        type="button"
                        className="request-delete-btn"
                        onClick={() => handleRejectRequest(request._id)}
                        disabled={isLoading}
                      >
                        <Trash2 size={16} />
                        <span>{isLoading ? "..." : "Reject"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}