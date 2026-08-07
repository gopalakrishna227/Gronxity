import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./AdminLogin.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await axios.post(`${API_BASE}/api/admin/login`, form, {
        withCredentials: true,
      });

      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/admin/layout");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleLogin}>
        <h2>Admin Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Enter email"
          value={form.email}
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Enter password"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </button>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <p>
          Don't have account? <Link to="/admin/register">Register</Link>
        </p>
      </form>
    </div>
  );
}