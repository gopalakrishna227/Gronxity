import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

  // ================= REGISTER =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordRegex.test(password)) {
      setMessage("❌ Password must be strong.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/register`,
        { name, email, password, confirmPassword }
      );

      setMessage("📩 OTP sent to your email");
      setShowOtpBox(true);   // ✅ Show OTP input
    } catch (err) {
  if (err.response && err.response.data.message) {
    setMessage("❌ " + err.response.data.message);
  } else {
    setMessage("❌ Registration failed.");
  }
}
  };

  // ================= VERIFY OTP =================
  const handleVerifyOtp = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/verify-otp`,
        { email, otp }
      );

      setMessage("✅ Account verified successfully!");
      setTimeout(() => navigate("/login"), 1500);

    } catch (err) {
  if (err.response && err.response.data.message) {
    setMessage("❌ " + err.response.data.message);
  } else {
    setMessage("❌ OTP verification failed.");
  }
}
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100"
      style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
    >
      <div className="card shadow p-4"
        style={{ width: "380px", borderRadius: "15px" }}
      >

        <h2 className="text-center fw-bold mb-4">Register</h2>

        {!showOtpBox ? (
          // ================= REGISTER FORM =================
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input type="text" placeholder="Full Name"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required />
            </div>

            <div className="mb-3">
              <input type="email" placeholder="Email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required />
            </div>

            <div className="mb-3 position-relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "10px",
                  cursor: "pointer",
                }}
              >
                👁
              </span>
            </div>

            <div className="mb-3">
              <input
                type="password"
                placeholder="Confirm Password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Register
            </button>
          </form>
        ) : (
          // ================= OTP FORM =================
          <>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Enter OTP"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <button
              onClick={handleVerifyOtp}
              className="btn btn-success w-100"
            >
              Verify OTP
            </button>
          </>
        )}

        {message && (
          <div className={`alert mt-3 ${
            message.includes("✅")
              ? "alert-success"
              : "alert-danger"
          }`}>
            {message}
          </div>
        )}

        {!showOtpBox && (
          <>
            <p className="text-center mt-3">
              Already have an account?
            </p>

            <Link to="/login"
              className="btn btn-light border w-100">
              Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;