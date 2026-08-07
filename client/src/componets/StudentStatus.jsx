import React, { useEffect, useMemo, useRef, useState } from "react";
import "./StudentStatus.css";
import { Heart } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;
const IMAGE_TIME = 5000;

export default function StudentStatus({ setShowNavbar }) {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({
    caption: "",
    mediaFile: null,
    mediaPreview: "",
    mediaType: "",
  });

  const [statuses, setStatuses] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [showViewSheet, setShowViewSheet] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [isReplyFocused, setIsReplyFocused] = useState(false);

  const timerRef = useRef(null);
  const videoRef = useRef(null);
    const stripRef = useRef(null);


  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const newStoryScrollRef = useRef(false);

  useEffect(() => {
    fetchStatuses();
    fetchMyStatuses();
  }, []);

  const groupedStatuses = useMemo(() => {
    const grouped = statuses.reduce((acc, item) => {
      const key =
        item.userId ||
        item.studentId ||
        item.authorId ||
        item.email ||
        item.author ||
        item._id;

      if (!acc[key]) {
        acc[key] = {
          userKey: key,
          author: item.author || "Student",
          profileImage: item.profileImage || "",
          stories: [],
        };
      }

      acc[key].stories.push(item);
      return acc;
    }, {});

    return Object.values(grouped);
  }, [statuses]);

  const activeGroup = useMemo(() => {
    return groupedStatuses[activeGroupIndex] || null;
  }, [groupedStatuses, activeGroupIndex]);

  const currentStatus = useMemo(() => {
    if (!activeGroup) return null;
    return activeGroup.stories[activeStoryIndex] || null;
  }, [activeGroup, activeStoryIndex]);

  const isOwnStatus =
    currentStatus && String(currentStatus.userId) === String(loggedInUser?._id);

  const filteredViewers = (currentStatus?.viewers || []).filter(
    (viewer) => String(viewer.userId) !== String(loggedInUser?._id),
  );

  const isPaused =
    showViewSheet ||
    sendingReply ||
    isReplyFocused ||
    replyText.trim().length > 0;

  useEffect(() => {
    updateScrollButtons();

    const el = stripRef.current;
    if (!el) return;

    el.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [groupedStatuses]);

  useEffect(() => {
    if (!viewerOpen || !currentStatus) return;

    clearViewerTimer();

    if (currentStatus.mediaType === "image" && !isPaused) {
      timerRef.current = setTimeout(() => {
        handleNext();
      }, IMAGE_TIME);
    }

    return () => clearViewerTimer();
  }, [viewerOpen, currentStatus, activeStoryIndex, activeGroupIndex, isPaused]);

  useEffect(() => {
    if (!viewerOpen) return;
    if (!videoRef.current) return;
    if (currentStatus?.mediaType !== "video") return;

    if (isPaused) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  }, [viewerOpen, currentStatus, isPaused]);

  useEffect(() => {
    if (!viewerOpen || !currentStatus?._id) return;

    const trackView = async () => {
      try {
        await fetch(
          `${API_BASE}/api/student/status/${currentStatus._id}/view`,
          {
            method: "POST",
            credentials: "include",
          },
        );
        await fetchStatuses();
        await fetchMyStatuses();
      } catch (err) {
        console.error("Track status view error:", err);
      }
    };

    trackView();
  }, [viewerOpen, currentStatus?._id]);

  const updateScrollButtons = () => {
    const el = stripRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < maxScrollLeft - 5);
  };

  const scrollStories = (direction) => {
    const el = stripRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const clearViewerTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetForm = () => {
    if (form.mediaPreview) {
      URL.revokeObjectURL(form.mediaPreview);
    }

    setForm({
      caption: "",
      mediaFile: null,
      mediaPreview: "",
      mediaType: "",
    });

    setError("");
    setMessage("");
  };

const openCreateModal = () => {
  setShowNavbar(false);   // hide navbar
  setCreateOpen(true);
  setError("");
  setMessage("");
};
 const closeCreateModal = () => {
  setShowNavbar(true);   // show navbar again
  setCreateOpen(false);
  resetForm();
};

  const handleCaptionChange = (value) => {
    setForm((prev) => ({ ...prev, caption: value }));
    setError("");
    setMessage("");
  };

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Only image or video file is allowed");
      return;
    }

    if (form.mediaPreview) {
      URL.revokeObjectURL(form.mediaPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setForm((prev) => ({
      ...prev,
      mediaFile: file,
      mediaPreview: previewUrl,
      mediaType: isImage ? "image" : "video",
    }));

    setError("");
    setMessage("");
  };

  const fetchStatuses = async () => {
    try {
      setFetching(true);
      setError("");

      const res = await fetch(`${API_BASE}/api/student/status`, {
        method: "GET",
        credentials: "include",
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server did not return JSON. Check backend route/API.");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch statuses");
      }

      setStatuses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch status error:", err);
      setError(err.message || "Something went wrong while fetching statuses");
    } finally {
      setFetching(false);
    }
  };

  const fetchMyStatuses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/student/my-status`, {
        method: "GET",
        credentials: "include",
      });

      const text = await res.text();

      let data = [];
      try {
        data = JSON.parse(text);
      } catch {
        data = [];
      }

      if (res.ok) {
        setMyStatuses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Fetch my statuses error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.mediaFile) {
      setError("Please upload image or video");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("caption", form.caption.trim());
      formData.append("statusMedia", form.mediaFile);

      const res = await fetch(`${API_BASE}/api/student/status`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Server did not return JSON. Check backend POST route.",
        );
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to create status");
      }

      setMessage("Status posted successfully");
      await fetchStatuses();
      await fetchMyStatuses();

      newStoryScrollRef.current = true;


      setTimeout(() => {
        closeCreateModal();
      }, 700);
    } catch (err) {
      console.error("Create status error:", err);
      setError(err.message || "Something went wrong while posting status");
    } finally {
      setLoading(false);
    }
  };

  const openViewer = (groupIndex) => {
    setActiveGroupIndex(groupIndex);
    setActiveStoryIndex(0);
    setViewerOpen(true);
    setReplyText("");
    setShowViewSheet(false);
    setIsReplyFocused(false);
  };

  const closeViewer = () => {
    clearViewerTimer();
    setViewerOpen(false);
    setActiveStoryIndex(0);
    setReplyText("");
    setShowViewSheet(false);
    setIsReplyFocused(false);
  };

  const handlePrev = () => {
    if (!activeGroup) return;

    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      return;
    }

    if (activeGroupIndex > 0) {
      const prevGroupIndex = activeGroupIndex - 1;
      const prevGroup = groupedStatuses[prevGroupIndex];

      setActiveGroupIndex(prevGroupIndex);
      setActiveStoryIndex((prevGroup?.stories?.length || 1) - 1);
    }
  };

  const handleNext = () => {
    if (!activeGroup) return;

    if (activeStoryIndex < activeGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      return;
    }

    if (activeGroupIndex < groupedStatuses.length - 1) {
      setActiveGroupIndex((prev) => prev + 1);
      setActiveStoryIndex(0);
      return;
    }

    closeViewer();
  };

  const getRemainingTime = (expiresAt) => {
    const diff = new Date(expiresAt).getTime() - Date.now();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours <= 0) return `${minutes}m left`;
    return `${hours}h ${minutes}m left`;
  };

  const sendHeartReaction = async () => {
    if (!currentStatus?._id) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/student/status/${currentStatus._id}/react`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emoji: "❤️" }),
        },
      );

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server did not return JSON");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to send heart");
      }

      await fetchStatuses();
      await fetchMyStatuses();
    } catch (err) {
      console.error("Heart reaction error:", err);
      alert(err.message || "Failed to send heart");
    }
  };

  const hasHeartReacted = (currentStatus?.reactions || []).some(
    (item) => String(item.userId) === String(loggedInUser?._id),
  );

  const sendReplyToStatus = async () => {
    if (!currentStatus?._id) return;
    if (!replyText.trim()) return;

    try {
      setSendingReply(true);

      const res = await fetch(
        `${API_BASE}/api/student/status/${currentStatus._id}/reply`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: replyText.trim() }),
        },
      );

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server did not return JSON");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to send reply");
      }

      setReplyText("");
      setIsReplyFocused(false);
      await fetchStatuses();
      await fetchMyStatuses();
    } catch (err) {
      console.error("Reply status error:", err);
      alert(err.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  const handleDeleteStatus = async () => {
    if (!currentStatus?._id) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this status permanently?",
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/student/status/${currentStatus._id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server did not return JSON");
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete status");
      }

      await fetchStatuses();
      await fetchMyStatuses();
      closeViewer();
      alert(data.message || "Status deleted permanently");
    } catch (err) {
      console.error("Delete status error:", err);
      alert(err.message || "Failed to delete status");
    }
  };



  useEffect(() => {

  if (!newStoryScrollRef.current) return;

  const el = stripRef.current;

  if (!el) return;


  setTimeout(()=>{

    el.scrollTo({
      left: el.scrollWidth,
      behavior:"smooth"
    });


    newStoryScrollRef.current = false;


  },300);


},[statuses]);




  return (
    <div className="student-status-page">
      <div className="student-status-shell">
        <div className="stories-board">
          <div className="stories-strip-wrap">
            {canScrollLeft && (
              <button
                type="button"
                className="stories-scroll-btn stories-scroll-left"
                onClick={() => scrollStories("left")}
              >
                ‹
              </button>
            )}

            <div className="stories-strip" ref={stripRef}>
              <button
                type="button"
                className="story-bubble own-story"
                onClick={openCreateModal}
              >
                <div className="story-ring own-ring">
                  <div className="story-avatar-box own-avatar-box">
                    <span className="story-plus">+</span>
                  </div>
                </div>
                <span className="story-name">Your Story</span>
              </button>

              {groupedStatuses.map((group, index) => (
                <button
                  key={group.userKey}
                  type="button"
                  className="story-bubble"
                  onClick={() => openViewer(index)}
                >
                  <div className="story-ring">
                    <img
                      src={
                        group.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          group.author || "Student",
                        )}&background=e5e7eb&color=111827`
                      }
                      alt={group.author || "Student"}
                      className="story-avatar"
                    />
                  </div>
                  <span className="story-name">
                    {group.author || "Student"}
                  </span>
                </button>
              ))}
            </div>

            {canScrollRight && (
              <button
                type="button"
                className="stories-scroll-btn stories-scroll-right"
                onClick={() => scrollStories("right")}
              >
                ›
              </button>
            )}
          </div>

          {fetching ? (
            <p className="story-info-text">Loading stories...</p>
          ) : null}

          {!fetching && groupedStatuses.length === 0 ? (
            <p className="story-info-text">
              No active stories. Click Your Story to post one.
            </p>
          ) : null}

          {error && !createOpen ? (
            <p className="story-info-text">{error}</p>
          ) : null}
        </div>

        {createOpen && (
          <div className="create-status-overlay" onClick={closeCreateModal}>
            <div
              className="create-status-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="create-modal-head">
                <h2>Create Status</h2>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={closeCreateModal}
                >
                  ×
                </button>
              </div>

              <form className="status-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <label>Caption</label>
                  <textarea
                    rows="4"
                    placeholder="Write something..."
                    value={form.caption}
                    onChange={(e) => handleCaptionChange(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <label>Upload Image / Video</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                  />
                </div>

                {form.mediaPreview && (
                  <div className="status-preview-box">
                    {form.mediaType === "image" ? (
                      <img
                        src={form.mediaPreview}
                        alt="preview"
                        className="status-preview-media"
                      />
                    ) : (
                      <video
                        src={form.mediaPreview}
                        controls
                        className="status-preview-media"
                      />
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary-btn"
                  disabled={loading}
                >
                  {loading ? "Posting..." : "Post Status"}
                </button>

                {message && <div className="success-box">{message}</div>}
                {error && <div className="error-box">{error}</div>}
              </form>
            </div>
          </div>
        )}






        {viewerOpen && currentStatus && activeGroup && (
  <div className="ig-story-overlay" onClick={closeViewer}>
    <button
      type="button"
      className="ig-global-close"
      onClick={closeViewer}
    >
      ×
    </button>

    <div className="ig-side-preview ig-side-preview-left">
      {activeGroupIndex > 0 && groupedStatuses[activeGroupIndex - 1] && (
        <button
          type="button"
          className="ig-side-card"
          onClick={(e) => {
            e.stopPropagation();
            setActiveGroupIndex((prev) => prev - 1);
            setActiveStoryIndex(0);
          }}
        >
          <img
            src={
              groupedStatuses[activeGroupIndex - 1].stories?.[0]?.imageUrl ||
              groupedStatuses[activeGroupIndex - 1].profileImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                groupedStatuses[activeGroupIndex - 1].author || "Student"
              )}&background=e5e7eb&color=111827`
            }
            alt="previous story"
            className="ig-side-bg"
          />
          <div className="ig-side-overlay">
            <img
              src={
                groupedStatuses[activeGroupIndex - 1].profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  groupedStatuses[activeGroupIndex - 1].author || "Student"
                )}&background=e5e7eb&color=111827`
              }
              alt="profile"
              className="ig-side-avatar"
            />
            <span>{groupedStatuses[activeGroupIndex - 1].author}</span>
          </div>
        </button>
      )}
    </div>

    <div
      className="ig-story-viewer insta-story-viewer"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="ig-story-top">
        <div className="ig-progress-wrap">
          {activeGroup.stories.map((_, i) => (
            <span
              key={i}
              className={`ig-progress-bar ${
                i < activeStoryIndex ? "done" : i === activeStoryIndex ? "active" : ""
              }`}
            />
          ))}
        </div>

        <div className="ig-story-userbar insta-story-userbar">
          <div className="ig-story-userleft">
            <img
              src={
                activeGroup.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  activeGroup.author || "Student"
                )}&background=e5e7eb&color=111827`
              }
              alt={activeGroup.author || "Student"}
              className="ig-story-user-avatar"
            />
            <div className="ig-story-usertext">
              <h4>{activeGroup.author || "Student"}</h4>
              <p>{getRemainingTime(currentStatus.expiresAt)}</p>
            </div>
          </div>

          <div className="insta-top-actions">
            {isOwnStatus && (
              <button
                type="button"
                className="story-delete-btn"
                onClick={handleDeleteStatus}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="ig-story-main insta-story-main">
        <button
          type="button"
          className="ig-nav ig-nav-left"
          onClick={handlePrev}
          disabled={activeGroupIndex === 0 && activeStoryIndex === 0}
        >
          ‹
        </button>

        <div className="ig-story-media-wrap insta-story-media-wrap">
          {currentStatus.mediaType === "image" ? (
            <img
              src={currentStatus.imageUrl}
              alt="story"
              className="ig-story-media insta-story-media"
            />
          ) : (
            <video
              ref={videoRef}
              src={currentStatus.videoUrl}
              className="ig-story-media insta-story-media"
              controls
              autoPlay
              onEnded={handleNext}
            />
          )}

          {currentStatus.caption ? (
            <div className="insta-story-caption">{currentStatus.caption}</div>
          ) : null}
        </div>

        <button
          type="button"
          className="ig-nav ig-nav-right"
          onClick={handleNext}
          disabled={
            activeGroupIndex === groupedStatuses.length - 1 &&
            activeStoryIndex === activeGroup.stories.length - 1
          }
        >
          ›
        </button>
      </div>

      <div className="ig-story-bottom insta-story-bottom">
        {isOwnStatus ? (
          <div className="ig-own-story-insights full-width-insights">
            <button
              type="button"
              className="story-views-trigger"
              onClick={() => setShowViewSheet((prev) => !prev)}
            >
              <div className="story-viewers-mini">
                {filteredViewers.slice(0, 3).map((viewer, index) => (
                  <img
                    key={index}
                    src={
                      viewer.profileImage ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        viewer.name || "User"
                      )}&background=e5e7eb&color=111827`
                    }
                    alt={viewer.name || "viewer"}
                    className="story-mini-avatar"
                  />
                ))}
              </div>

              <div className="story-view-count-text">
                <strong>{filteredViewers.length}</strong> views
              </div>
            </button>
          </div>
        ) : (
          <>
            <div className="ig-reply-box insta-reply-box">
              <input
                type="text"
                placeholder={`Reply to ${activeGroup.author || "story"}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsReplyFocused(true)}
                onBlur={() => setIsReplyFocused(false)}
              />
            </div>

            <div className="ig-story-actions insta-story-actions">
              <button
                type="button"
                onClick={sendHeartReaction}
                className={hasHeartReacted ? "story-heart-btn active" : "story-heart-btn"}
              >
                <Heart size={20} className="story-heart-icon-ui" />
              </button>

              <button
                type="button"
                className="insta-send-btn"
                onClick={sendReplyToStatus}
              >
                {sendingReply ? "..." : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>

    <div className="ig-side-preview ig-side-preview-right">
      {activeGroupIndex < groupedStatuses.length - 1 &&
        groupedStatuses[activeGroupIndex + 1] && (
          <button
            type="button"
            className="ig-side-card"
            onClick={(e) => {
              e.stopPropagation();
              setActiveGroupIndex((prev) => prev + 1);
              setActiveStoryIndex(0);
            }}
          >
            <img
              src={
                groupedStatuses[activeGroupIndex + 1].stories?.[0]?.imageUrl ||
                groupedStatuses[activeGroupIndex + 1].profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  groupedStatuses[activeGroupIndex + 1].author || "Student"
                )}&background=e5e7eb&color=111827`
              }
              alt="next story"
              className="ig-side-bg"
            />
            <div className="ig-side-overlay">
              <img
                src={
                  groupedStatuses[activeGroupIndex + 1].profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    groupedStatuses[activeGroupIndex + 1].author || "Student"
                  )}&background=e5e7eb&color=111827`
                }
                alt="profile"
                className="ig-side-avatar"
              />
              <span>{groupedStatuses[activeGroupIndex + 1].author}</span>
            </div>
          </button>
        )}
    </div>
  </div>
)}




















        {showViewSheet && currentStatus && (
          <div
            className="story-view-sheet-overlay"
            onClick={() => setShowViewSheet(false)}
          >
            <div
              className="story-view-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="story-view-sheet-head">
                <h3>Views & Reactions</h3>
                <button type="button" onClick={() => setShowViewSheet(false)}>
                  ×
                </button>
              </div>

              <div className="story-view-section">
                <h4>Viewed by ({filteredViewers.length})</h4>
                {filteredViewers.length === 0 ? (
                  <p className="story-empty-text">No views yet</p>
                ) : (
                  filteredViewers.map((viewer, index) => (
                    <div key={index} className="story-user-row">
                      <img
                        src={
                          viewer.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            viewer.name || "User",
                          )}&background=e5e7eb&color=111827`
                        }
                        alt={viewer.name || "viewer"}
                        className="story-user-row-avatar"
                      />
                      <div>
                        <strong>{viewer.name || "User"}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="story-view-section">
                <h4>Hearts ({currentStatus.reactions?.length || 0})</h4>
                {(currentStatus.reactions || []).length === 0 ? (
                  <p className="story-empty-text">No hearts yet</p>
                ) : (
                  currentStatus.reactions.map((item, index) => (
                    <div key={index} className="story-user-row">
                      <img
                        src={
                          item.profileImage ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            item.name || "User",
                          )}&background=e5e7eb&color=111827`
                        }
                        alt={item.name || "user"}
                        className="story-user-row-avatar"
                      />
                      <div>
                        <strong>{item.name || "User"}</strong>
                      </div>
                      <span className="story-heart-icon">
                        {item.emoji || "❤️"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
