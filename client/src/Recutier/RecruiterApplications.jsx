import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Briefcase,
  MapPin,
  GraduationCap,
  PlayCircle,
  Mail,
  Clock3,
  UserRound,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import "./RecruiterApplications.css";

const API_BASE = import.meta.env.VITE_API_URL;

function getAppliedTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const appliedDate = new Date(dateString);
  const diffMs = now - appliedDate;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function RecruiterApplications() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // all | shortlisted | rejected
  const [viewMode, setViewMode] = useState("all");

  useEffect(() => {
    const fetchMyJobs = async () => {
      try {
        setLoadingJobs(true);

        const res = await axios.get(`${API_BASE}/api/recruiter/my-jobs`, {
          withCredentials: true,
        });

        const list = Array.isArray(res.data) ? res.data : [];
        setJobs(list);

        if (list.length > 0) {
          setSelectedJobId(list[0]._id);
        }
      } catch (err) {
        console.error("Fetch recruiter jobs error:", err);
        alert(err.response?.data?.message || "Failed to fetch jobs");
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchMyJobs();
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setApplications([]);
      setSelectedApplicant(null);
      return;
    }

    const fetchApplications = async () => {
      try {
        setLoadingApplications(true);

        // Primary source: hybrid recommender – returns applicants already
        // ranked by relevance to *this* job (BGE-small + BM25 fusion).
        // Per product spec the recruiter view intentionally omits a
        // percentage score; only the rank order is exposed.
        let list;
        try {
          const res = await axios.get(
            `${API_BASE}/api/recommender/applicants/${selectedJobId}`,
            { withCredentials: true }
          );
          list = Array.isArray(res.data) ? res.data : [];
        } catch (recErr) {
          console.warn(
            "Recommender unavailable, falling back to plain applications list",
            recErr?.message
          );
          const res = await axios.get(
            `${API_BASE}/api/recruiter/job/${selectedJobId}/applications`,
            { withCredentials: true }
          );
          list = Array.isArray(res.data) ? res.data : [];
        }

        setApplications(list);
      } catch (err) {
        console.error("Fetch applications error:", err);
        setApplications([]);
        setSelectedApplicant(null);
        alert(err.response?.data?.message || "Failed to fetch applications");
      } finally {
        setLoadingApplications(false);
      }
    };

    fetchApplications();
  }, [selectedJobId]);

  const selectedJob = useMemo(
    () => jobs.find((job) => job._id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const allApplicants = useMemo(() => applications, [applications]);

  const visibleApplicants = useMemo(() => {
    if (viewMode === "shortlisted") {
      return allApplicants.filter((item) => item.status === "shortlisted");
    }

    if (viewMode === "rejected") {
      return allApplicants.filter((item) => item.status === "rejected");
    }

    // "all" — exclude rejected; ranking is preserved from recommender response order
    return allApplicants.filter((item) => item.status !== "rejected");
  }, [allApplicants, viewMode]);

  useEffect(() => {
    if (!visibleApplicants.length) {
      setSelectedApplicant(null);
      return;
    }

    const stillVisible = visibleApplicants.find(
      (item) => item._id === selectedApplicant?._id
    );

    if (!stillVisible) {
      setSelectedApplicant(visibleApplicants[0]);
    } else {
      setSelectedApplicant(stillVisible);
    }
  }, [viewMode, selectedJobId, applications, selectedApplicant?._id, visibleApplicants]);

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      setUpdatingStatus(true);

      const res = await axios.put(
        `${API_BASE}/api/recruiter/application/${applicationId}/status`,
        { status },
        { withCredentials: true }
      );

      const updatedApplication = res.data?.application;

      if (!updatedApplication) {
        throw new Error("Application update response missing");
      }

      setApplications((prev) =>
        prev.map((item) =>
          item._id === applicationId
            ? { ...item, status: updatedApplication.status }
            : item
        )
      );

      setSelectedApplicant((prev) =>
        prev && prev._id === applicationId
          ? { ...prev, status: updatedApplication.status }
          : prev
      );

      return true;
    } catch (err) {
      console.error("Update application status error:", err);
      alert(err.response?.data?.message || "Failed to update status");
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleShortlist = async () => {
    if (!selectedApplicant || updatingStatus) return;

    const ok = await updateApplicationStatus(
      selectedApplicant._id,
      "shortlisted"
    );

    if (!ok) return;

    if (viewMode === "shortlisted") {
      setViewMode("shortlisted");
    }
  };

  const handleReject = async () => {
    if (!selectedApplicant || updatingStatus) return;

    const currentId = selectedApplicant._id;
    const ok = await updateApplicationStatus(currentId, "rejected");
    if (!ok) return;

    const updatedApplicants = applications.map((item) =>
      item._id === currentId ? { ...item, status: "rejected" } : item
    );

    if (viewMode === "all") {
      const nextVisible = updatedApplicants.filter(
        (item) => item.status !== "rejected"
      );
      setSelectedApplicant(nextVisible[0] || null);
    } else if (viewMode === "rejected") {
      const rejectedList = updatedApplicants.filter(
        (item) => item.status === "rejected"
      );
      setSelectedApplicant(
        rejectedList.find((item) => item._id === currentId) ||
          rejectedList[0] ||
          null
      );
    } else {
      const shortlistedList = updatedApplicants.filter(
        (item) => item.status === "shortlisted"
      );
      setSelectedApplicant(shortlistedList[0] || null);
    }
  };

  const applicantProfile = selectedApplicant?.studentSnapshot || {};
  const skills = safeArray(applicantProfile.skills);
  const mainSkills = safeArray(applicantProfile.mainSkills);
  const education = safeArray(applicantProfile.education);
  const experience = safeArray(applicantProfile.experience);

  const shortlistedCount = allApplicants.filter(
    (item) => item.status === "shortlisted"
  ).length;

  const rejectedCount = allApplicants.filter(
    (item) => item.status === "rejected"
  ).length;

  const activeCount = allApplicants.filter(
    (item) => item.status !== "rejected"
  ).length;

  return (
    <div className="recruiter-applications-page">
      <div className="recruiter-applications-header">
        <div>
          <h1>Job Applicants</h1>
          <p>See who applied, review profile, intro video, education and experience.</p>
        </div>
      </div>

      <div className="applications-top-tabs">
        <button
          className={`applications-tab-btn ${viewMode === "all" ? "active" : ""}`}
          onClick={() => setViewMode("all")}
        >
          <Users size={16} />
          All Applicants ({activeCount})
        </button>

        <button
          className={`applications-tab-btn ${
            viewMode === "shortlisted" ? "active" : ""
          }`}
          onClick={() => setViewMode("shortlisted")}
        >
          <CheckCircle2 size={16} />
          Shortlisted ({shortlistedCount})
        </button>

        <button
          className={`applications-tab-btn ${
            viewMode === "rejected" ? "active" : ""
          }`}
          onClick={() => setViewMode("rejected")}
        >
          <XCircle size={16} />
          Rejected ({rejectedCount})
        </button>
      </div>

      <div className="recruiter-applications-layout">
        <div className="job-list-panel">
          <div className="panel-title">
            <Briefcase size={18} />
            <span>Your Jobs</span>
          </div>

          {loadingJobs ? (
            <div className="empty-state">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">No jobs posted yet.</div>
          ) : (
            <div className="job-list">
              {jobs.map((job) => (
                <button
                  key={job._id}
                  className={`job-list-card ${selectedJobId === job._id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedJobId(job._id);
                    setViewMode("all");
                  }}
                >
                  <h3>{job.title}</h3>
                  <p>{job.department}</p>
                  <div className="job-list-meta">
                    <span>{job.location}</span>
                    <span>{job.jobType}</span>
                  </div>
                  <div className="job-list-footer">
                    <span className={`status-badge status-${job.status}`}>
                      {job.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="applicant-list-panel">
          <div className="panel-title">
            <UserRound size={18} />
            <span>
              {viewMode === "all" &&
                `Applicants ${selectedJob ? `for ${selectedJob.title}` : ""}`}
              {viewMode === "shortlisted" &&
                `Shortlisted ${selectedJob ? `for ${selectedJob.title}` : ""}`}
              {viewMode === "rejected" &&
                `Rejected ${selectedJob ? `for ${selectedJob.title}` : ""}`}
            </span>
          </div>

          {loadingApplications ? (
            <div className="empty-state">Loading applicants...</div>
          ) : visibleApplicants.length === 0 ? (
            <div className="empty-state">
              {viewMode === "all" && "No active applicants for this job."}
              {viewMode === "shortlisted" && "No shortlisted applicants yet."}
              {viewMode === "rejected" && "No rejected applicants yet."}
            </div>
          ) : (
            <div className="applicant-list">
              {visibleApplicants.map((application, index) => {
                const snapshot = application.studentSnapshot || {};

                return (
                  <button
                    key={application._id}
                    className={`applicant-card ${
                      selectedApplicant?._id === application._id ? "active" : ""
                    }`}
                    onClick={() => setSelectedApplicant(application)}
                  >
                    <div className="applicant-top">
                      {viewMode === "all" && (
                        <span className="applicant-rank-badge">#{index + 1}</span>
                      )}
                      <img
                        src={
                          snapshot.avatar ||
                          "https://ui-avatars.com/api/?name=Student&background=random"
                        }
                        alt={snapshot.name || "Student"}
                        className="applicant-avatar"
                      />
                      <div>
                        <h3>{snapshot.name || "Student"}</h3>
                        <p>{snapshot.headline || "No headline added"}</p>
                      </div>
                    </div>

                    <div className="applicant-meta">
                      <span>
                        <MapPin size={14} />
                        {snapshot.location || "No location"}
                      </span>
                      <span>
                        <Clock3 size={14} />
                        {getAppliedTime(application.createdAt)}
                      </span>
                    </div>

                    <div className="applicant-status-row">
                      <span
                        className={`status-badge ${
                          application.status === "shortlisted"
                            ? "status-shortlisted"
                            : application.status === "rejected"
                            ? "status-rejected"
                            : application.status === "reviewing"
                            ? "status-reviewing"
                            : application.status === "selected"
                            ? "status-selected"
                            : "status-applied"
                        }`}
                      >
                        {application.status || "applied"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="applicant-detail-panel">
          <div className="panel-title">
            <BadgeCheck size={18} />
            <span>Applicant Details</span>
          </div>

          {!selectedApplicant ? (
            <div className="empty-state">Select an applicant to see full profile.</div>
          ) : (
            <div className="detail-scroll">
              <div className="detail-hero">
                <img
                  src={
                    applicantProfile.avatar ||
                    "https://ui-avatars.com/api/?name=Student&background=random"
                  }
                  alt={applicantProfile.name || "Student"}
                  className="detail-avatar"
                />
                <div className="detail-hero-text">
                  <h2>{applicantProfile.name || "Student"}</h2>
                  <p>{applicantProfile.headline || "No headline added"}</p>

                  <div className="detail-meta">
                    <span>
                      <MapPin size={15} />
                      {applicantProfile.location || "No location"}
                    </span>
                    <span>
                      <Mail size={15} />
                      {applicantProfile.email || "No email"}
                    </span>
                  </div>

                  <div className="detail-action-row">
                    <button
                      className="shortlist-btn"
                      onClick={handleShortlist}
                      disabled={
                        updatingStatus ||
                        selectedApplicant.status === "shortlisted"
                      }
                    >
                      <CheckCircle2 size={16} />
                      {selectedApplicant.status === "shortlisted"
                        ? "Shortlisted"
                        : updatingStatus
                        ? "Updating..."
                        : "Shortlist"}
                    </button>

                    <button
                      className="reject-btn"
                      onClick={handleReject}
                      disabled={
                        updatingStatus || selectedApplicant.status === "rejected"
                      }
                    >
                      <XCircle size={16} />
                      {selectedApplicant.status === "rejected"
                        ? "Rejected"
                        : updatingStatus
                        ? "Updating..."
                        : "Reject"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>About</h3>
                <p>{applicantProfile.about || "No about section added."}</p>
              </div>

              <div className="detail-section">
                <h3>Career Goal</h3>
                <p>{applicantProfile.careerGoal || "No career goal added."}</p>
              </div>

              <div className="detail-section">
                <h3>Main Skills</h3>
                <div className="chips-wrap">
                  {mainSkills.length > 0 ? (
                    mainSkills.map((item, index) => (
                      <span key={`${item}-${index}`} className="chip primary">
                        {item}
                      </span>
                    ))
                  ) : (
                    <p>No main skills added.</p>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Skills</h3>
                <div className="chips-wrap">
                  {skills.length > 0 ? (
                    skills.map((item, index) => (
                      <span key={`${item}-${index}`} className="chip">
                        {item}
                      </span>
                    ))
                  ) : (
                    <p>No skills added.</p>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Introduction Video</h3>
                {applicantProfile.introVideoUrl ? (
                  <div className="video-card">
                    <div className="video-meta">
                      <span>
                        <PlayCircle size={16} />
                        Video Available
                      </span>
                      <span>
                        {applicantProfile.introVideoDuration ||
                          "Duration not added"}
                      </span>
                    </div>

                    <a
                      href={applicantProfile.introVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="open-video-btn"
                    >
                      Open Intro Video
                    </a>
                  </div>
                ) : (
                  <p>No intro video added.</p>
                )}
              </div>

              <div className="detail-section">
                <h3>Experience / Internship</h3>
                {experience.length > 0 ? (
                  <div className="timeline-list">
                    {experience.map((item, index) => (
                      <div className="timeline-card" key={item.id || index}>
                        <div className="timeline-top">
                          <div>
                            <h4>{item.role || "Role not added"}</h4>
                            <p>{item.company || "Company not added"}</p>
                          </div>
                          <span>{item.period || ""}</span>
                        </div>
                        <p>{item.description || "No description added."}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No experience added.</p>
                )}
              </div>

              <div className="detail-section">
                <h3>Education</h3>
                {education.length > 0 ? (
                  <div className="timeline-list">
                    {education.map((item, index) => (
                      <div className="timeline-card" key={item.id || index}>
                        <div className="timeline-top">
                          <div>
                            <h4>{item.degree || "Degree not added"}</h4>
                            <p>{item.school || "School / College not added"}</p>
                          </div>
                          <span>{item.period || ""}</span>
                        </div>
                        <p>
                          <GraduationCap size={15} style={{ marginRight: 6 }} />
                          {item.grade || "Grade not added"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No education added.</p>
                )}
              </div>

              {selectedApplicant.atsResumeHtml ? (
                <div className="detail-section">
                  <h3>ATS Resume</h3>
                  <div className="resume-preview-box">
                    <iframe
                      title="ATS Resume Preview"
                      srcDoc={selectedApplicant.atsResumeHtml}
                      className="resume-frame"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}