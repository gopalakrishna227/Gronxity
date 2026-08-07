import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Logout.css";

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/logout`,
        {},
        { withCredentials: true }
      );

      console.log(res.data);
    } catch (err) {
      console.error("Logout error:", err.response?.data || err.message);
    } finally {
      localStorage.removeItem("user");

      // Reset sidebar to Home for next login
      sessionStorage.removeItem("studentActiveTab");
      // or sessionStorage.setItem("studentActiveTab", "Home");

      navigate("/login");
    }
  };

  return (
    <button className="logout-btn" onClick={handleLogout}>
      Logout
    </button>
  );
};

export default Logout;