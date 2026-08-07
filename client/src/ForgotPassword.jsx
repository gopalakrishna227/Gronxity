import React, { useState } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); // ✅ For status messages

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/forgotpassword`, { email });
      console.log(response.data);
      setMessage("✅ Reset link sent. Please check your email.");
    } catch (error) {
      console.error("❌ Error sending reset link:", error.response?.data || error.message);
      setMessage("❌ Failed to send reset link. Please try again.");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light"style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
      <div className="card shadow p-4" style={{ maxWidth: "400px", width: "90%"}}>
        <h2 className="text-center mb-4">Forgot Password</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label"><strong>Email</strong></label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-control"
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Send Reset Link
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
          <a href="/login" className="text-decoration-none">Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;