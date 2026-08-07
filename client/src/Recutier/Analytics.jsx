import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Users,
  Target,
  Star,
  TrendingUp,
  Briefcase,
  XCircle,
  Eye,
  MapPin,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./Analytics.css";

const API = import.meta.env.VITE_API_URL;

const STATUS_COLORS = {
  applied: "#6366f1",
  reviewing: "#f59e0b",
  shortlisted: "#3b82f6",
  selected: "#10b981",
  rejected: "#ef4444",
};

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

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/api/recruiter/dashboard-stats`, { withCredentials: true })
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error("Dashboard error:", err);
        setError(err.response?.data?.message || "Failed to load analytics");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading analytics…</div>;
  }

  if (error) {
    return <div className="dashboard-loading" style={{ color: "#ef4444" }}>{error}</div>;
  }

  const funnelData = [
    { stage: "Applied", count: stats.totalApplications },
    { stage: "Reviewing", count: stats.reviewing },
    { stage: "Shortlisted", count: stats.shortlisted },
    { stage: "Selected", count: stats.selected },
    { stage: "Rejected", count: stats.rejected },
  ];

  const pieData = [
    { name: "Applied", value: stats.totalApplications - stats.reviewing - stats.shortlisted - stats.selected - stats.rejected },
    { name: "Reviewing", value: stats.reviewing },
    { name: "Shortlisted", value: stats.shortlisted },
    { name: "Selected", value: stats.selected },
    { name: "Rejected", value: stats.rejected },
  ].filter((d) => d.value > 0);

  const recentApps = Array.isArray(stats.recentApplications)
    ? stats.recentApplications
    : [];

  return (
    <div className="recruiter-dashboard">
      <div className="recruiter-dashboard-container">

        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <h1>Analytics</h1>
            <p>Hiring pipeline overview across all your jobs</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-card-text">
                <h4>Total Applications</h4>
                <h2>{stats.totalApplications}</h2>
                <p className="kpi-trend">Across {stats.totalJobs} jobs</p>
              </div>
              <div className="kpi-icon-box kpi-icon-blue">
                <Users size={20} />
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-card-text">
                <h4>AI Processed</h4>
                <h2>{stats.aiMatches}</h2>
                <p className="kpi-trend">Hybrid ranked</p>
              </div>
              <div className="kpi-icon-box kpi-icon-purple">
                <Target size={20} />
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-card-text">
                <h4>Shortlisted</h4>
                <h2>{stats.shortlisted}</h2>
                <p className="kpi-trend">
                  {stats.totalApplications > 0
                    ? `${Math.round((stats.shortlisted / stats.totalApplications) * 100)}% rate`
                    : "—"}
                </p>
              </div>
              <div className="kpi-icon-box kpi-icon-green">
                <Star size={20} />
              </div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-card-top">
              <div className="kpi-card-text">
                <h4>Selected / Hired</h4>
                <h2>{stats.selected}</h2>
                <p className="kpi-trend">
                  {stats.publishedJobs} active jobs
                </p>
              </div>
              <div className="kpi-icon-box kpi-icon-orange">
                <TrendingUp size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, marginBottom: 24 }}>
          {/* Funnel bar chart */}
          <div className="dashboard-card" style={{ margin: 0 }}>
            <h2>Hiring Funnel</h2>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 13 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                    {funnelData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          STATUS_COLORS[entry.stage.toLowerCase()] || "#6366f1"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status pie */}
          <div className="dashboard-card" style={{ margin: 0 }}>
            <h2>Status Breakdown</h2>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          STATUS_COLORS[entry.name.toLowerCase()] || "#6366f1"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span style={{ fontSize: 12, color: "#374151" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent applications table */}
        <div className="table-card">
          <div className="section-head">
            <h2>Recent Applications</h2>
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              Last {recentApps.length} across all jobs
            </span>
          </div>

          {recentApps.length === 0 ? (
            <div className="dashboard-empty">No applications yet.</div>
          ) : (
            <div className="table-wrapper">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Job</th>
                    <th>Location</th>
                    <th>Applied</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApps.map((app) => {
                    const snap = app.studentSnapshot || {};
                    return (
                      <tr key={app._id}>
                        <td>
                          <div className="table-user">
                            <img
                              src={
                                snap.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(snap.name || "S")}&background=random&size=42`
                              }
                              alt={snap.name}
                            />
                            <div>
                              <span style={{ display: "block" }}>
                                {snap.name || "Student"}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#6b7280",
                                  fontWeight: 400,
                                }}
                              >
                                {snap.headline || ""}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Briefcase size={14} color="#6366f1" />
                            {app.jobTitle || "—"}
                          </div>
                          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                            {app.jobDepartment}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
                            <MapPin size={13} color="#9ca3af" />
                            {snap.location || "—"}
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {getAppliedTime(app.appliedAt)}
                        </td>
                        <td>
                          <span
                            className={`status-badge status-${app.status || "applied"}`}
                          >
                            {app.status || "applied"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
