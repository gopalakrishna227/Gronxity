import { useEffect, useState } from "react";
import "./StudentStatusViewer.css";

export default function StudentStatusViewer() {
  const [usersStatus, setUsersStatus] = useState([]);
  const [selectedUserIndex, setSelectedUserIndex] = useState(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [isPaused, setIsPaused] = useState(false);
const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/student/status/grouped`, {
        credentials: "include",
      });

      const text = await res.text();
      console.log("status response:", text);

      const data = text ? JSON.parse(text) : [];

      if (!res.ok) {
        console.log(data.message || "Failed to fetch statuses");
        return;
      }

      setUsersStatus(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch statuses error:", err);
    }
  };

  useEffect(() => {
    if (selectedUserIndex === null) return;

    const currentUser = usersStatus[selectedUserIndex];
    const currentItem = currentUser?.items?.[selectedItemIndex];
    if (!currentItem) return;

    if (currentItem.mediaType === "image") {
      const timer = setTimeout(() => {
        goNext();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [selectedUserIndex, selectedItemIndex, usersStatus]);

  const openStory = (userIndex) => {
    setSelectedUserIndex(userIndex);
    setSelectedItemIndex(0);
    setReplyText("");
  };

  const closeStory = () => {
    setSelectedUserIndex(null);
    setSelectedItemIndex(0);
    setReplyText("");
  };

  const goNext = () => {
    if (selectedUserIndex === null) return;

    const currentUser = usersStatus[selectedUserIndex];
    if (!currentUser || !currentUser.items?.length) return;

    if (selectedItemIndex < currentUser.items.length - 1) {
      setSelectedItemIndex((prev) => prev + 1);
    } else if (selectedUserIndex < usersStatus.length - 1) {
      setSelectedUserIndex((prev) => prev + 1);
      setSelectedItemIndex(0);
    } else {
      closeStory();
    }
  };

  const goPrev = () => {
    if (selectedUserIndex === null) return;

    if (selectedItemIndex > 0) {
      setSelectedItemIndex((prev) => prev - 1);
    } else if (selectedUserIndex > 0) {
      const prevUserIndex = selectedUserIndex - 1;
      const prevUser = usersStatus[prevUserIndex];
      setSelectedUserIndex(prevUserIndex);
      setSelectedItemIndex((prevUser?.items?.length || 1) - 1);
    }
  };

  const handleReplySend = () => {
    if (!replyText.trim()) return;
    alert(`Reply sent: ${replyText}`);
    setReplyText("");
  };

  const handleHeartClick = () => {
    alert("Heart sent ❤️");
  };

  const currentUser =
    selectedUserIndex !== null ? usersStatus[selectedUserIndex] : null;
  const currentItem = currentUser?.items?.[selectedItemIndex];

  return (
    <div>
      <div className="status-row">
        {usersStatus.map((user, index) => (
          <div
            key={user.userId || index}
            className="status-avatar-card"
            onClick={() => openStory(index)}
          >
            <div className="status-avatar-ring">
              <img
                src={user.profileImage || "https://i.pravatar.cc/150?img=10"}
                alt={user.author}
                className="status-avatar"
              />
            </div>
            <p>{user.author}</p>
          </div>
        ))}
      </div>

      {currentItem && (
        <div className="story-modal">
          <div className="story-content">
            <button className="story-close" onClick={closeStory}>
              ✕
            </button>

            <div className="story-progress-bars">
              {currentUser?.items?.map((_, index) => (
                <span
                  key={index}
                  className={`story-progress-bar ${
                    index < selectedItemIndex
                      ? "done"
                      : index === selectedItemIndex
                      ? "active"
                      : ""
                  }`}
                />
              ))}
            </div>

            <div className="story-header">
              <div className="story-header-left">
                <img
                  src={currentUser.profileImage || "https://i.pravatar.cc/150?img=10"}
                  alt={currentUser.author}
                  className="story-header-avatar"
                />
                <span>{currentUser.author}</span>
              </div>
            </div>

            <div className="story-body">
              {currentItem.mediaType === "image" ? (
                <img
                  src={currentItem.imageUrl}
                  alt="story"
                  className="story-media"
                />
              ) : (
                <video
                  src={currentItem.videoUrl}
                  className="story-media"
                  autoPlay
                  controls
                  onEnded={goNext}
                />
              )}
            </div>

            <div className="story-bottom">
              <div className="story-caption-area">
                {currentItem.caption ? (
                  <div className="story-caption">{currentItem.caption}</div>
                ) : null}

                <input
                  type="text"
                  placeholder="Reply to story..."
                  className="story-reply-input"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleReplySend();
                    }
                  }}
                />
              </div>

              <button className="story-heart-btn" onClick={handleHeartClick}>
                ♡
              </button>

              <button className="story-send-btn" onClick={handleReplySend}>
                Send
              </button>
            </div>

            <button className="story-prev" onClick={goPrev}>
              ‹
            </button>
            <button className="story-next" onClick={goNext}>
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}