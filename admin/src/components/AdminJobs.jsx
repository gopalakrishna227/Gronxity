import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminList.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/jobs`, {
        withCredentials: true,
      });
      setJobs(res.data.jobs || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load jobs");
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this job?");
    if (!ok) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/jobs/${id}`, {
        withCredentials: true,
      });
      setJobs((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="admin-list-page">
      <div className="top-bar">
        <h2>All Jobs</h2>
        <button onClick={() => navigate("/admin/dashboard")}>Back</button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="list-grid">
        {jobs.map((job) => (
          <div className="list-card" key={job._id}>
            <h3>{job.title}</h3>
            <p>{job.department}</p>
            <p>{job.location}</p>
            <p>Status: {job.status}</p>
            <p>Recruiter: {job.recruiterId?.name || "N/A"}</p>

            <div className="card-actions">
              <button onClick={() => navigate(`/admin/jobs/${job._id}`)}>
                View
              </button>
              <button className="delete-btn" onClick={() => handleDelete(job._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}