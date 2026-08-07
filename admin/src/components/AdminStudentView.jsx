import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminView.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminStudentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/students/${id}`, {
        withCredentials: true,
      });
      setStudent(res.data.student);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load student");
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("Delete this student?");
    if (!ok) return;

    try {
      await axios.delete(`${API_BASE}/api/admin/students/${id}`, {
        withCredentials: true,
      });
      navigate("/admin/students");
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!student) return <p className="loading">Loading...</p>;

  return (
    <div className="admin-view-page">
      <div className="view-top">
        <button onClick={() => navigate("/admin/students")}>Back</button>
        <button className="delete-btn" onClick={handleDelete}>Delete Student</button>
      </div>

      <div className="profile-card">
        <img
          className="profile-avatar"
          src={student.avatar || "https://via.placeholder.com/120"}
          alt={student.name}
        />
        <h2>{student.name}</h2>
        <p>{student.email}</p>
        <p>{student.headline}</p>
        <p>{student.location}</p>
        <p>{student.about}</p>

        <h3>Skills</h3>
        <div className="tag-wrap">
          {(student.skills || []).map((skill, index) => (
            <span key={index} className="tag">{skill}</span>
          ))}
        </div>

        <h3>Education</h3>
        {(student.education || []).map((edu, index) => (
          <div key={index} className="info-box">
            <p><strong>School:</strong> {edu.school}</p>
            <p><strong>Degree:</strong> {edu.degree}</p>
            <p><strong>Period:</strong> {edu.period}</p>
          </div>
        ))}

        <h3>Experience</h3>
        {(student.experience || []).map((exp, index) => (
          <div key={index} className="info-box">
            <p><strong>Role:</strong> {exp.role}</p>
            <p><strong>Company:</strong> {exp.company}</p>
            <p><strong>Period:</strong> {exp.period}</p>
            <p><strong>Description:</strong> {exp.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}