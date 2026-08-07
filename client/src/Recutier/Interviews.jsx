import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Briefcase,
  CalendarCheck,
  MapPin,
  Mail,
  Clock3,
  UserRound,
  XCircle,
  Layers,
  BadgeCheck,
  GraduationCap,
  Video,
  Phone,
  Building2,
  Link2,
  CalendarDays,
  X,
} from "lucide-react";
import "./RecruiterApplications.css";
import "./Interviews.css";

const API_BASE = import.meta.env.VITE_API_URL;

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function getAppliedTime(dateString) {
  if (!dateString) return "—";
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

const PIPELINE_STAGES = [
  { key: "shortlisted", label: "Shortlisted", color: "#3b82f6", bg: "#dbeafe" },
  { key: "selected", label: "Scheduled Interviews", color: "#10b981", bg: "#dcfce7" },
];

const MEET_TYPES = [
  { value: "video", label: "Video Call", icon: "video" },
  { value: "phone", label: "Phone Call", icon: "phone" },
  { value: "in-person", label: "In-Person", icon: "building" },
];

const EMPTY_SCHEDULE = {
  date: "",
  time: "",
  type: "video",
  link: "",
  notes: "",
};

export default function Interviews() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applications, setApplications] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeStage, setActiveStage] = useState("shortlisted");

  // Schedule-meet modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE);
  // Map of applicationId → meeting details
  const [scheduledMeetings, setScheduledMeetings] = useState({});

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

    setLoadingApps(true);
    axios
      .get(`${API_BASE}/api/recruiter/job/${selectedJobId}/applications`, {
        withCredentials: true,
      })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const pipeline = list.filter(
          (a) => a.status === "shortlisted" || a.status === "selected"
        );
        setApplications(pipeline);
        const stageApps = pipeline.filter((a) => a.status === activeStage);
        setSelectedApplicant(stageApps[0] || null);
      })
      .catch((err) => {
        console.error("Fetch applications error:", err);
        setApplications([]);
        setSelectedApplicant(null);
      })
      .finally(() => setLoadingApps(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j._id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const stageApplicants = useMemo(
    () => applications.filter((a) => a.status === activeStage),
    [applications, activeStage]
  );

  const counts = useMemo(
    () => ({
      shortlisted: applications.filter((a) => a.status === "shortlisted").length,
      selected: applications.filter((a) => a.status === "selected").length,
    }),
    [applications]
  );

  const updateStatus = async (applicationId, status) => {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await axios.put(
        `${API_BASE}/api/recruiter/application/${applicationId}/status`,
        { status },
        { withCredentials: true }
      );
      const updated = res.data?.application;
      if (updated) {
        setApplications((prev) =>
          prev
            .map((a) =>
              a._id === applicationId ? { ...a, status: updated.status } : a
            )
            .filter(
              (a) => a.status === "shortlisted" || a.status === "selected"
            )
        );
        setSelectedApplicant((prev) =>
          prev?._id === applicationId
            ? { ...prev, status: updated.status }
            : prev
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

  const activeStageInfo = PIPELINE_STAGES.find((s) => s.key === activeStage);

  return (
    <div className="recruiter-applications-page">
      <div className="recruiter-applications-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CalendarCheck size={26} color="#2563eb" />
            Interviews
          </h1>
          <p>
            Track shortlisted candidates through your interview and offer pipeline.
          </p>
        </div>

        {/* Stage tabs */}
        <div className="interview-stage-tabs">
          {PIPELINE_STAGES.map((stage) => (
            <button
              key={stage.key}
              className={`interview-stage-tab ${activeStage === stage.key ? "active" : ""}`}
              style={
                activeStage === stage.key
                  ? { background: stage.bg, color: stage.color, borderColor: stage.color }
                  : {}
              }
              onClick={() => {
                setActiveStage(stage.key);
                const first = applications.filter(
                  (a) => a.status === stage.key
                )[0];
                setSelectedApplicant(first || null);
              }}
            >
              {stage.label}
              <span className="stage-count">
                {stage.key === "shortlisted" ? counts.shortlisted : counts.selected}
              </span>
            </button>
          ))}
        </div>
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

        {/* ── Pipeline list ── */}
        <div className="applicant-list-panel">
          <div className="panel-title">
            <Layers size={18} style={{ color: activeStageInfo?.color }} />
            <span>
              {activeStageInfo?.label}
              {selectedJob ? ` — ${selectedJob.title}` : ""}
            </span>
          </div>

          {loadingApps ? (
            <div className="empty-state">Loading pipeline…</div>
          ) : stageApplicants.length === 0 ? (
            <div className="empty-state">
              No candidates in this stage yet.
            </div>
          ) : (
            <div className="applicant-list">
              {stageApplicants.map((app) => {
                const snap = app.studentSnapshot || {};
                return (
                  <button
                    key={app._id}
                    className={`applicant-card ${selectedApplicant?._id === app._id ? "active" : ""}`}
                    onClick={() => setSelectedApplicant(app)}
                  >
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

                    {snap.noticePeriod && (
                      <div className="interview-notice-chip">
                        <Clock3 size={12} />
                        Notice: {snap.noticePeriod}
                      </div>
                    )}

                    <div className="applicant-status-row">
                      <span
                        className={`status-badge status-${app.status}`}
                      >
                        {app.status}
                      </span>
                    </div>
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
            <span>Interview Details</span>
          </div>

          {!selectedApplicant ? (
            <div className="empty-state">
              Select a candidate to view details.
            </div>
          ) : (
            <div className="detail-scroll">
              {/* Interview info card */}
              <div className="interview-info-card">
                <div className="interview-info-row">
                  <Mail size={15} color="#2563eb" />
                  <div>
                    <span className="interview-info-label">Email</span>
                    <a
                      href={`mailto:${snapshot.email}`}
                      className="interview-info-value link"
                    >
                      {snapshot.email || "—"}
                    </a>
                  </div>
                </div>

                <div className="interview-info-row">
                  <Clock3 size={15} color="#7c3aed" />
                  <div>
                    <span className="interview-info-label">Notice Period</span>
                    <span className="interview-info-value">
                      {snapshot.noticePeriod || "Not specified"}
                    </span>
                  </div>
                </div>

                <div className="interview-info-row">
                  <UserRound size={15} color="#059669" />
                  <div>
                    <span className="interview-info-label">Experience</span>
                    <span className="interview-info-value">
                      {snapshot.yearsOfExperience || "Not specified"}
                    </span>
                  </div>
                </div>

                <div className="interview-info-row">
                  <MapPin size={15} color="#f59e0b" />
                  <div>
                    <span className="interview-info-label">Location</span>
                    <span className="interview-info-value">
                      {snapshot.location || "—"}
                    </span>
                  </div>
                </div>

                {safeArray(snapshot.preferredLocations).length > 0 && (
                  <div className="interview-info-row">
                    <MapPin size={15} color="#f59e0b" />
                    <div>
                      <span className="interview-info-label">
                        Preferred Locations
                      </span>
                      <span className="interview-info-value">
                        {safeArray(snapshot.preferredLocations).join(", ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="interview-actions">
                <button
                  className="schedule-meet-btn"
                  onClick={() => {
                    const existing = scheduledMeetings[selectedApplicant._id];
                    setScheduleForm(existing ? { ...existing } : { ...EMPTY_SCHEDULE });
                    setShowScheduleModal(true);
                  }}
                  disabled={updatingStatus}
                >
                  <CalendarDays size={15} />
                  {scheduledMeetings[selectedApplicant._id]
                    ? "Edit Schedule"
                    : "Schedule Meet"}
                </button>

                <button
                  className="reject-btn"
                  onClick={() =>
                    updateStatus(selectedApplicant._id, "rejected")
                  }
                  disabled={updatingStatus}
                >
                  <XCircle size={15} />
                  Remove from Pipeline
                </button>
              </div>

              {/* Scheduled meeting display */}
              {scheduledMeetings[selectedApplicant._id] && (
                <div className="scheduled-meet-card">
                  <div className="scheduled-meet-header">
                    <CalendarCheck size={16} color="#2563eb" />
                    <span>Interview Scheduled</span>
                  </div>
                  <div className="scheduled-meet-grid">
                    <div className="scheduled-meet-item">
                      <span className="interview-info-label">Date</span>
                      <span className="interview-info-value">
                        {scheduledMeetings[selectedApplicant._id].date}
                      </span>
                    </div>
                    <div className="scheduled-meet-item">
                      <span className="interview-info-label">Time</span>
                      <span className="interview-info-value">
                        {scheduledMeetings[selectedApplicant._id].time}
                      </span>
                    </div>
                    <div className="scheduled-meet-item">
                      <span className="interview-info-label">Mode</span>
                      <span className="interview-info-value" style={{ textTransform: "capitalize" }}>
                        {scheduledMeetings[selectedApplicant._id].type}
                      </span>
                    </div>
                    {scheduledMeetings[selectedApplicant._id].link && (
                      <div className="scheduled-meet-item">
                        <span className="interview-info-label">Meeting Link</span>
                        <a
                          href={scheduledMeetings[selectedApplicant._id].link}
                          target="_blank"
                          rel="noreferrer"
                          className="interview-info-value link"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                    {scheduledMeetings[selectedApplicant._id].notes && (
                      <div className="scheduled-meet-item full-width">
                        <span className="interview-info-label">Notes / Agenda</span>
                        <span className="interview-info-value">
                          {scheduledMeetings[selectedApplicant._id].notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Profile */}
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
                </div>
              </div>

              <div className="detail-section">
                <h3>About</h3>
                <p>{snapshot.about || "Not provided."}</p>
              </div>

              <div className="detail-section">
                <h3>Career Goal</h3>
                <p>{snapshot.careerGoal || "Not provided."}</p>
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
                            <h4>{p.title}</h4>
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
            </div>
          )}
        </div>
      </div>

      {/* ── Schedule Meet Modal ── */}
      {showScheduleModal && (
        <div className="schedule-modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="schedule-modal-header">
              <div className="schedule-modal-title">
                <CalendarDays size={20} color="#2563eb" />
                <h3>Schedule Interview</h3>
              </div>
              <button
                className="schedule-modal-close"
                onClick={() => setShowScheduleModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className="schedule-modal-subtitle">
              Set up interview details for{" "}
              <strong>
                {selectedApplicant?.studentSnapshot?.name || "this candidate"}
              </strong>
            </p>

            <div className="schedule-form">
              <div className="schedule-form-row">
                <div className="schedule-field">
                  <label>
                    <CalendarDays size={14} /> Date
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setScheduleForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </div>
                <div className="schedule-field">
                  <label>
                    <Clock3 size={14} /> Time
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) =>
                      setScheduleForm((f) => ({ ...f, time: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="schedule-field">
                <label>Interview Type</label>
                <div className="meet-type-group">
                  {MEET_TYPES.map((mt) => (
                    <button
                      key={mt.value}
                      type="button"
                      className={`meet-type-btn ${scheduleForm.type === mt.value ? "active" : ""}`}
                      onClick={() =>
                        setScheduleForm((f) => ({ ...f, type: mt.value }))
                      }
                    >
                      {mt.value === "video" && <Video size={14} />}
                      {mt.value === "phone" && <Phone size={14} />}
                      {mt.value === "in-person" && <Building2 size={14} />}
                      {mt.label}
                    </button>
                  ))}
                </div>
              </div>

              {scheduleForm.type === "video" && (
                <div className="schedule-field">
                  <label>
                    <Link2 size={14} /> Meeting Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={scheduleForm.link}
                    onChange={(e) =>
                      setScheduleForm((f) => ({ ...f, link: e.target.value }))
                    }
                  />
                </div>
              )}

              <div className="schedule-field">
                <label>Notes / Agenda (optional)</label>
                <textarea
                  placeholder="Topics to cover, documents to bring, etc."
                  rows={3}
                  value={scheduleForm.notes}
                  onChange={(e) =>
                    setScheduleForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="schedule-modal-footer">
              <button
                className="schedule-cancel-btn"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button
                className="schedule-confirm-btn"
                disabled={!scheduleForm.date || !scheduleForm.time}
                onClick={async () => {
                  setScheduledMeetings((prev) => ({
                    ...prev,
                    [selectedApplicant._id]: { ...scheduleForm },
                  }));
                  // Move candidate to "selected" stage when a meet is scheduled
                  if (selectedApplicant.status === "shortlisted") {
                    await updateStatus(selectedApplicant._id, "selected");
                  }
                  setShowScheduleModal(false);
                }}
              >
                <CalendarCheck size={15} />
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
