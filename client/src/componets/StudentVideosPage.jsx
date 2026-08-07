import { useEffect, useRef, useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  MoreHorizontal,
  Trash2,
  Send,
  X,
  Bookmark,
  Volume2,
  VolumeX,
  Search,
} from "lucide-react";
import "./StudentVideosPage.css";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

function formatCount(value) {
  const num = Number(value || 0);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return `${num}`;
}

export default function StudentVideosPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const [commentReel, setCommentReel] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [reelComments, setReelComments] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replyText, setReplyText] = useState({});
  const [mutedMap, setMutedMap] = useState({});
  const [shareReel, setShareReel] = useState(null);
  const [shareSearch, setShareSearch] = useState("");

  const [shareUsers, setShareUsers] = useState([]);

  useEffect(() => {
    if (!shareReel) return;

    fetch(`${API_BASE}/api/student/share/users`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then((data) => {
        setShareUsers(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, [shareReel]);

  const videoRefs = useRef({});
  const navigate = useNavigate();

  const fetchReels = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/student/reels`, {
        credentials: "include",
      });

      const rawText = await res.text();
      let data = [];

      try {
        data = rawText ? JSON.parse(rawText) : [];
      } catch (err) {
        console.error("Reels response is not valid JSON:", rawText);
        return;
      }

      if (!res.ok) {
        console.error(data.message || "Failed to fetch reels");
        return;
      }

      setReels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch reels error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.dataset.id;
          const video = videoRefs.current[id];
          if (!video) return;

          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0.3, 0.7, 1] },
    );

    Object.values(videoRefs.current).forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [reels]);

  const toggleMute = (reelId) => {
    const video = videoRefs.current[reelId];
    if (!video) return;

    video.muted = !video.muted;
    setMutedMap((prev) => ({
      ...prev,
      [reelId]: video.muted,
    }));
  };

  const togglePlayPause = (reelId) => {
    const video = videoRefs.current[reelId];
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleLike = async (reelId) => {
    try {
      const res = await fetch(`${API_BASE}/api/student/posts/${reelId}/like`, {
        method: "PUT",
        credentials: "include",
      });

      const rawText = await res.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (err) {
        console.error("Like reel response invalid:", rawText);
        return;
      }

      if (!res.ok) {
        console.error(data.message || "Failed to like reel");
        return;
      }

      setReels((prev) =>
        prev.map((reel) =>
          reel._id === reelId
            ? {
                ...reel,
                isLiked: data.isLiked,
                likesCount: data.likesCount ?? reel.likesCount ?? 0,
              }
            : reel,
        ),
      );
    } catch (error) {
      console.error("Like reel error:", error);
    }
  };
  const toggleSave = async (reelId) => {
    try {
      const res = await fetch(`${API_BASE}/api/student/posts/${reelId}/save`, {
        method: "PUT",
        credentials: "include",
      });

      const rawText = await res.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (err) {
        console.error("Save response invalid:", rawText);
        return;
      }

      if (!res.ok) {
        console.error(data.message || "Failed to save reel");
        return;
      }

      setReels((prev) =>
        prev.map((reel) =>
          reel._id === reelId
            ? {
                ...reel,
                isSaved: data.isSaved,
              }
            : reel,
        ),
      );
    } catch (error) {
      console.error("Save reel error:", error);
    }
  };

  const deleteReel = async (reelId) => {
    const confirmed = window.confirm("Do you want to delete this reel?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/student/reels/${reelId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const rawText = await res.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (err) {
        console.error("Delete reel response invalid:", rawText);
        return;
      }

      if (!res.ok) {
        alert(data.message || "Failed to delete reel");
        return;
      }

      setReels((prev) => prev.filter((reel) => reel._id !== reelId));
      setMenuOpenId(null);
    } catch (error) {
      console.error("Delete reel error:", error);
      alert("Something went wrong");
    }
  };

  const openComments = (reel) => {
    setReelComments((prev) => ({
      ...prev,
      [reel._id]: reel.comments || [],
    }));
    setCommentReel(reel);
  };

  const addComment = async () => {
    if (!newComment.trim() || !commentReel) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${commentReel._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ text: newComment.trim() }),
        },
      );

      const rawText = await res.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (err) {
        console.error("Comment response invalid:", rawText);
        return;
      }

      if (!res.ok) {
        console.error(data.message || "Failed to add comment");
        return;
      }

      setReelComments((prev) => ({
        ...prev,
        [commentReel._id]: data.comments || [],
      }));

      setReels((prev) =>
        prev.map((reel) =>
          reel._id === commentReel._id
            ? {
                ...reel,
                comments: data.comments || [],
                commentsCount: data.comments?.length || 0,
              }
            : reel,
        ),
      );

      setNewComment("");
    } catch (error) {
      console.error("Add comment error:", error);
    }
  };

  const toggleCommentLike = async (reelId, commentId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${reelId}/comments/${commentId}/like`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      const rawText = await res.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (err) {
        console.error("Comment like response invalid:", rawText);
        return;
      }

      if (!res.ok) {
        console.error(data.message || "Failed to like comment");
        return;
      }

      const updatedComments =
        data.comments ||
        reelComments[reelId]?.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                likes: data.likes || comment.likes || [],
              }
            : comment,
        ) ||
        [];

      setReelComments((prev) => ({
        ...prev,
        [reelId]: updatedComments,
      }));
    } catch (error) {
      console.error("Comment like error:", error);
    }
  };

  const toggleReplyInput = (commentId) => {
    setReplyInputs((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const addReply = async (reelId, commentId) => {
    const text = replyText[commentId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${reelId}/comments/${commentId}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ text }),
        },
      );

      const rawText = await res.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (err) {
        console.error("Reply response invalid:", rawText);
        return;
      }

      if (!res.ok) {
        console.error(data.message || "Failed to add reply");
        return;
      }

      setReelComments((prev) => ({
        ...prev,
        [reelId]: data.comments || [],
      }));

      setReplyText((prev) => ({
        ...prev,
        [commentId]: "",
      }));

      setReplyInputs((prev) => ({
        ...prev,
        [commentId]: false,
      }));
    } catch (error) {
      console.error("Reply error:", error);
    }
  };

  const currentComments = commentReel
    ? reelComments[commentReel._id] || []
    : [];

  if (loading) {
    return <div className="reels-loading">Loading reels...</div>;
  }

  if (!reels.length) {
    return <div className="reels-loading">No reels found.</div>;
  }

  const filteredShareUsers = shareUsers.filter((user) =>
    user.name.toLowerCase().includes(shareSearch.toLowerCase()),
  );

  const handleCopyLink = async (reel) => {
    const reelLink = `${window.location.origin}/student/reel/${reel._id}`;
    try {
      await navigator.clipboard.writeText(reelLink);
      alert("Link copied");
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const handleShareToUser = async (user, reel) => {
    try {
      const res = await fetch(`${API_BASE}/api/student/share/reel`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiverId: user._id,
          reelId: reel._id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert(data.message || "Shared successfully");
      setShareReel(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExternalShare = (type, reel) => {
    const reelLink = `${window.location.origin}/student/reel/${reel._id}`;
    const text = encodeURIComponent(reel.content || "Check this reel");

    if (type === "whatsapp") {
      window.open(
        `https://wa.me/?text=${text}%20${encodeURIComponent(reelLink)}`,
        "_blank",
      );
    } else if (type === "facebook") {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reelLink)}`,
        "_blank",
      );
    } else if (type === "messenger") {
      alert("Messenger share can be connected later");
    } else if (type === "email") {
      window.location.href = `mailto:?subject=Check this reel&body=${text}%20${reelLink}`;
    } else if (type === "threads") {
      alert("Threads share can be connected later");
    } else if (type === "x") {
      window.open(
        `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(reelLink)}`,
        "_blank",
      );
    }
  };

  const sendFollowRequest = async (receiverId) => {
    try {
      const res = await fetch(`${API_BASE}/api/student/request/${receiverId}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to send request");
        return;
      }

      alert(data.message || "Request sent successfully");
    } catch (error) {
      console.error("Follow request error:", error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="reels-feed-page">
      {reels.map((reel) => (
        <section className="reel-stage" key={reel._id}>
          <div className="reel-phone-frame">
            <div className="reel-video-wrapper">
              {reel.videoUrl ? (
                <video
                  ref={(el) => {
                    if (el) videoRefs.current[reel._id] = el;
                  }}
                  data-id={reel._id}
                  className="reel-full-video"
                  playsInline
                  loop
                  muted={mutedMap[reel._id] ?? true}
                  autoPlay
                  onClick={() => togglePlayPause(reel._id)}
                >
                  <source src={reel.videoUrl} type="video/mp4" />
                </video>
              ) : reel.imageUrl ? (
                <img
                  src={reel.imageUrl}
                  alt="reel"
                  className="reel-full-video"
                />
              ) : (
                <div className="reel-no-media">No media</div>
              )}

              <div className="reel-top-bar">
                {reel.videoUrl ? (
                  <button
                    type="button"
                    className="sound-toggle-btn"
                    onClick={() => toggleMute(reel._id)}
                  >
                    {(mutedMap[reel._id] ?? true) ? (
                      <VolumeX size={17} />
                    ) : (
                      <Volume2 size={17} />
                    )}
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  className="reel-top-icon"
                  onClick={() =>
                    setMenuOpenId(menuOpenId === reel._id ? null : reel._id)
                  }
                >
                  <MoreHorizontal size={20} />
                </button>

                {menuOpenId === reel._id && (
                  <div className="reel-top-dropdown">
                    <button type="button" onClick={() => deleteReel(reel._id)}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                )}
              </div>





             <div className="reel-right-actions">
  <button
    className={`reel-side-action ${reel.isLiked ? "active" : ""}`}
    onClick={() => toggleLike(reel._id)}
  >
    <Heart fill={reel.isLiked ? "#ff3040" : "none"} size={30} />
    <span>{formatCount(reel.likes?.length || reel.likesCount || 0)}</span>
  </button>

  <button
    className="reel-side-action"
    onClick={() => openComments(reel)}
  >
    <MessageCircle size={30} />
    <span>{formatCount(reel.commentsCount || 0)}</span>
  </button>

  <button
    className="reel-side-action"
    onClick={() => setShareReel(reel)}
  >
    <Send size={28} />
  </button>

  <button
    className={`reel-side-action ${reel.isSaved ? "saved" : ""}`}
    onClick={() => toggleSave(reel._id)}
  >
    <Bookmark size={28} />
  </button>

  <button
    className="reel-side-action"
    onClick={() =>
      setMenuOpenId(menuOpenId === reel._id ? null : reel._id)
    }
  >
    <MoreHorizontal size={28} />
  </button>
</div>











              <div className="reel-bottom-overlay">
                <div className="reel-bottom-top-row">
                  <div
                    className="reel-profile-click"
                    onClick={() =>
                      navigate(`/student/profile/${reel.authorId}`)
                    }
                  >
                    <img
                      src={
                        reel.profileImage || "https://i.pravatar.cc/150?img=8"
                      }
                      alt={reel.author || "Student"}
                      className="reel-user-avatar"
                    />

                    <div className="reel-middle-meta">
                      <h4>{reel.author || "prajithparameswaran"}</h4>
                      <div className="reel-tag-row">
                        <span className="reel-tag-text">
                          <p>{reel.content}</p>
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="reel-follow-btn"
                    onClick={() => sendFollowRequest(reel.authorId)}
                  >
                    Follow
                  </button>
                </div>

                {/*{reel.content ? (
                  <p className="reel-bottom-caption">{reel.content}</p>
                ) : (
                  <p className="reel-bottom-caption">This😍</p>
                )}*/}
              </div>
            </div>
          </div>
        </section>
      ))}

      {commentReel && (
        <div className="commentPopup" onClick={() => setCommentReel(null)}>
          <div className="commentBox" onClick={(e) => e.stopPropagation()}>
            <div className="commentHeader">
              <h3>Comments</h3>
              <button
                type="button"
                className="iconOnlyBtn"
                onClick={() => setCommentReel(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="commentCountText">
              {currentComments.length} comments
            </div>

            <div className="commentInputBox">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addComment()}
              />
              <button type="button" onClick={addComment}>
                <Send size={18} />
              </button>
            </div>

            <div className="commentList">
              {currentComments.length === 0 ? (
                <div className="noComments">No comments yet.</div>
              ) : (
                currentComments.map((comment) => (
                  <div className="commentCard" key={comment._id}>
                    <div className="commentTop">
                      <img
                        src={
                          comment.profileImage ||
                          "https://i.pravatar.cc/150?img=10"
                        }
                        alt="comment user"
                        className="commentAvatar"
                      />

                      <div className="commentContentBox">
                        <div className="commentMeta">
                          <div>
                            <h4>
                              {comment.name || comment.userName || "User"}
                            </h4>
                            <span>
                              {comment.createdAt
                                ? new Date(comment.createdAt).toLocaleString()
                                : "Now"}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="commentLikeBtn"
                            onClick={() =>
                              toggleCommentLike(commentReel._id, comment._id)
                            }
                          >
                            <Heart size={16} />
                            <span>{comment.likes?.length || 0}</span>
                          </button>
                        </div>

                        <p>{comment.text}</p>

                        <button
                          type="button"
                          className="replyToggleBtn"
                          onClick={() => toggleReplyInput(comment._id)}
                        >
                          Reply
                        </button>

                        {replyInputs[comment._id] && (
                          <div className="replyInputBox">
                            <input
                              type="text"
                              placeholder="Write a reply..."
                              value={replyText[comment._id] || ""}
                              onChange={(e) =>
                                setReplyText((prev) => ({
                                  ...prev,
                                  [comment._id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                addReply(commentReel._id, comment._id)
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                addReply(commentReel._id, comment._id)
                              }
                            >
                              <Send size={16} />
                            </button>
                          </div>
                        )}

                        {comment.replies?.length > 0 && (
                          <div className="replyList">
                            {comment.replies.map((reply, index) => (
                              <div
                                className="replyCard"
                                key={reply._id || index}
                              >
                                <img
                                  src={
                                    reply.profileImage ||
                                    "https://i.pravatar.cc/150?img=14"
                                  }
                                  alt="reply user"
                                  className="replyAvatar"
                                />
                                <div className="replyBody">
                                  <h5>{reply.name || "User"}</h5>
                                  <p>{reply.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {shareReel && (
        <div className="sharePopupOverlay" onClick={() => setShareReel(null)}>
          <div className="sharePopupBox" onClick={(e) => e.stopPropagation()}>
            <div className="sharePopupHeader">
              <button
                type="button"
                className="shareCloseBtn"
                onClick={() => setShareReel(null)}
              >
                <X size={28} />
              </button>
              <h3>Share</h3>
              <div style={{ width: "28px" }} />
            </div>

            <div className="shareSearchBox">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search"
                value={shareSearch}
                onChange={(e) => setShareSearch(e.target.value)}
              />
            </div>

            <div className="shareUsersGrid">
              {filteredShareUsers.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  className="shareUserCard"
                  onClick={() => handleShareToUser(user, shareReel)}
                >
                  <img
                    src={user.profileImage || "https://i.pravatar.cc/150"}
                    alt={user.name}
                  />{" "}
                  <span>{user.name}</span>
                </button>
              ))}
            </div>

            <div className="shareBottomBar">
              <button
                type="button"
                className="shareBottomAction"
                onClick={() => handleCopyLink(shareReel)}
              >
                <div className="shareBottomIcon">🔗</div>
                <span>Copy link</span>
              </button>

              <button
                type="button"
                className="shareBottomAction"
                onClick={() => handleExternalShare("facebook", shareReel)}
              >
                <div className="shareBottomIcon">f</div>
                <span>Facebook</span>
              </button>

              <button
                type="button"
                className="shareBottomAction"
                onClick={() => handleExternalShare("messenger", shareReel)}
              >
                <div className="shareBottomIcon">💬</div>
                <span>Messenger</span>
              </button>

              <button
                type="button"
                className="shareBottomAction"
                onClick={() => handleExternalShare("whatsapp", shareReel)}
              >
                <div className="shareBottomIcon">🟢</div>
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                className="shareBottomAction"
                onClick={() => handleExternalShare("email", shareReel)}
              >
                <div className="shareBottomIcon">✉️</div>
                <span>Email</span>
              </button>

              <button
                type="button"
                className="shareBottomAction"
                onClick={() => handleExternalShare("threads", shareReel)}
              >
                <div className="shareBottomIcon">@</div>
                <span>Threads</span>
              </button>

              <button
                type="button"
                className="shareBottomAction"
                onClick={() => handleExternalShare("x", shareReel)}
              >
                <div className="shareBottomIcon">𝕏</div>
                <span>X</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
