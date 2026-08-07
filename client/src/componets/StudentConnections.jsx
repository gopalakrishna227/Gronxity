import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Search, X, UserMinus } from "lucide-react";
import "./StudentConnections.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function StudentConnections() {
  const [query, setQuery] = useState("");
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/student/connections`, {
        withCredentials: true,
      });
      setConnections(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch connections error:", err);
      alert(err.response?.data?.message || "Failed to fetch connections");
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return connections;

    return connections.filter((item) => {
      const name = item.name?.toLowerCase() || "";
      const headline = item.headline?.toLowerCase() || "";
      const location = item.location?.toLowerCase() || "";
      return (
        name.includes(text) ||
        headline.includes(text) ||
        location.includes(text)
      );
    });
  }, [connections, query]);

  const handleRemoveConnection = async (studentId) => {
    try {
      setRemovingId(studentId);

      const res = await axios.delete(
        `${API_BASE}/api/student/connection/${studentId}`,
        { withCredentials: true }
      );

      setConnections((prev) => prev.filter((item) => item._id !== studentId));
      alert(res.data.message || "Connection removed");
    } catch (err) {
      console.error("Remove connection error:", err);
      alert(err.response?.data?.message || "Failed to remove connection");
    } finally {
      setRemovingId("");
    }
  };

  return (
    <div className="student-connections-page">
      <div className="student-connections-card">
        <div className="student-connections-header">
          <h2>Connections</h2>
          <span>{connections.length}</span>
        </div>

        <div className="student-connections-search">
          <Search size={18} className="student-connections-search-icon" />
          <input
            type="text"
            placeholder="Find connection"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              className="student-connections-clear"
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {loading ? (
          <p className="student-connections-state">Loading connections...</p>
        ) : filteredConnections.length === 0 ? (
          <p className="student-connections-state">No connections found</p>
        ) : (
          <div className="student-connections-list">
            {filteredConnections.map((person) => (
              <div className="student-connection-row" key={person._id}>
                <div
                  className="student-connection-left"
                  onClick={() => navigate(`/student/profile/${person._id}`)}
                >
                  <img
                    src={
                      person.profileImage && person.profileImage.trim() !== ""
                        ? person.profileImage
                        : person.avatar && person.avatar.trim() !== ""
                        ? person.avatar
                        : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt={person.name}
                    className="student-connection-avatar"
                  />

                  <div className="student-connection-info">
                    <h3>{person.name || "Student"}</h3>
                    <p>{person.headline || "Connected with you"}</p>
                    <span>{person.location || "Location not added"}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="student-remove-connection-btn"
                  onClick={() => handleRemoveConnection(person._id)}
                  disabled={removingId === person._id}
                >
                  <UserMinus size={16} />
                  <span>
                    {removingId === person._id ? "Removing..." : "Remove"}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}