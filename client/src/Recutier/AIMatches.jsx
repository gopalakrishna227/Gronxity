import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Briefcase,
  Sparkles,
  MapPin,
  Clock3,
  UserRound,
  BadgeCheck,
  CheckCircle2,
  Mail,
  GraduationCap,
  Trophy,
  Zap,
  Brain,
} from "lucide-react";
import "./RecruiterApplications.css";
import "./AIMatches.css";

const API_BASE = import.meta.env.VITE_API_URL;

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function getAppliedTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const d = new Date(dateString);
  const diffMs = now - d;
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#b45309", "#6366f1", "#10b981"];

export default function AIMatches() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applications, setApplications] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [indexReady, setIndexReady] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/recruiter/my-jobs`, { withCredentials: true })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setJobs(list);
        if (list.length > 0) setSelectedJobId(list[0]._id);
      })
      .catch((err) => console.error("Fetch jobs error:", err))
      .finally(() => setLoadingJobs(false));
  }, []);

  useEffect(() => {
    if (!selectedJobId) {
      setApplications([]);
      setSelectedApplicant(null);
      return;
    }

    const fetch = async () => {
      setLoadingApplicants(true);
      try {
        const res = await axios.get(
          `${API_BASE}/api/recommender/applicants/${selectedJobId}`,
          { withCredentials: true }
        );
        const list = Array.isArray(res.data) ? res.data : [];
        setApplications(list);
        setSelectedApplicant(list[0] || null);
        setIndexReady(true);
      } catch (err) {
        console.warn("Recommender fallback:", err?.message);
        setIndexReady(false);
        try {
          const res = await axios.get(
            `${API_BASE}/api/recruiter/job/${selectedJobId}/applications`,
            { withCredentials: true }
          );
          const list = Array.isArray(res.data) ? res.data : [];
          setApplications(list);
          setSelectedApplicant(list[0] || null);
        } catch {
          setApplications([]);
          setSelectedApplicant(null);
        }
      } finally {
        setLoadingApplicants(false);
      }
    };

    fetch();
  }, [selectedJobId]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j._id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const handleShortlist = async (applicationId) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await axios.put(
        `${API_BASE}/api/recruiter/application/${applicationId}/status`,
        { status: "shortlisted" },
        { withCredentials: true }
      );
      const updated = res.data?.application;
      if (updated) {
        setApplications((prev) =>
          prev.map((a) =>
            a._id === applicationId ? { ...a, status: updated.status } : a
          )
        );
        setSelectedApplicant((prev) =>
          prev?._id === applicationId ? { ...prev, status: updated.status } : prev
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const snapshot = selectedApplicant?.studentSnapshot || {};
  const skills = safeArray(snapshot.skills);
  const mainSkills = safeArray(snapshot.mainSkills);
  const experience = safeArray(snapshot.experience);
  const education = safeArray(snapshot.education);
  const projects = safeArray(snapshot.projects);

  return (
    <div className="recruiter-applications-page">
      <div className="recruiter-applications-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Brain size={26} color="#7c3aed" />
            AI Matches
          </h1>
          <p>
            Candidates ranked by hybrid AI (semantic embeddings + keyword
            relevance) for each job.
          </p>
        </div>

        {!indexReady && (
          <div className="ai-index-warning">
            <Zap size={15} />
            AI index warming up — showing unranked results
          </div>
        )}
      </div>

      <div className="recruiter-applications-layout">
        {/* ── Job list ── */}
        <div className="job-list-panel">
          <div className="panel-title">
            <Briefcase size={18} />
            <span>Your Jobs</span>
          </div>

          {loadingJobs ? (
            <div className="empty-state">Loading jobs…</div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">No jobs posted yet.</div>
          ) : (
            <div className="job-list">
              {jobs.map((job) => (
                <button
                  key={job._id}
                  className={`job-list-card ${selectedJobId === job._id ? "active" : ""}`}
                  onClick={() => setSelectedJobId(job._id)}
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

        {/* ── Ranked applicant list ── */}
        <div className="applicant-list-panel">
          <div className="panel-title">
            <Sparkles size={18} color="#7c3aed" />
            <span>
              AI Ranked{selectedJob ? ` — ${selectedJob.title}` : ""}
            </span>
          </div>

          {loadingApplicants ? (
            <div className="empty-state">Ranking candidates…</div>
          ) : applications.length === 0 ? (
            <div className="empty-state">No applicants for this job yet.</div>
          ) : (
            <div className="applicant-list">
              {applications.map((app, idx) => {
                const snap = app.studentSnapshot || {};
                const isSelected = selectedApplicant?._id === app._id;
                const rankColor = RANK_COLORS[idx] || "#6366f1";

                return (
                  <button
                    key={app._id}
                    className={`applicant-card ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedApplicant(app)}
                  >
                    <div className="ai-rank-row">
                      <span
                        className="ai-rank-badge"
                        style={{ background: rankColor }}
                      >
                        #{idx + 1}
                      </span>
                      <span className={`status-badge status-${app.status || "applied"}`}>
                        {app.status || "applied"}
                      </span>
                    </div>

                    <div className="applicant-top">
                      <img
                        src={
                          snap.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(snap.name || "S")}&background=random&size=64`
                        }
                        alt={snap.name}
                        className="applicant-avatar"
                      />
                      <div>
                        <h3>{snap.name || "Student"}</h3>
                        <p>{snap.headline || "No headline"}</p>
                      </div>
                    </div>

                    <div className="applicant-meta">
                      <span>
                        <MapPin size={13} />
                        {snap.location || "—"}
                      </span>
                      <span>
                        <Clock3 size={13} />
                        {getAppliedTime(app.createdAt)}
                      </span>
                    </div>

                    {safeArray(snap.mainSkills).length > 0 && (
                      <div className="chips-wrap" style={{ marginTop: 6 }}>
                        {safeArray(snap.mainSkills)
                          .slice(0, 3)
                          .map((s, i) => (
                            <span key={i} className="chip primary">
                              {s}
                            </span>
                          ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Detail panel ── */}
        <div className="applicant-detail-panel">
          <div className="panel-title">
            <BadgeCheck size={18} />
            <span>Candidate Profile</span>
          </div>

          {!selectedApplicant ? (
            <div className="empty-state">
              Select a candidate to see their full profile.
            </div>
          ) : (
            <div className="detail-scroll">
              {/* Rank highlight */}
              {applications.indexOf(selectedApplicant) >= 0 && (
                <div className="ai-rank-hero">
                  <Trophy
                    size={18}
                    color={
                      RANK_COLORS[applications.indexOf(selectedApplicant)] ||
                      "#6366f1"
                    }
                  />
                  <span>
                    AI Rank{" "}
                    <strong>
                      #{applications.indexOf(selectedApplicant) + 1}
                    </strong>{" "}
                    of {applications.length}
                  </span>
                  {indexReady && (
                    <span className="ai-powered-tag">
                      <Sparkles size={12} /> AI Powered
                    </span>
                  )}
                </div>
              )}

              <div className="detail-hero">
                <img
                  src={
                    snapshot.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(snapshot.name || "S")}&background=random&size=128`
                  }
                  alt={snapshot.name}
                  className="detail-avatar"
                />
                <div className="detail-hero-text">
                  <h2>{snapshot.name || "Student"}</h2>
                  <p>{snapshot.headline || "No headline"}</p>

                  <div className="detail-meta">
                    <span>
                      <MapPin size={14} />
                      {snapshot.location || "—"}
                    </span>
                    <span>
                      <Mail size={14} />
                      {snapshot.email || "—"}
                    </span>
                    {snapshot.noticePeriod && (
                      <span>
                        <Clock3 size={14} />
                        Notice: {snapshot.noticePeriod}
                      </span>
                    )}
                    {snapshot.yearsOfExperience && (
                      <span>
                        <UserRound size={14} />
                        {snapshot.yearsOfExperience} exp
                      </span>
                    )}
                  </div>

                  <div className="detail-action-row">
                    {selectedApplicant.status === "shortlisted" ? (
                      <button className="shortlist-btn" disabled>
                        <CheckCircle2 size={15} />
                        Shortlisted
                      </button>
                    ) : (
                      <button
                        className="shortlist-btn outline"
                        onClick={() => handleShortlist(selectedApplicant._id)}
                        disabled={updatingStatus}
                      >
                        <CheckCircle2 size={15} />
                        {updatingStatus ? "Saving…" : "Shortlist"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>About</h3>
                <p>{snapshot.about || "No about section."}</p>
              </div>

              <div className="detail-section">
                <h3>Career Goal</h3>
                <p>{snapshot.careerGoal || "Not specified."}</p>
              </div>

              {mainSkills.length > 0 && (
                <div className="detail-section">
                  <h3>Main Skills</h3>
                  <div className="chips-wrap">
                    {mainSkills.map((s, i) => (
                      <span key={i} className="chip primary">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skills.length > 0 && (
                <div className="detail-section">
                  <h3>All Skills</h3>
                  <div className="chips-wrap">
                    {skills.map((s, i) => (
                      <span key={i} className="chip">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {projects.length > 0 && (
                <div className="detail-section">
                  <h3>Projects</h3>
                  <div className="timeline-list">
                    {projects.map((p, i) => (
                      <div key={i} className="timeline-card">
                        <div className="timeline-top">
                          <div>
                            <h4>{p.title || "Project"}</h4>
                            <p style={{ fontSize: 13, color: "#6b7280" }}>
                              {p.techStack}
                            </p>
                          </div>
                        </div>
                        <p>{p.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {experience.length > 0 && (
                <div className="detail-section">
                  <h3>Experience</h3>
                  <div className="timeline-list">
                    {experience.map((e, i) => (
                      <div key={i} className="timeline-card">
                        <div className="timeline-top">
                          <div>
                            <h4>{e.role}</h4>
                            <p>{e.company}</p>
                          </div>
                          <span>{e.period}</span>
                        </div>
                        <p>{e.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {education.length > 0 && (
                <div className="detail-section">
                  <h3>Education</h3>
                  <div className="timeline-list">
                    {education.map((e, i) => (
                      <div key={i} className="timeline-card">
                        <div className="timeline-top">
                          <div>
                            <h4>{e.degree}</h4>
                            <p>{e.school}</p>
                          </div>
                          <span>{e.period}</span>
                        </div>
                        <p>
                          <GraduationCap size={14} style={{ marginRight: 5 }} />
                          {e.grade}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplicant.atsResumeHtml && (
                <div className="detail-section">
                  <h3>ATS Resume</h3>
                  <div className="resume-preview-box">
                    <iframe
                      title="ATS Resume"
                      srcDoc={selectedApplicant.atsResumeHtml}
                      className="resume-frame"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
