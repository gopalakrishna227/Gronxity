import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/api/admin/dashboard`, {
        withCredentials: true,
      });

      setMessage(res.data.message);
      setAdmin(res.data.admin);
    } catch (err) {
      console.log("Dashboard error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/api/admin/logout`,
        {},
        { withCredentials: true }
      );

      navigate("/admin/login");
    } catch (err) {
      console.log("Logout error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Logout failed");
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Admin Dashboard</h1>

        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}

        {admin ? (
          <div style={styles.infoBox}>
            <p><strong>ID:</strong> {admin._id}</p>
            <p><strong>Name:</strong> {admin.name}</p>
            <p><strong>Email:</strong> {admin.email}</p>
            <p><strong>Role:</strong> {admin.role}</p>
            <p><strong>Verified:</strong> {admin.isVerified ? "Yes" : "No"}</p>
            <p><strong>Created At:</strong> {new Date(admin.createdAt).toLocaleString()}</p>
          </div>
        ) : (
          <p>No admin data found</p>
        )}

        <button style={styles.button} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "500px",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    padding: "30px",
  },
  heading: {
    marginBottom: "20px",
    textAlign: "center",
    color: "#222",
  },
  success: {
    color: "green",
    marginBottom: "15px",
    textAlign: "center",
  },
  error: {
    color: "red",
    marginBottom: "15px",
    textAlign: "center",
  },
  infoBox: {
    background: "#f9fafb",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    lineHeight: "1.8",
  },
  button: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#dc3545",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
};