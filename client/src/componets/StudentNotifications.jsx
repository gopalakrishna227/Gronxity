
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./StudentNotifications.css";
import socket from "../socket";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";


const API_BASE = import.meta.env.VITE_API_URL;


/* =====================================================
   FORMAT NOTIFICATION TIME
===================================================== */

function formatNotificationTime(dateString) {

  if (!dateString) return "";

  const now = new Date();

  const created = new Date(dateString);

  const diffMs = now - created;


  const minutes = Math.floor(
    diffMs / (1000 * 60)
  );

  const hours = Math.floor(
    diffMs / (1000 * 60 * 60)
  );

  const days = Math.floor(
    diffMs / (1000 * 60 * 60 * 24)
  );


  if (minutes < 1) return "now";

  if (minutes < 60) {
    return `${minutes}m`;
  }

  if (hours < 24) {
    return `${hours}h`;
  }

  if (days < 7) {
    return `${days}d`;
  }


  return created.toLocaleDateString();

}


/* =====================================================
   GROUP NOTIFICATIONS
===================================================== */

function groupNotifications(notifications) {

  const now = new Date();


  const today = [];

  const thisWeek = [];

  const earlier = [];


  notifications.forEach((item) => {

    const created = new Date(
      item.createdAt
    );


    const diffDays = Math.floor(
      (now - created) /
      (1000 * 60 * 60 * 24)
    );


    if (diffDays < 1) {

      today.push(item);

    } else if (diffDays < 7) {

      thisWeek.push(item);

    } else {

      earlier.push(item);

    }

  });


  return {
    today,
    thisWeek,
    earlier,
  };

}


/* =====================================================
   PROFILE IMAGE
===================================================== */

function getProfileImage(notification) {

  return (

    notification?.senderId?.avatar ||

    "https://cdn-icons-png.flaticon.com/512/149/149071.png"

  );

}


/* =====================================================
   POST / ACTION IMAGE
===================================================== */

function getActionImage(notification) {

  return (

    notification?.postId?.thumbnail ||

    notification?.postId?.imageUrl ||

    notification?.postId?.videoUrl ||

    ""

  );

}


/* =====================================================
   STUDENT NOTIFICATIONS
===================================================== */

export default function StudentNotifications({

  onBack,

}) {


  /* =====================================================
     STATE
  ===================================================== */

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);


  const navigate = useNavigate();


  const currentUser = JSON.parse(
    localStorage.getItem("user")
  );


  /* =====================================================
     FETCH + SOCKET
  ===================================================== */

  useEffect(() => {

    fetchNotifications();

    markAllAsReadOnOpen();


    if (currentUser?._id) {

      socket.emit(
        "join_user_room",
        currentUser._id
      );

    }


    const handleNewNotification = (
      newNotification
    ) => {

      setNotifications((prev) => [

        newNotification,

        ...prev,

      ]);

    };


    socket.on(
      "new_notification",
      handleNewNotification
    );


    return () => {

      socket.off(
        "new_notification",
        handleNewNotification
      );

    };


  }, []);


  /* =====================================================
     FETCH NOTIFICATIONS
  ===================================================== */

  const fetchNotifications = async () => {

    try {

      setLoading(true);


      const res = await axios.get(

        `${API_BASE}/api/notifications`,

        {
          withCredentials: true,
        }

      );


      setNotifications(

        Array.isArray(res.data)
          ? res.data
          : []

      );


    } catch (err) {

      console.error(
        "Fetch notifications error:",
        err
      );


      setNotifications([]);


    } finally {

      setLoading(false);

    }

  };


  /* =====================================================
     OPEN NOTIFICATION
  ===================================================== */

  const openNotification = async (
    notification
  ) => {

    try {

      await axios.put(

        `${API_BASE}/api/notifications/${notification._id}/read`,

        {},

        {
          withCredentials: true,
        }

      );


      /*
        Open Post if notification has postId
      */

      if (notification.postId) {

        navigate(

          `/student/post/${notification.postId._id}?comment=true`

        );

      }


    } catch (err) {

      console.log(err);

    }

  };


  /* =====================================================
     MARK ALL AS READ
  ===================================================== */

  const markAllAsReadOnOpen = async () => {

    try {

      await axios.put(

        `${API_BASE}/api/notifications/read-all`,

        {},

        {
          withCredentials: true,
        }

      );


    } catch (err) {

      console.error(
        "Mark all read error:",
        err
      );

    }

  };


  /* =====================================================
     DELETE NOTIFICATION
  ===================================================== */

  const deleteNotification = async (id) => {

    try {

      await axios.delete(

        `${API_BASE}/api/notifications/${id}`,

        {
          withCredentials: true,
        }

      );


      setNotifications((prev) =>

        prev.filter(
          (item) => item._id !== id
        )

      );


    } catch (err) {

      console.error(
        "Delete notification error:",
        err
      );

    }

  };


  /* =====================================================
     ACCEPT FRIEND REQUEST
  ===================================================== */

  const handleConfirmRequest = async (
    notification
  ) => {

    try {

      await axios.put(

        `${API_BASE}/api/student/request/accept/${notification.requestId}`,

        {},

        {
          withCredentials: true,
        }

      );


      setNotifications((prev) =>

        prev.map((item) =>

          item._id === notification._id

            ? {

                ...item,

                requestHandled: true,

                requestAction: "accepted",

              }

            : item

        )

      );


    } catch (err) {

      console.error(
        "Accept request error:",
        err
      );

    }

  };


  /* =====================================================
     REJECT FRIEND REQUEST
  ===================================================== */

  const handleDeleteRequest = async (
    notification
  ) => {

    try {

      await axios.put(

        `${API_BASE}/api/student/request/reject/${notification.requestId}`,

        {},

        {
          withCredentials: true,
        }

      );


      setNotifications((prev) =>

        prev.map((item) =>

          item._id === notification._id

            ? {

                ...item,

                requestHandled: true,

                requestAction: "rejected",

              }

            : item

        )

      );


    } catch (err) {

      console.error(
        "Reject request error:",
        err
      );

    }

  };


  /* =====================================================
     RENDER SINGLE NOTIFICATION
  ===================================================== */

  const renderNotificationRow = (
    notification
  ) => {


    const profileImage =
      getProfileImage(notification);


    const actionImage =
      getActionImage(notification);


    return (

      <div

        key={notification._id}

        className={`insta-notification-row ${
          notification.isRead
            ? ""
            : "unread"
        }`}

        onClick={() => {

          console.log(
            "Notification clicked",
            notification
          );

          openNotification(notification);

        }}

        style={{
          cursor: "pointer",
        }}

      >


        {/* PROFILE IMAGE */}

        <div className="insta-notification-left">

          <img

            src={profileImage}

            alt="profile"

            className="insta-notification-avatar"

          />

        </div>


        {/* NOTIFICATION TEXT */}

        <div className="insta-notification-center">

          <p className="insta-notification-text">

            <span className="insta-notification-username">

              {
                notification.senderId?.name ||
                "Someone"
              }

            </span>

            {" "}

            {notification.message}


            <span className="insta-notification-time">

              {" "}

              {
                formatNotificationTime(
                  notification.createdAt
                )
              }

            </span>

          </p>

        </div>


        {/* RIGHT SIDE */}

        <div className="insta-notification-right">


          {/* FRIEND REQUEST */}

          {
            notification.type ===
            "friend_request"

              ? (

                notification.requestHandled

                  ? (

                    <button

                      className="insta-following-btn"

                      type="button"

                    >

                      {
                        notification.requestAction ===
                        "accepted"

                          ? "Following"

                          : "Deleted"
                      }

                    </button>

                  )

                  : (

                    <div className="insta-request-actions">


                      <button

                        className="insta-confirm-btn"

                        type="button"

                        onClick={(e) => {

                          e.stopPropagation();

                          handleConfirmRequest(
                            notification
                          );

                        }}

                      >

                        Confirm

                      </button>


                      <button

                        className="insta-delete-btn"

                        type="button"

                        onClick={(e) => {

                          e.stopPropagation();

                          handleDeleteRequest(
                            notification
                          );

                        }}

                      >

                        Delete

                      </button>


                    </div>

                  )

              )


              /* POST IMAGE */

              : actionImage

                ? (

                  <img

                    src={actionImage}

                    alt="post"

                    className="insta-notification-post-preview"

                  />

                )


                /* DELETE BUTTON */

                : (

                  <button

                    className="insta-mini-delete"

                    type="button"

                    onClick={(e) => {

                      e.stopPropagation();

                      deleteNotification(
                        notification._id
                      );

                    }}

                  >

                    ×

                  </button>

                )

          }


        </div>


      </div>

    );

  };


  /* =====================================================
     GROUP NOTIFICATIONS
  ===================================================== */

  const {

    today,

    thisWeek,

    earlier,

  } = groupNotifications(notifications);


  /* =====================================================
     RETURN UI
  ===================================================== */

  return (

    <div className="student-notifications-page">


      <div className="student-notifications-card">


        {/* =============================================
            MOBILE HEADER
        ============================================= */}

        <div className="mobile-notification-header">


          {/* BACK ARROW */}

          <button

            type="button"

            className="mobile-notification-back"

            onClick={(e) => {

              e.stopPropagation();


              /*
                Go back to previous Student page
              */

              if (onBack) {

                onBack();

              } else {

                /*
                  Fallback if component is used
                  outside Student.jsx
                */

                navigate(-1);

              }

            }}

            aria-label="Back"

          >

            <ArrowLeft size={22} />

          </button>


          {/* TITLE */}

          <h2 className="student-notifications-title">

            Notifications

          </h2>


        </div>


        {/* =============================================
            LOADING
        ============================================= */}

        {

          loading

            ? (

              <div className="student-notifications-empty">

                Loading...

              </div>

            )


            /* =========================================
               EMPTY
            ========================================= */

            : notifications.length === 0

              ? (

                <div className="student-notifications-empty">

                  No notifications yet

                </div>

              )


              /* =========================================
                 NOTIFICATIONS
              ========================================= */

              : (

                <>


                  {/* TODAY */}

                  {

                    today.length > 0 && (

                      <div className="notification-group">

                        <h3 className="notification-group-title">

                          Today

                        </h3>


                        {
                          today.map(
                            renderNotificationRow
                          )
                        }

                      </div>

                    )

                  }


                  {/* THIS WEEK */}

                  {

                    thisWeek.length > 0 && (

                      <div className="notification-group">

                        <h3 className="notification-group-title">

                          This week

                        </h3>


                        {
                          thisWeek.map(
                            renderNotificationRow
                          )
                        }

                      </div>

                    )

                  }


                  {/* EARLIER */}

                  {

                    earlier.length > 0 && (

                      <div className="notification-group">

                        <h3 className="notification-group-title">

                          Earlier

                        </h3>


                        {
                          earlier.map(
                            renderNotificationRow
                          )
                        }

                      </div>

                    )

                  }


                </>

              )

        }


      </div>


    </div>

  );

}
