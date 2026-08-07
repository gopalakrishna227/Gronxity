import React, { useEffect, useState } from "react";
import axios from "axios";
import "./StudentNotifications.css";
import socket from "../socket";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

function formatNotificationTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const created = new Date(dateString);
  const diffMs = now - created;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  return created.toLocaleDateString();
}

function groupNotifications(notifications) {
  const now = new Date();

  const today = [];
  const thisWeek = [];
  const earlier = [];

  notifications.forEach((item) => {
    const created = new Date(item.createdAt);
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      today.push(item);
    } else if (diffDays < 7) {
      thisWeek.push(item);
    } else {
      earlier.push(item);
    }
  });

  return { today, thisWeek, earlier };
}

function getProfileImage(notification) {
  return (
    notification?.senderId?.avatar ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  );
}

function getActionImage(notification) {
  return (
    notification?.postId?.thumbnail ||
    notification?.postId?.imageUrl ||
    notification?.postId?.videoUrl ||
    ""
  );
}

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchNotifications();
    markAllAsReadOnOpen();

    if (currentUser?._id) {
      socket.emit("join_user_room", currentUser._id);
    }

    const handleNewNotification = (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/notifications`, {
        withCredentials: true,
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };


  const openNotification = async (notification) => {
  try {
    // Mark notification as read
    await axios.put(
      `${API_BASE}/api/notifications/${notification._id}/read`,
      {},
      { withCredentials: true }
    );

    if (notification.postId) {
      navigate(
        `/student/post/${notification.postId._id || notification.postId}?comment=true`
      );
    }
  } catch (err) {
    console.log(err);
  }
};

  const markAllAsReadOnOpen = async () => {
    try {
      await axios.put(
        `${API_BASE}/api/notifications/read-all`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/notifications/${id}`, {
        withCredentials: true,
      });
      setNotifications((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  };

  const handleConfirmRequest = async (notification) => {
    try {
      await axios.put(
        `${API_BASE}/api/student/request/accept/${notification.requestId}`,
        {},
        { withCredentials: true }
      );

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id
            ? { ...item, requestHandled: true, requestAction: "accepted" }
            : item
        )
      );
    } catch (err) {
      console.error("Accept request error:", err);
    }
  };

  const handleDeleteRequest = async (notification) => {
    try {
      await axios.put(
        `${API_BASE}/api/student/request/reject/${notification.requestId}`,
        {},
        { withCredentials: true }
      );

      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notification._id
            ? { ...item, requestHandled: true, requestAction: "rejected" }
            : item
        )
      );
    } catch (err) {
      console.error("Reject request error:", err);
    }
  };

  const renderNotificationRow = (notification) => {
    const profileImage = getProfileImage(notification);
    const actionImage = getActionImage(notification);

    return (
     <div
  key={notification._id}
  className={`insta-notification-row ${notification.isRead ? "" : "unread"}`}
onClick={() => {
  console.log("Notification clicked", notification);
  openNotification(notification);
}}
  style={{ cursor: "pointer" }}
>
        <div className="insta-notification-left">
          <img
            src={profileImage}
            alt="profile"
            className="insta-notification-avatar"
          />
        </div>

        <div className="insta-notification-center">
          <p className="insta-notification-text">
            <span className="insta-notification-username">
              {notification.senderId?.name || "Someone"}
            </span>{" "}
            {notification.message}
            <span className="insta-notification-time">
              {" "}
              {formatNotificationTime(notification.createdAt)}
            </span>
          </p>
        </div>

        <div className="insta-notification-right">
          {notification.type === "friend_request" ? (
            notification.requestHandled ? (
              <button className="insta-following-btn" type="button">
                {notification.requestAction === "accepted" ? "Following" : "Deleted"}
              </button>
            ) : (
              <div className="insta-request-actions">
                <button
                  className="insta-confirm-btn"
                  type="button"
                  onClick={() => handleConfirmRequest(notification)}
                >
                  Confirm
                </button>
                <button
                  className="insta-delete-btn"
                  type="button"
                  onClick={() => handleDeleteRequest(notification)}
                >
                  Delete
                </button>
              </div>
            )
          ) : actionImage ? (
            <img
              src={actionImage}
              alt="post"
              className="insta-notification-post-preview"
            />
          ) : (
            <button
              className="insta-mini-delete"
              type="button"
              onClick={() => deleteNotification(notification._id)}
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  };

  const { today, thisWeek, earlier } = groupNotifications(notifications);

  return (
    <div className="student-notifications-page">
      <div className="student-notifications-card">
        <h2 className="student-notifications-title">Notifications</h2>

        {loading ? (
          <div className="student-notifications-empty">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="student-notifications-empty">No notifications yet</div>
        ) : (
          <>
            {today.length > 0 && (
              <div className="notification-group">
                <h3 className="notification-group-title">Today</h3>
                {today.map(renderNotificationRow)}
              </div>
            )}

            {thisWeek.length > 0 && (
              <div className="notification-group">
                <h3 className="notification-group-title">This week</h3>
                {thisWeek.map(renderNotificationRow)}
              </div>
            )}

            {earlier.length > 0 && (
              <div className="notification-group">
                <h3 className="notification-group-title">Earlier</h3>
                {earlier.map(renderNotificationRow)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}