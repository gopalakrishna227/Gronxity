import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminList.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/students`, {
        withCredentials: true,
      });
      setStudents(res.data.students || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students");
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this student?");
    if (!ok) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/students/${id}`, {
        withCredentials: true,
      });
      setStudents((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="admin-list-page">
      <div className="top-bar">
        <h2>All Students</h2>
        <button onClick={() => navigate("/admin/dashboard")}>Back</button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="list-grid">
        {students.map((student) => (
          <div className="list-card" key={student._id}>
            <img
              src={student.avatar || "https://via.placeholder.com/100"}
              alt={student.name}
            />
            <h3>{student.name}</h3>
            <p>{student.email}</p>
            <p>{student.headline || "No headline"}</p>

            <div className="card-actions">
              <button onClick={() => navigate(`/admin/students/${student._id}`)}>
                View
              </button>
              <button className="delete-btn" onClick={() => handleDelete(student._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}