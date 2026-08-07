import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await axios.post(`${API_BASE}/api/admin/register`, form, {
        withCredentials: true,
      });

      setMessage(res.data.message || "Registered successfully");

      setTimeout(() => {
        navigate("/admin/login");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleRegister}>
        <h2>Admin Register</h2>

        <input
          type="text"
          name="name"
          placeholder="Enter name"
          value={form.name}
          onChange={handleChange}
        />

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

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm password"
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Register"}
        </button>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <p>
          Already have account? <Link to="/admin/login">Login</Link>
        </p>
      </form>
    </div>
  );
}