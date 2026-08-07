import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminView.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminRecruiterView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recruiter, setRecruiter] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecruiter();
  }, [id]);

  const fetchRecruiter = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/recruiters/${id}`, {
        withCredentials: true,
      });
      setRecruiter(res.data.recruiter);
      setJobs(res.data.jobs || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load recruiter");
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("Delete this recruiter?");
    if (!ok) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/recruiters/${id}`, {
        withCredentials: true,
      });
      navigate("/admin/recruiters");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!recruiter) return <p className="loading">Loading...</p>;

  return (
    <div className="admin-view-page">
      <div className="view-top">
        <button onClick={() => navigate("/admin/recruiters")}>Back</button>
        <button className="delete-btn" onClick={handleDelete}>Delete Recruiter</button>
      </div>

      <div className="profile-card">
        <h2>{recruiter.name}</h2>
        <p><strong>Email:</strong> {recruiter.email}</p>
        <p><strong>Company:</strong> {recruiter.company}</p>
        <p><strong>Role:</strong> {recruiter.role}</p>

        <h3>Posted Jobs</h3>
        {jobs.length === 0 ? (
          <p>No jobs found</p>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="info-box">
              <p><strong>Title:</strong> {job.title}</p>
              <p><strong>Department:</strong> {job.department}</p>
              <p><strong>Status:</strong> {job.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}