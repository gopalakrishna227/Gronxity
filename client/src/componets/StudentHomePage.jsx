import { useEffect, useState } from "react";
import {
  Heart,
  Plus,
  Bookmark,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Link2,
  X,
} from "lucide-react";
import "./StudentHomePage.css";
import StudentStatus from "./StudentStatus";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "./StudentNavbar";
import TrendingHashtagsPage from "./TrendingHashtagsPage";


const API_BASE = import.meta.env.VITE_API_URL;

export default function StudentHomePage() {
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  const [commentPost, setCommentPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [postComments, setPostComments] = useState({});

  const [replyInputs, setReplyInputs] = useState({});
  const [replyText, setReplyText] = useState({});

  const [sharePost, setSharePost] = useState(null);
  const [postLikes, setPostLikes] = useState({});
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [feedType, setFeedType] = useState("For You");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showNavbar, setShowNavbar] = useState(true);
  const navigate = useNavigate();

  const appFriends = [
    { id: 1, name: "Aarav", avatar: "https://i.pravatar.cc/150?img=12" },
    { id: 2, name: "Priya", avatar: "https://i.pravatar.cc/150?img=32" },
    { id: 3, name: "Nikhil", avatar: "https://i.pravatar.cc/150?img=15" },
    { id: 4, name: "Sana", avatar: "https://i.pravatar.cc/150?img=25" },
  ];

  const fetchTrendingTopics = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/student/trending-topics?limit=8`,
        {
          credentials: "include",
        },
      );
      if (!res.ok) {
        setTrendingTopics([]);
        return;
      }
      const data = await res.json();
      setTrendingTopics(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Error fetching trending topics:", error);
      setTrendingTopics([]);
    } finally {
      setTrendingLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      console.log("Fetching feed:", feedType);

      const res = await fetch(
        `${API_BASE}/api/student/posts?feed=${feedType}`,
        {
          credentials: "include",
        },
      );

      const rawText = await res.text();
      const data = JSON.parse(rawText);

      if (!res.ok) {
        console.log(data.message || "Failed to fetch posts");
        return;
      }

      setPosts(data);

      const likesMap = {};
      const likedIds = [];
      const savedOnly = [];

      data.forEach((post) => {
        likesMap[post._id] = post.likesCount || 0;
        if (post.isLiked) likedIds.push(post._id);
        if (post.isSaved) savedOnly.push(post);
      });

      setPostLikes(likesMap);
      setLikedPosts(likedIds);
      setSavedPosts(savedOnly);
    } catch (error) {
      console.log("Error fetching posts:", error);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/student/saved-posts`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.log(data.message || "Failed to fetch saved posts");
        return;
      }

      const onlyPosts = data.filter((item) => item.itemType === "post");

      setSavedPosts(onlyPosts);

      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          isSaved: onlyPosts.some((item) => item._id === post._id),
        })),
      );
    } catch (error) {
      console.log("Fetch saved posts error:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [feedType]);

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  const toggleSave = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/api/student/posts/${postId}/save`, {
        method: "PUT",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.log(data.message || "Failed to save post");
        return;
      }

      let updatedPost = null;

      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            updatedPost = { ...post, isSaved: data.isSaved };
            return updatedPost;
          }
          return post;
        }),
      );

      setSavedPosts((prev) => {
        if (data.isSaved) {
          const alreadyExists = prev.some((p) => p._id === postId);
          if (alreadyExists || !updatedPost) return prev;
          return [updatedPost, ...prev];
        }

        return prev.filter((p) => p._id !== postId);
      });
    } catch (err) {
      console.log("Save error:", err);
    }
  };

  const openStudentProfile = (post) => {
    if (!post?.userId && !post?._id) return;

    const profileId =
      typeof post.userId === "object" ? post.userId._id : post.userId;

    if (profileId) {
      navigate(`/student/profile/${profileId}`);
    }
  };

  const toggleLike = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/api/student/posts/${postId}/like`, {
        method: "PUT",
        credentials: "include",
      });

      const rawText = await res.text();
      const data = JSON.parse(rawText);

      if (!res.ok) {
        console.log(data.message || "Failed to toggle like");
        return;
      }

      if (data.isLiked) {
        setLikedPosts((prev) => [...prev, postId]);
      } else {
        setLikedPosts((prev) => prev.filter((id) => id !== postId));
      }

      setPostLikes((prev) => ({
        ...prev,
        [postId]: data.likesCount || 0,
      }));
    } catch (error) {
      console.log("Like error:", error);
    }
  };

  const openComments = (post) => {
    setPostComments((prev) => ({
      ...prev,
      [post._id]: post.comments || [],
    }));

    setCommentPost(post);
  };

  const addComment = async () => {
    if (!newComment.trim() || !commentPost) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${commentPost._id}/comments`,
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
      console.log("Add comment raw response:", rawText);

      let data;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        console.error("Comment response is not JSON");
        console.error("Status:", res.status);
        console.error("Raw response:", rawText);
        return;
      }

      if (!res.ok) {
        console.error(
          "Failed to add comment:",
          data.message || "Unknown error",
        );
        return;
      }

      setPostComments((prev) => ({
        ...prev,
        [commentPost._id]: data.comments || [],
      }));

      setNewComment("");
    } catch (error) {
      console.error("Add comment error:", error);
      console.error("Message:", error.message);
    }
  };

  const toggleCommentLike = async (postId, commentId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${postId}/comments/${commentId}/like`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      const rawText = await res.text();
      const data = JSON.parse(rawText);

      if (!res.ok) {
        console.log(data.message || "Failed to like comment");
        return;
      }

      fetchPosts();
    } catch (error) {
      console.log("Comment like error:", error);
    }
  };

  const toggleReplyInput = (commentId) => {
    setReplyInputs((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const addReply = async (postId, commentId) => {
    const text = replyText[commentId]?.trim();
    if (!text) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${postId}/comments/${commentId}/replies`,
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
      const data = JSON.parse(rawText);

      if (!res.ok) {
        console.log(data.message || "Failed to add reply");
        return;
      }

      setPostComments((prev) => ({
        ...prev,
        [postId]: data.comments || [],
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
      console.log("Reply error:", error);
    }
  };

  const handleShareWithFriend = (friendName) => {
    alert(`Post shared with ${friendName}`);
    setSharePost(null);
  };

  const handleWhatsAppShare = (post) => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    const message = `Check out this post on Grontiy: ${postUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyLink = async (post) => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      alert("Post link copied successfully");
    } catch (err) {
      alert("Failed to copy link");
    }
  };
  const feed = (showSaved ? savedPosts : posts).filter((post) => {
    const text =
      `${post.author || ""} ${post.content || ""} ${post.tags || ""}`.toLowerCase();

    //
    // SEARCH BOX FILTER
    //

    const searchMatch =
      searchText.trim() === "" || text.includes(searchText.toLowerCase());

    //
    // CHECKBOX FILTER
    //

    const tagMatch =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => text.includes(tag.toLowerCase()));

    return searchMatch && tagMatch;
  });

  const currentComments = commentPost
    ? postComments[commentPost._id] || []
    : [];

  return (
    <>
      {showNavbar && (
        <StudentNavbar
          searchText={searchText}
          setSearchText={setSearchText}
          feedType={feedType}
          setFeedType={setFeedType}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
        />
      )}

      <div className="homePageLayout">
        <div className="homeMainColumn">
{feedType !== "Trending" && (
  <div className="statusSection compactStatus">
    <StudentStatus setShowNavbar={setShowNavbar} />
  </div>
)}
          {feedType === "Trending" ? (
            <TrendingHashtagsPage />
          ) : (
            feed.map((post) => {
              const isSaved = !!post.isSaved;
              const isLiked = likedPosts.includes(post._id) || post.isLiked;
              const commentCount = (
                postComments[post._id] ||
                post.comments ||
                []
              ).length;
              const likeCount = postLikes[post._id] || post.likesCount || 0;

              return (
                <div
                  className="postCard"
                  key={post._id}
                  onDoubleClick={() => toggleLike(post._id)}
                >
                  <div className="postHeader">
                    <div className="headerLeft">
                      <img
                        src={
                          post.profileImage || "https://i.pravatar.cc/150?img=8"
                        }
                        alt="profile"
                        className="profileImage clickableProfile"
                        onClick={() => openStudentProfile(post)}
                      />
                      <div className="userInfo">
                        <h4>{post.author}</h4>
                        <span className="time">
                          {new Date(post.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button type="button" className="iconOnlyBtn">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  <p className="postContent">{post.content}</p>

                  {post.imageUrl && (
                    <img src={post.imageUrl} alt="post" className="postImage" />
                  )}

                  {post.videoUrl && (
                    <video className="postVideo" controls>
                      <source src={post.videoUrl} type="video/mp4" />
                    </video>
                  )}

                  <div className="postActions">
                    <div className="leftActions">
                      <button
                        type="button"
                        className="actionWithCount actionBtnIcon"
                        onClick={() => toggleLike(post._id)}
                      >
                        <Heart
                          size={22}
                          className={isLiked ? "likedIcon" : ""}
                        />
                        <span>{likeCount}</span>
                      </button>

                      <button
                        type="button"
                        className="actionWithCount actionBtnIcon"
                        onClick={() => openComments(post)}
                      >
                        <MessageCircle size={22} />
                        <span>{commentCount}</span>
                      </button>

                      <button
                        type="button"
                        className="actionWithCount actionBtnIcon"
                        onClick={() => setSharePost(post)}
                      >
                        <Share2 size={22} />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="bookmarkBtn"
                      onClick={() => toggleSave(post._id)}
                    >
                      <Bookmark
                        size={22}
                        className={isSaved ? "savedIcon" : ""}
                      />
                    </button>
                  </div>

                  <div className="postStats">
                    <span>{likeCount} likes</span>
                    <span
                      className="viewCommentsText"
                      onClick={() => openComments(post)}
                    >
                      View all {commentCount} comments
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <aside className="rightSidebar">
          <div className="sidebarSticky">
            <div className="sidebarCard">
              <div className="sidebarCardHeader">
                <h3>Trending Topics</h3>
              </div>

              <div className="trendingList">
                {trendingLoading ? (
                  <div className="trendingItem">
                    <p>Loading...</p>
                  </div>
                ) : trendingTopics.length === 0 ? (
                  <div className="trendingItem">
                    <p>No trending topics yet. Start a post with a #hashtag!</p>
                  </div>
                ) : (
                  trendingTopics.map((topic) => (
  <div
    key={topic._id || topic.tag}
    className="trendingItem"
    onClick={() =>
      navigate(
        `/student/trending/${topic.tag.replace("#", "")}`,
      )
    }
  >
    <h4>{topic.tag}</h4>
    <p>{topic.posts}</p>
  </div>
))
                )}
              </div>
            </div>
          </div>
        </aside>

        {commentPost && (
          <div className="commentPopup" onClick={() => setCommentPost(null)}>
            <div className="commentBox" onClick={(e) => e.stopPropagation()}>
              <div className="commentHeader">
                <h3>Comments</h3>
                <button
                  type="button"
                  className="iconOnlyBtn"
                  onClick={() => setCommentPost(null)}
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
                              <h4>{comment.userName || "User"}</h4>
                              <span>
                                {comment.createdAt
                                  ? new Date(comment.createdAt).toLocaleString()
                                  : "Now"}
                              </span>
                            </div>
                          </div>

                          <p>{comment.text}</p>

                          <div className="commentActionsRow">
                            <button
                              type="button"
                              className={`actionBtn ${comment.isLiked ? "liked" : ""}`}
                              onClick={() =>
                                toggleCommentLike(commentPost._id, comment._id)
                              }
                            >
                              <Heart size={16} />
                              <span>{comment.likesCount || 0}</span>
                            </button>

                            <button
                              type="button"
                              className="actionBtn"
                              onClick={() => toggleReplyInput(comment._id)}
                            >
                              Reply
                            </button>
                          </div>

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
                                  addReply(commentPost._id, comment._id)
                                }
                              />
                              <button
                                type="button"
                                className="replySendBtn"
                                onClick={() =>
                                  addReply(commentPost._id, comment._id)
                                }
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
                                    alt="reply user"
                                    className="replyAvatar"
                                  />

                                  <div className="replyContent">
                                    <div className="replyMeta">
                                      <h5>{reply.userName || "User"}</h5>
                                      <span>
                                        {reply.createdAt
                                          ? new Date(
                                              reply.createdAt,
                                            ).toLocaleString()
                                          : "Now"}
                                      </span>
                                    </div>
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

        {sharePost && (
          <div className="sharePopup" onClick={() => setSharePost(null)}>
            <div className="shareBox" onClick={(e) => e.stopPropagation()}>
              <div className="shareHeader">
                <h3>Share Post</h3>
                <button
                  type="button"
                  className="iconOnlyBtn"
                  onClick={() => setSharePost(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="friendsList">
                {appFriends.map((friend) => (
                  <div
                    className="friendCard"
                    key={friend.id}
                    onClick={() => handleShareWithFriend(friend.name)}
                  >
                    <img src={friend.avatar} alt={friend.name} />
                    <span>{friend.name}</span>
                  </div>
                ))}
              </div>

              <div className="shareOptions">
                <button
                  type="button"
                  onClick={() => handleWhatsAppShare(sharePost)}
                >
                  <Send size={18} />
                  WhatsApp
                </button>

                <button type="button" onClick={() => handleCopyLink(sharePost)}>
                  <Link2 size={18} />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
