import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
import axios from "axios";

const RecruiterRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [showOTPBox, setShowOTPBox] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

  // ================= TIMER =================
  useEffect(() => {
    let interval;
    if (showOTPBox && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showOTPBox, timer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
  e.preventDefault();

  if (!passwordRegex.test(formData.password)) {
    setMessage(
      "❌ Password must be 8 characters, include uppercase, lowercase & special character."
    );
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setMessage("❌ Passwords do not match.");
    return;
  }

  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/recruiter/register`,
      {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        password: formData.password,
      }
    );

    setShowOTPBox(true);
    setTimer(60);
    setCanResend(false);
    setMessage("📩 OTP Sent to your email.");
  } catch (err) {
    setMessage(
      err.response?.data?.message || "Something went wrong"
    );
  }
};

  // ================= OTP INPUT =================
  const handleOTPChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOTP = async () => {
  const enteredOTP = otp.join("");

  if (enteredOTP.length !== 6) {
    setMessage("❌ Please enter valid 6-digit OTP.");
    return;
  }

  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/recruiter/verify-otp`,
      {
        email: formData.email,
        otp: enteredOTP,
      }
    );

    setMessage(res.data.message);
    setShowOTPBox(false);
  } catch (err) {
    setMessage(
      err.response?.data?.message || "OTP Verification failed"
    );
  }
};

const handleResendOTP = async () => {
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/recruiter/resend-otp`,
      { email: formData.email }
    );

    setTimer(60);
    setCanResend(false);
    setOtp(new Array(6).fill(""));
    setMessage("📩 New OTP Sent!");
  } catch (err) {
    setMessage("Failed to resend OTP");
  }
};

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "linear-gradient(135deg, #667eea, #764ba2)",
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{
          width: "420px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.97)",
          transition: "0.4s",
        }}
      >
        <h2 className="text-center fw-bold mb-4">
          Recruiter Registration
        </h2>

        {!showOTPBox && (
          <form onSubmit={handleRegister}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="form-control mb-3"
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Company Email"
              className="form-control mb-3"
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="company"
              placeholder="Company Name"
              className="form-control mb-3"
              onChange={handleChange}
              required
            />

            <div className="position-relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="form-control"
                onChange={handleChange}
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

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="form-control mb-3"
              onChange={handleChange}
              required
            />

            <button className="btn btn-primary w-100">
              Register
            </button>
          </form>
        )}

        {/* ================= OTP SECTION ================= */}
        {showOTPBox && (
          <div
            className="text-center"
            style={{ animation: "fadeIn 0.5s ease-in-out" }}
          >
            <h5 className="mb-3">Enter OTP</h5>

            <div className="d-flex justify-content-between mb-3">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={data}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) =>
                    handleOTPChange(e.target, index)
                  }
                  onKeyDown={(e) =>
                    handleBackspace(e, index)
                  }
                  className="form-control text-center mx-1"
                  style={{
                    width: "45px",
                    height: "50px",
                    fontSize: "20px",
                    borderRadius: "10px",
                  }}
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOTP}
              className="btn btn-success w-100 mb-2"
            >
              Verify OTP
            </button>

            {/* TIMER */}
            {!canResend ? (
              <p className="text-muted">
                Resend OTP in {timer}s
              </p>
            ) : (
              <button
                className="btn btn-link"
                onClick={handleResendOTP}
              >
                🔄 Resend OTP
              </button>
            )}
          </div>
        )}

        {message && (
          <div
            className={`alert mt-3 ${
              message.includes("✅")
                ? "alert-success"
                : message.includes("📩")
                ? "alert-info"
                : "alert-danger"
            }`}
          >
            {message}
          </div>
        )}

        <p className="text-center mt-3">
          Already have an account?
        </p>

        <Link to="/login" className="btn btn-light border w-100">
          Login
        </Link>
      </div>
    </div>
  );
};

export default RecruiterRegister;