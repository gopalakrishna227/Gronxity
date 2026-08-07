import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

const ResetPassword = () => {
  const { id, token } = useParams();
  const decodedToken = decodeURIComponent(token);

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/resetpassword/${id}/${decodedToken}`, {
        password,
      });

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
      style={{
        background: "linear-gradient(135deg, #667eea, #764ba2)", // gradient background
      }}
    >
      <div
        className="card shadow p-4"
        style={{
          width: "350px",
          maxWidth: "90%",
          borderRadius: "15px",
          background: "rgba(255, 255, 255, 0.95)", // slight transparency
        }}
      >
        <h2 className="mb-4 text-center" style={{ fontWeight: "600" }}>
          Reset Password
        </h2>

        <form onSubmit={handleReset}>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              <strong>New Password</strong>
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-control rounded-1"
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 rounded-1">
            Reset Password
          </button>
        </form>

        {message && (
          <p
            className={`mt-3 text-center ${message.includes("✅") ? "text-success" : "text-danger"}`}
            style={{ fontWeight: "500" }}
          >
            {message}
          </p>
        )}

        <div className="text-center mt-3">
          <a href="/login" className="text-decoration-none">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;