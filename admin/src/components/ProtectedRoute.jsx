import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

const AdminProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        await axios.get(`${API_BASE}/api/admin/dashboard`, {
          withCredentials: true,
        });

        setAuthorized(true);
      } catch (err) {
        console.log("Admin auth error:", err.response?.data || err.message);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!authorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default AdminProtectedRoute;