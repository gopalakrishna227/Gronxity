import { Heart, MessageCircle, Send, X } from "lucide-react";

import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import "./StudentNotificationPostDetails.css";
import "./StudentHomePage.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function StudentNotificationPostDetails() {
  const { id } = useParams();
  const location = useLocation();

  const [post, setPost] = useState(null);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const [newComment, setNewComment] = useState("");
  const [postComments, setPostComments] = useState([]);

  const [replyInputs, setReplyInputs] = useState({});
  const [replyText, setReplyText] = useState({});
  const [commentPost, setCommentPost] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("comment") === "true") {
      setCommentPost(post);
    }

    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/student/posts/${id}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        return;
      }

      const postData = data.post || data;

      setPost(postData);

      setLiked(postData.isLiked || false);
      setLikesCount(postData.likesCount || 0);
      setPostComments(postData.comments || []);
    } catch (err) {
      console.log(err);
    }
  };

  if (!post) {
    return <h2>Loading...</h2>;
  }

  const toggleLike = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${post._id}/like`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      const data = await res.json();

      if (!res.ok) return;

      setLiked(data.isLiked);
      setLikesCount(data.likesCount);
    } catch (err) {
      console.log(err);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${post._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            text: newComment,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) return;

      setPostComments(data.comments || []);
      setNewComment("");
    } catch (err) {
      console.log(err);
    }
  };

  const toggleCommentLike = async (commentId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${post._id}/comments/${commentId}/like`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      if (!res.ok) return;

      fetchPost();
    } catch (err) {
      console.log(err);
    }
  };

  const addReply = async (commentId) => {
    const text = replyText[commentId]?.trim();

    if (!text) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${post._id}/comments/${commentId}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ text }),
        },
      );

      const data = await res.json();

      if (!res.ok) return;

      setPostComments(data.comments || []);

      setReplyText((prev) => ({
        ...prev,
        [commentId]: "",
      }));

      setReplyInputs((prev) => ({
        ...prev,
        [commentId]: false,
      }));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="postCard notificationPostCard">
      <div className="postHeader">
        <div className="headerLeft">
          <img
            src={post.profileImage || "https://i.pravatar.cc/150?img=8"}
            alt="profile"
            className="profileImage clickableProfile"
            onClick={() => navigate(`/student/profile/${post.userId}`)}
          />

          <div className="userInfo">
            <h4>{post.author}</h4>

            <span>{new Date(post.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <p className="postContent">{post.content}</p>
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          style={{
            width: "100%",
            borderRadius: "10px",
          }}
        />
      )}

      {post.videoUrl && (
        <video controls width="100%">
          <source src={post.videoUrl} />
        </video>
      )}

      <div className="postActions">

  <div className="leftActions">

    <button
      type="button"
      className="actionWithCount actionBtnIcon"
      onClick={toggleLike}
    >
      <Heart
        size={22}
        className={liked ? "likedIcon" : ""}
      />
      <span>{likesCount}</span>
    </button>

    <button
      type="button"
      className="actionWithCount actionBtnIcon"
      onClick={() => setCommentPost(post)}
    >
      <MessageCircle size={22} />
      <span>{postComments.length}</span>
    </button>

  </div>

</div>

      <div className="postStats">
        <span>{likesCount} Likes</span>

        <span className="viewCommentsText" onClick={() => setCommentPost(post)}>
          View all {postComments.length} comments
        </span>
      </div>

      {commentPost && (
        <div className="commentPopup" onClick={() => setCommentPost(null)}>
          <div className="commentBox" onClick={(e) => e.stopPropagation()}>
            <div className="commentHeader">
              <h3>Comments</h3>

              <button
                className="iconOnlyBtn"
                onClick={() => setCommentPost(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="commentCountText">
              {postComments.length} comments
            </div>

                    <div className="commentInputBox">
                <input
                    value={newComment}
                    placeholder="Write a comment..."
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                    if (e.key === "Enter") addComment();
                    }}
                />

                <button
  type="button"
  className="replySendBtn"
  onClick={() => addReply(comment._id)}
>
  <Send size={16} />
</button>
                </div>

            <div className="commentList">
              {postComments.length === 0 ? (
                <div className="noComments">No comments yet.</div>
              ) : (
                postComments.map((comment) => (
                  <div className="commentCard" key={comment._id}>
                    <div className="commentTop">
                      <img
                        src={
                          comment.profileImage ||
                          "https://i.pravatar.cc/150?img=10"
                        }
                        className="commentAvatar"
                        alt=""
                      />

                      <div className="commentContentBox">
                        <div className="commentMeta">
                          <div>
                            <h4>{comment.name}</h4>

                            <span>
                              {comment.createdAt
                                ? new Date(comment.createdAt).toLocaleString()
                                : ""}
                            </span>
                          </div>
                        </div>

                        <p>{comment.text}</p>

                        <div className="commentActionsRow">
                          <button
                            className={`actionBtn ${
                              comment.isLiked ? "liked" : ""
                            }`}
                            onClick={() => toggleCommentLike(comment._id)}
                          >
                            <Heart size={16} />
                            <span>{comment.likes?.length || 0}</span>
                          </button>

                          <button
                            className="actionBtn"
                            onClick={() =>
                              setReplyInputs((prev) => ({
                                ...prev,
                                [comment._id]: !prev[comment._id],
                              }))
                            }
                          >
                            Reply
                          </button>
                        </div>

                        {replyInputs[comment._id] && (
                          <div className="replyInputBox">
                            <input
                              placeholder="Write reply..."
                              value={replyText[comment._id] || ""}
                              onChange={(e) =>
                                setReplyText((prev) => ({
                                  ...prev,
                                  [comment._id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") addReply(comment._id);
                              }}
                            />

                            <button
                              className="replySendBtn"
                              onClick={() => addReply(comment._id)}
                            >
                              Send
                            </button>
                          </div>
                        )}

                        {comment.replies?.length > 0 && (
                          <div className="replyList">
                            {comment.replies.map((reply) => (
                              <div className="replyCard" key={reply._id}>
                                <img
                                  src={
                                    reply.profileImage ||
                                    "https://i.pravatar.cc/150?img=20"
                                  }
                                  className="replyAvatar"
                                  alt=""
                                />

                                <div className="replyContent">
                                  <h5>{reply.name}</h5>

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
    </div>
  );
}
