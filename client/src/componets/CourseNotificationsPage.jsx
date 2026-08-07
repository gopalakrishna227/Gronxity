import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./CourseNotificationsPage.css";

const API = import.meta.env.VITE_API_URL;

export default function CourseNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    markAllAsRead();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/student/course-notifications`, {
        withCredentials: true,
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch course notifications error:", err);
      alert(err.response?.data?.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${API}/api/student/course-notifications/read-all`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Mark course notifications read error:", err);
    }
  };

  const handleOpenCourse = async (notification) => {
    try {
      if (!notification?._id) return;

      await axios.put(
        `${API}/api/student/course-notification/${notification._id}/read`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Read one course notification error:", err);
    }

    if (notification?.courseId?._id) {
      navigate(`/student/course/${notification.courseId._id}`);
    }
  };

  return (
    <div className="course-notifications-page">
      <div className="course-notifications-topbar">
        <button
          className="course-notifications-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1>
          <Bell size={20} />
          Course Notifications
        </h1>
      </div>

      <div className="course-notifications-content">
        {loading ? (
          <div className="course-notifications-empty">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="course-notifications-empty">
            No course notifications yet
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item._id}
              className={`course-notification-card ${
                item.isRead ? "" : "unread"
              }`}
              onClick={() => handleOpenCourse(item)}
            >
              <div className="course-notification-left">
                {item.senderId?.avatar ? (
                  <img
                    src={item.senderId.avatar}
                    alt={item.senderId?.name}
                    className="course-notification-avatar"
                  />
                ) : (
                  <div className="course-notification-avatar fallback">
                    {(item.senderId?.name || "S").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="course-notification-body">
                <h3>{item.title || "Course Notification"}</h3>
                <p>{item.message || ""}</p>
                {item.courseId?.title ? (
                  <span className="course-notification-course-title">
                    {item.courseId.title}
                  </span>
                ) : null}
              </div>

              {!item.isRead && <div className="course-notification-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}