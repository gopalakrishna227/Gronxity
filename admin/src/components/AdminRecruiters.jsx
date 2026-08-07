import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminList.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminRecruiters() {
  const [recruiters, setRecruiters] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/recruiters`, {
        withCredentials: true,
      });
      setRecruiters(res.data.recruiters || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load recruiters");
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this recruiter?");
    if (!ok) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/recruiters/${id}`, {
        withCredentials: true,
      });
      setRecruiters((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="admin-list-page">
      <div className="top-bar">
        <h2>All Recruiters</h2>
        <button onClick={() => navigate("/admin/dashboard")}>Back</button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="list-grid">
        {recruiters.map((recruiter) => (
          <div className="list-card" key={recruiter._id}>
            <h3>{recruiter.name}</h3>
            <p>{recruiter.email}</p>
            <p>{recruiter.company}</p>

            <div className="card-actions">
              <button onClick={() => navigate(`/admin/recruiters/${recruiter._id}`)}>
                View
              </button>
              <button className="delete-btn" onClick={() => handleDelete(recruiter._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}