import React, { useEffect, useState } from "react";
import axios from "axios";
import { MoreVertical, Edit, Trash2, Eye, Briefcase, MapPin, Building2, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./MyJobs.css";

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/recruiter/my-jobs`, {
        withCredentials: true,
      });
      setJobs(res.data);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this job?");
    if (!confirmDelete) return;

    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/recruiter/job/${jobId}`, {
        withCredentials: true,
      });

      alert(res.data.message);
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete job");
    }
  };

  if (loading) {
    return (
      <div className="myjobs-page">
        <div className="myjobs-container">
          <div className="loading-box">Loading jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="myjobs-page">
      <div className="myjobs-container">
        <div className="myjobs-header">
          <div className="myjobs-header-left">
            <h1>My Job Posts</h1>
            <p>Manage your active and closed job postings</p>
          </div>

          <div className="myjobs-summary">
            <p>Total Jobs</p>
            <h2>{jobs.length}</h2>
          </div>
        </div>

        <div className="jobs-grid">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job._id} className="job-card">
                <div className="job-card-top">
                  <div className="job-left">
                    <div className="job-title-row">
                      <h3 className="job-title">{job.title}</h3>
                      <span className={`job-status ${job.status}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </div>

                    <div className="job-meta">
                      <div className="job-meta-item">
                        <Building2 size={16} />
                        <span>{job.department}</span>
                      </div>

                      <div className="job-meta-item">
                        <MapPin size={16} />
                        <span>{job.location}</span>
                      </div>

                      <div className="job-meta-item">
                        <Briefcase size={16} />
                        <span>{job.jobType}</span>
                      </div>

                      <div className="job-meta-item">
                        <CalendarDays size={16} />
                        <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="job-salary">{job.salaryRange}</div>
                  </div>

                  <div className="job-actions">
                    <button className="action-btn view">
                      <Eye size={18} />
                    </button>

                    <button
                      className="action-btn edit"
                      onClick={() => navigate(`/edit-job/${job._id}`)}
                    >
                      <Edit size={18} />
                    </button>

                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(job._id)}
                    >
                      <Trash2 size={18} />
                    </button>

                    <button className="action-btn more">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-box">
              <div className="empty-icon">
                <Briefcase size={30} color="#2563eb" />
              </div>
              <h2>No jobs posted yet</h2>
              <p>You haven’t posted any jobs yet. Your posted jobs will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}