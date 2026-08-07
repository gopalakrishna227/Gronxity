import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./StudentProfileView.css";

export default function StudentProfileView() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  const fetchStudentProfile = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/profile/${id}`,
        { withCredentials: true }
      );

      setStudent(res.data);
    } catch (err) {
      console.error("Fetch student profile error:", err);
      alert(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/request/${id}`,
        {},
        { withCredentials: true }
      );

      alert(res.data.message);
    } catch (err) {
      console.error("Send request error:", err);
      alert(err.response?.data?.message || "Failed to send request");
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  if (!student) return <div className="profile-loading">Student not found</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">

        <img
          src={student.coverImage || "https://via.placeholder.com/900x200"}
          className="cover-image"
        />

        <div className="profile-header">

          <img
            src={student.profileImage || "https://via.placeholder.com/120"}
            className="profile-avatar"
          />

          <div className="profile-info">
            <h2>{student.name}</h2>
            <p className="headline">{student.headline}</p>
            <p className="location">{student.location}</p>

            <button className="connect-btn" onClick={sendRequest}>
              Connect
            </button>
          </div>

        </div>

        <div className="profile-section">
          <h3>About</h3>
          <p>{student.bio || "No bio added"}</p>
        </div>

        <div className="profile-section">
          <h3>College</h3>
          <p>{student.college || "Not specified"}</p>
        </div>

        <div className="profile-section">
          <h3>Skills</h3>

          <div className="skills">
            {student.skills?.length > 0 ? (
              student.skills.map((skill, index) => (
                <span key={index} className="skill">
                  {skill}
                </span>
              ))
            ) : (
              <p>No skills added</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}