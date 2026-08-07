import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, Play, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./AdminSeeCourses.css";

const API = import.meta.env.VITE_API_URL;

export default function AdminSeeCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAdminCourses();
  }, []);

  const fetchAdminCourses = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/api/admin/courses`, {
        withCredentials: true,
      });

      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Admin fetch courses error:", err);
      alert(err.response?.data?.message || "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    const ok = window.confirm("Are you sure admin wants to delete this course?");
    if (!ok) return;

    try {
      await axios.delete(`${API}/api/admin/course/${courseId}`, {
        withCredentials: true,
      });

      setCourses((prev) => prev.filter((course) => course._id !== courseId));
      alert("Course deleted successfully");
    } catch (err) {
      console.error("Admin delete course error:", err);
      alert(err.response?.data?.message || "Failed to delete course");
    }
  };

  const filteredCourses = courses.filter((course) => {
    const q = search.toLowerCase();
    return (
      (course.title || "").toLowerCase().includes(q) ||
      (course.uploader?.name || "").toLowerCase().includes(q) ||
      (course.uploader?.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-courses-page">
      <div className="admin-courses-topbar">
        <h1>All Courses</h1>

        <div className="admin-courses-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by title, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-courses-empty">Loading...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="admin-courses-empty">No courses found</div>
      ) : (
        <div className="admin-courses-grid">
          {filteredCourses.map((course) => (






            <div className="admin-course-card" key={course._id}>
  <div className="admin-course-thumb-wrap">
    <img
      src={
        course.thumbnail ||
        "https://via.placeholder.com/800x450?text=Course+Thumbnail"
      }
      alt={course.title}
      className="admin-course-thumb"
    />
    <div className="admin-course-play-overlay">
      <Play size={28} />
    </div>
  </div>

  <div className="admin-course-card-body">
    <h3>{course.title}</h3>
    <p><strong>Uploader:</strong> {course.uploader?.name || "Student"}</p>
    <p><strong>Email:</strong> {course.uploader?.email || "No email"}</p>
    <p>
      {course.views || 0} views • {course.likesCount || 0} likes •{" "}
      {course.commentsCount || 0} comments
    </p>

    <div className="admin-course-card-actions">
      <button
        className="admin-course-view-btn"
        onClick={() => navigate(`/admin/course/${course._id}`)}
      >
        View Details
      </button>

      <button
        className="admin-course-delete-btn"
        onClick={() => handleDeleteCourse(course._id)}
      >
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  </div>
</div>












          ))}
        </div>
      )}
    </div>
  );
}