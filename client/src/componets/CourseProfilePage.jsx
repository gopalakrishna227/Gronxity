import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Play, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "./CourseProfilePage.css";

const API = import.meta.env.VITE_API_URL;

export default function CourseProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyProfile();
    fetchUserCourses();
  }, [userId]);

  const fetchMyProfile = async () => {
    try {
      const res = await axios.get(`${API}/api/student/profile/me`, {
        withCredentials: true,
      });
      setMyProfile(res.data?.profile || null);
    } catch (err) {
      console.error("Fetch my profile error:", err);
    }
  };

  const fetchUserCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/student/courses/user/${userId}`, {
        withCredentials: true,
      });

      setProfile(res.data?.profile || null);
      setCourses(Array.isArray(res.data?.courses) ? res.data.courses : []);
    } catch (err) {
      console.error("Fetch user courses error:", err);
      alert(err.response?.data?.message || "Failed to fetch profile courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    const ok = window.confirm("Are you sure you want to delete this course?");
    if (!ok) return;

    try {
      await axios.delete(`${API}/api/student/course/${courseId}`, {
        withCredentials: true,
      });
      setCourses((prev) => prev.filter((item) => item._id !== courseId));
      alert("Course deleted successfully");
    } catch (err) {
      console.error("Delete course error:", err);
      alert(err.response?.data?.message || "Failed to delete course");
    }
  };

  const isMyProfile = String(myProfile?._id || "") === String(userId);

  if (loading) {
    return <div className="student-course-profile-empty">Loading...</div>;
  }

  return (
    <div className="student-course-profile-page">
      <div className="student-course-profile-topbar">
        <button
          className="student-course-profile-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      <div
        className="student-course-profile-cover"
        style={{
          backgroundImage: profile?.backgroundImage
            ? `url(${profile.backgroundImage})`
            : "linear-gradient(135deg,#ef4444,#7c3aed)",
        }}
      />

      <div className="student-course-profile-header">
        <div className="student-course-profile-avatar">
          {profile?.avatar ? (
            <img src={profile.avatar} alt={profile?.name} />
          ) : (
            (profile?.name || "ST")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          )}
        </div>

        <div className="student-course-profile-head-content">
          <h1>{profile?.name || "Student"}</h1>
          <p>{profile?.about || "Uploaded course videos"}</p>

          <div className="student-course-profile-links">
            {profile?.instagram && (
              <a href={profile.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
            )}
            {profile?.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            )}
            {profile?.telegram && (
              <a href={profile.telegram} target="_blank" rel="noreferrer">
                Telegram
              </a>
            )}
            {profile?.customLink1Url && (
              <a href={profile.customLink1Url} target="_blank" rel="noreferrer">
                {profile.customLink1Label || "Custom Link 1"}
              </a>
            )}
            {profile?.customLink2Url && (
              <a href={profile.customLink2Url} target="_blank" rel="noreferrer">
                {profile.customLink2Label || "Custom Link 2"}
              </a>
            )}
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="student-course-profile-empty">
          No uploaded courses found
        </div>
      ) : (
        <div className="student-course-profile-grid">
          {courses.map((course) => (
            <div className="student-course-profile-card" key={course._id}>
              <div
                className="student-course-profile-thumb-wrap"
                onClick={() => navigate(`/student/course/${course._id}`)}
              >
                <img
                  src={
                    course.thumbnail ||
                    "https://via.placeholder.com/800x450?text=Course+Thumbnail"
                  }
                  alt={course.title}
                  className="student-course-profile-thumb"
                />
                <div className="student-course-profile-play">
                  <Play size={28} />
                </div>
              </div>

              <div className="student-course-profile-card-body">
                <div>
                  <h3>{course.title}</h3>
                  <p>{course.views || 0} views</p>
                </div>

                {isMyProfile && (
                  <button
                    className="student-course-profile-delete-btn"
                    onClick={() => handleDelete(course._id)}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}