import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminView.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminJobView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/jobs/${id}`, {
        withCredentials: true,
      });
      setJob(res.data.job);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load job");
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("Delete this job?");
    if (!ok) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/jobs/${id}`, {
        withCredentials: true,
      });
      navigate("/admin/jobs");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!job) return <p className="loading">Loading...</p>;

  return (
    <div className="admin-view-page">
      <div className="view-top">
        <button onClick={() => navigate("/admin/jobs")}>Back</button>
        <button className="delete-btn" onClick={handleDelete}>Delete Job</button>
      </div>

      <div className="profile-card">
        <h2>{job.title}</h2>
        <p><strong>Department:</strong> {job.department}</p>
        <p><strong>Location:</strong> {job.location}</p>
        <p><strong>Job Type:</strong> {job.jobType}</p>
        <p><strong>Experience Level:</strong> {job.experienceLevel}</p>
        <p><strong>Salary:</strong> {job.salaryRange}</p>
        <p><strong>Status:</strong> {job.status}</p>
        <p><strong>Description:</strong> {job.description}</p>

        <h3>Recruiter</h3>
        <p>{job.recruiterId?.name}</p>
        <p>{job.recruiterId?.email}</p>
        <p>{job.recruiterId?.company}</p>

        <h3>Skills</h3>
        <div className="tag-wrap">
          {(job.skills || []).map((skill, index) => (
            <span key={index} className="tag">{skill}</span>
          ))}
        </div>
      </div>
    </div>
  );
}