import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

const ResetPassword = () => {
  const { id, token } = useParams();
  const decodedToken = decodeURIComponent(token);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ✅ Password validation
  const validatePassword = (pwd) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
    return regex.test(pwd);
  };

  // ✅ Password strength checker
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { text: "Weak", color: "danger", width: "33%" };
    if (score === 2 || score === 3) return { text: "Medium", color: "warning", width: "66%" };
    return { text: "Strong", color: "success", width: "100%" };
  };

  const strength = getStrength(password);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      setMessage("❌ Password must be 8 characters, include uppercase, lowercase & special character.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/resetpassword/${id}/${decodedToken}`,
        { password }
      );

      if (res.data.Status === "Success") {
        setMessage("✅ Password reset successful!");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMessage("❌ " + (res.data.Status || "Reset failed"));
      }
    } catch (err) {
      setMessage("❌ Error: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
    >
      <div
        className="card shadow p-4"
        style={{
          width: "350px",
          maxWidth: "90%",
          borderRadius: "15px",
          background: "rgba(255, 255, 255, 0.95)"
        }}
      >
        <h2 className="mb-4 text-center fw-bold">Reset Password</h2>

        <form onSubmit={handleReset}>
          {/* Password Field */}
          <div className="mb-3">
            <label className="form-label"><strong>New Password</strong></label>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-control"
              />
              <span
                className="input-group-text"
                style={{ cursor: "pointer" }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁"}
              </span>
            </div>

            {/* Strength Meter */}
            {password && (
              <>
                <div className="progress mt-2" style={{ height: "6px" }}>
                  <div
                    className={`progress-bar bg-${strength.color}`}
                    style={{ width: strength.width }}
                  ></div>
                </div>
                <small className={`text-${strength.color}`}>
                  {strength.text} Password
                </small>
              </>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label className="form-label"><strong>Confirm Password</strong></label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="form-control"
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Reset Password
          </button>
        </form>

        {message && (
          <p
            className={`mt-3 text-center ${
              message.includes("✅") ? "text-success" : "text-danger"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;