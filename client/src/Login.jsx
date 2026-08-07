import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css'

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  axios.defaults.withCredentials = true;

  const handleLogin = (e) => {
  e.preventDefault();

  axios.post(
    `${import.meta.env.VITE_API_URL}/login`,
    { email, password },
    { withCredentials: true }   // ✅ important for cookies
  )
  .then(result => {
    if (result.data && result.data.user) {

      // Save user info
      localStorage.setItem("user", JSON.stringify(result.data.user));
      localStorage.setItem("role", result.data.role);  // ✅ save role

      // 🔥 Redirect based on role
if (result.data.role === "student") {
  // Default sidebar to Home on every login
  sessionStorage.setItem("studentActiveTab", "Home");

  navigate("/student/student");
}
      else if (result.data.role === "recruiter") {
        navigate("/recruiter/sidebar");
      } 
      else {
        navigate("/home"); // fallback
      }

    } else {
      alert("Login failed.");
    }
  })
  .catch(err => {
    alert(err.response?.data?.message || "Something went wrong during login.");
  });
};

  return (
    <div className="login-wrapper d-flex justify-content-center align-items-center">

      <div className="login-card bg-white shadow-lg rounded-4">

        <h3 className="text-center fw-bold mb-4">Welcome Back</h3>

        <form onSubmit={handleLogin}>

          <label className="form-label fw-semibold">Email</label>
          <input
            type="email"
            className="form-control form-control-lg mb-3"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="form-label fw-semibold">Password</label>
          <input
            type="password"
            className="form-control form-control-lg mb-2"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="text-end mb-3">
            <Link to="/forgotpassword" className="small text-decoration-none">
              Forgot password?
            </Link>
          </div>

          <button className="btn btn-primary btn-lg w-100">
            Login
          </button>

          <p className="text-center mt-4 mb-0">
            Don’t have an account?{" "}
            <Link to="/selectrole" className="fw-semibold text-decoration-none">
              Register
            </Link>
          </p>

        </form>
      </div>
    </div>
  );
};

export default Login;