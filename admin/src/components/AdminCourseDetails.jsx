import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "./AdminCourseDetails.css";

const API = import.meta.env.VITE_API_URL;

export default function AdminCourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSingleCourse();
  }, [courseId]);

  const fetchSingleCourse = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/api/admin/course/${courseId}`, {
        withCredentials: true,
      });

      setCourse(res.data?.course || null);
    } catch (err) {
      console.error("Admin fetch course details error:", err);
      alert(err.response?.data?.message || "Failed to fetch course");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    const ok = window.confirm("Are you sure admin wants to delete this course?");
    if (!ok) return;

    try {
      await axios.delete(`${API}/api/admin/course/${courseId}`, {
        withCredentials: true,
      });

      alert("Course deleted successfully");
      navigate("/admin/courses");
    } catch (err) {
      console.error("Admin delete course error:", err);
      alert(err.response?.data?.message || "Failed to delete course");
    }
  };

  if (loading) {
    return <div className="admin-course-details-empty">Loading...</div>;
  }

  if (!course) {
    return <div className="admin-course-details-empty">Course not found</div>;
  }

  return (
    <div className="admin-course-details-page">
      <div className="admin-course-details-topbar">
        <button
          className="admin-course-details-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <button
          className="admin-course-details-delete-btn"
          onClick={handleDeleteCourse}
        >
          <Trash2 size={18} />
          Delete Course
        </button>
      </div>

      <div className="admin-course-details-layout">
        <div className="admin-course-video-box">
          <video
            src={course.videoUrl}
            className="admin-course-video-frame"
            controls
          />
        </div>

        <div className="admin-course-details-info">
          <h1>{course.title || "Untitled Course"}</h1>

          <p><strong>Description:</strong> {course.description || "No description"}</p>
          <p><strong>Uploader Name:</strong> {course.uploader?.name || "Student"}</p>
          <p><strong>Uploader Email:</strong> {course.uploader?.email || "No email"}</p>
          <p><strong>Views:</strong> {course.views || 0}</p>
          <p><strong>Likes:</strong> {course.likesCount || 0}</p>
          <p><strong>Comments:</strong> {course.commentsCount || 0}</p>
          <p><strong>Shares:</strong> {course.sharesCount || 0}</p>

          <div className="admin-course-comments-box">
            <h2>Comments</h2>

            {(course.comments || []).length === 0 ? (
              <p>No comments yet</p>
            ) : (
              course.comments.map((comment) => (
                <div className="admin-course-comment-item" key={comment._id}>
                  <strong>{comment.userId?.name || "Student"}:</strong> {comment.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}