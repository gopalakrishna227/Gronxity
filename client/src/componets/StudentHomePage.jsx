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

export default function StudentHomePage({
  onNotificationClick,
  onCreatePostClick,
}) {
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [showSaved, setShowSaved] = useState(false);

  const [commentPost, setCommentPost] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [postComments, setPostComments] = useState({});

  const [replyInputs, setReplyInputs] = useState({});
  const [replyText, setReplyText] = useState({});
  const [openReplies, setOpenReplies] = useState({});

  const [sharePost, setSharePost] = useState(null);
  const [postLikes, setPostLikes] = useState({});

  /*
   * Reply like states
   *
   * likedReplies[replyId] = true / false
   * replyLikes[replyId] = number
   */
  const [replyLikes, setReplyLikes] = useState({});
  const [likedReplies, setLikedReplies] = useState({});

  const [trendingTopics, setTrendingTopics] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [feedType, setFeedType] = useState("For You");
  const [selectedTags, setSelectedTags] = useState([]);
  const [showNavbar, setShowNavbar] = useState(true);

  const navigate = useNavigate();



  const [isMobile, setIsMobile] = useState(() => {
  return window.innerWidth <= 768;
});

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);






  /*
   * ============================================================
   * FRIENDS
   * ============================================================
   */

  const appFriends = [
    {
      id: 1,
      name: "Aarav",
      avatar: "https://i.pravatar.cc/150?img=12",
    },
    {
      id: 2,
      name: "Priya",
      avatar: "https://i.pravatar.cc/150?img=32",
    },
    {
      id: 3,
      name: "Nikhil",
      avatar: "https://i.pravatar.cc/150?img=15",
    },
    {
      id: 4,
      name: "Sana",
      avatar: "https://i.pravatar.cc/150?img=25",
    },
  ];

  /*
   * ============================================================
   * FETCH TRENDING TOPICS
   * ============================================================
   */

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

  /*
   * ============================================================
   * FETCH POSTS
   * ============================================================
   */

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

      let data = [];

      try {
        data = rawText ? JSON.parse(rawText) : [];
      } catch (error) {
        console.error("Invalid posts response:", rawText);
        return;
      }

      if (!res.ok) {
        console.log(data.message || "Failed to fetch posts");
        return;
      }

      if (!Array.isArray(data)) {
        console.log("Posts response is not an array:", data);
        return;
      }

      setPosts(data);

      const likesMap = {};
      const likedIds = [];
      const savedOnly = [];

      data.forEach((post) => {
        likesMap[post._id] = post.likesCount || 0;

        if (post.isLiked) {
          likedIds.push(post._id);
        }

        if (post.isSaved) {
          savedOnly.push(post);
        }

        /*
         * Initialize comment/reply like states
         * from server data.
         */
        if (Array.isArray(post.comments)) {
          post.comments.forEach((comment) => {
            if (comment._id) {
              setInitialCommentLikeState(comment);
            }

            if (Array.isArray(comment.replies)) {
              comment.replies.forEach((reply) => {
                if (reply._id) {
                  setInitialReplyLikeState(reply);
                }
              });
            }
          });
        }
      });

      setPostLikes(likesMap);
      setLikedPosts(likedIds);
      setSavedPosts(savedOnly);
    } catch (error) {
      console.log("Error fetching posts:", error);
    }
  };

  /*
   * ============================================================
   * INITIAL COMMENT LIKE STATE
   * ============================================================
   */

  const setInitialCommentLikeState = (comment) => {
    const likes = Array.isArray(comment.likes) ? comment.likes : [];

    setPostComments((prev) => prev);

    /*
     * We don't know current user ID here,
     * so server should ideally provide isLiked.
     *
     * Count is still taken from likes array.
     */
  };

  /*
   * ============================================================
   * INITIAL REPLY LIKE STATE
   * ============================================================
   */

  const setInitialReplyLikeState = (reply) => {
    const likes = Array.isArray(reply.likes) ? reply.likes : [];

    setReplyLikes((prev) => ({
      ...prev,
      [reply._id]:
        reply.likesCount !== undefined
          ? reply.likesCount
          : likes.length,
    }));

    if (reply.isLiked !== undefined) {
      setLikedReplies((prev) => ({
        ...prev,
        [reply._id]: reply.isLiked,
      }));
    }
  };

  /*
   * ============================================================
   * FETCH SAVED POSTS
   * ============================================================
   */

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

      const onlyPosts = data.filter(
        (item) => item.itemType === "post",
      );

      setSavedPosts(onlyPosts);

      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          isSaved: onlyPosts.some(
            (item) => item._id === post._id,
          ),
        })),
      );
    } catch (error) {
      console.log("Fetch saved posts error:", error);
    }
  };

  /*
   * ============================================================
   * USE EFFECT
   * ============================================================
   */

  useEffect(() => {
    fetchPosts();
  }, [feedType]);

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  /*
   * ============================================================
   * SAVE POST
   * ============================================================
   */

  const toggleSave = async (postId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${postId}/save`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        console.log(data.message || "Failed to save post");
        return;
      }

      let updatedPost = null;

      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            updatedPost = {
              ...post,
              isSaved: data.isSaved,
            };

            return updatedPost;
          }

          return post;
        }),
      );

      setSavedPosts((prev) => {
        if (data.isSaved) {
          const alreadyExists = prev.some(
            (p) => p._id === postId,
          );

          if (alreadyExists || !updatedPost) {
            return prev;
          }

          return [updatedPost, ...prev];
        }

        return prev.filter((p) => p._id !== postId);
      });
    } catch (err) {
      console.log("Save error:", err);
    }
  };

  /*
   * ============================================================
   * OPEN STUDENT PROFILE
   * ============================================================
   */

  const openStudentProfile = (post) => {
    if (!post?.userId && !post?._id) {
      return;
    }

    const profileId =
      typeof post.userId === "object"
        ? post.userId._id
        : post.userId;

    if (profileId) {
      navigate(`/student/profile/${profileId}`);
    }
  };

  /*
   * ============================================================
   * LIKE POST
   * ============================================================
   */

  const toggleLike = async (postId) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${postId}/like`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      const rawText = await res.text();

      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error("Invalid post like response:", rawText);
        return;
      }

      if (!res.ok) {
        console.log(
          data.message || "Failed to toggle like",
        );
        return;
      }

      if (data.isLiked) {
        setLikedPosts((prev) => {
          if (prev.includes(postId)) {
            return prev;
          }

          return [...prev, postId];
        });
      } else {
        setLikedPosts((prev) =>
          prev.filter((id) => id !== postId),
        );
      }

      setPostLikes((prev) => ({
        ...prev,
        [postId]: data.likesCount || 0,
      }));

      /*
       * Also update post object.
       */
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
                ...post,
                isLiked: data.isLiked,
                likesCount: data.likesCount || 0,
              }
            : post,
        ),
      );
    } catch (error) {
      console.log("Like error:", error);
    }
  };

  /*
   * ============================================================
   * OPEN COMMENTS
   * ============================================================
   */

  const openComments = (post) => {
    const comments = Array.isArray(post.comments)
      ? post.comments
      : [];

    setPostComments((prev) => ({
      ...prev,
      [post._id]: comments,
    }));

    /*
     * Initialize reply states when comments open.
     */
    comments.forEach((comment) => {
      const commentLikes = Array.isArray(comment.likes)
        ? comment.likes
        : [];

      /*
       * If backend already gives likesCount,
       * use that.
       */
      if (comment._id) {
        // Keep local reply/comment information untouched.
      }

      if (Array.isArray(comment.replies)) {
        comment.replies.forEach((reply) => {
          const likes = Array.isArray(reply.likes)
            ? reply.likes
            : [];

          setReplyLikes((prev) => ({
            ...prev,
            [reply._id]:
              reply.likesCount !== undefined
                ? reply.likesCount
                : likes.length,
          }));

          if (reply.isLiked !== undefined) {
            setLikedReplies((prev) => ({
              ...prev,
              [reply._id]: reply.isLiked,
            }));
          }
        });
      }
    });

    setCommentPost(post);
  };

  /*
   * ============================================================
   * ADD COMMENT
   * ============================================================
   */

  const addComment = async () => {
    if (!newComment.trim() || !commentPost) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${commentPost._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            text: newComment.trim(),
          }),
        },
      );

      const rawText = await res.text();

      console.log(
        "Add comment raw response:",
        rawText,
      );

      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error(
          "Comment response is not JSON",
        );
        console.error(
          "Status:",
          res.status,
        );
        console.error(
          "Raw response:",
          rawText,
        );
        return;
      }

      if (!res.ok) {
        console.error(
          "Failed to add comment:",
          data.message || "Unknown error",
        );
        return;
      }

      const comments = Array.isArray(data.comments)
        ? data.comments
        : [];

      setPostComments((prev) => ({
        ...prev,
        [commentPost._id]: comments,
      }));

      /*
       * Update comment count in post.
       */
      setPosts((prev) =>
        prev.map((post) =>
          post._id === commentPost._id
            ? {
                ...post,
                comments,
              }
            : post,
        ),
      );

      setCommentPost((prev) =>
        prev
          ? {
              ...prev,
              comments,
            }
          : prev,
      );

      setNewComment("");
    } catch (error) {
      console.error(
        "Add comment error:",
        error,
      );
    }
  };

  /*
   * ============================================================
   * LIKE COMMENT
   * ============================================================
   */

  const toggleCommentLike = async (
    postId,
    commentId,
  ) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${postId}/comments/${commentId}/like`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      const rawText = await res.text();

      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error(
          "Invalid comment like response:",
          rawText,
        );
        return;
      }

      if (!res.ok) {
        console.log(
          data.message ||
            "Failed to like comment",
        );
        return;
      }

      /*
       * Update comment immediately.
       */
      setPostComments((prev) => {
        const comments = prev[postId] || [];

        return {
          ...prev,

          [postId]: comments.map((comment) => {
            if (comment._id !== commentId) {
              return comment;
            }

            const currentLikes = Array.isArray(
              comment.likes,
            )
              ? comment.likes
              : [];

            return {
              ...comment,

              /*
               * We don't know actual current user ID
               * here, but backend already returns
               * isLiked and count.
               */
              isLiked: !!data.isLiked,

              likesCount:
                data.commentLikesCount ??
                currentLikes.length,

              /*
               * Keep likes array as it was.
               */
              likes: currentLikes,
            };
          }),
        };
      });

      /*
       * Update comment inside commentPost too.
       */
      setCommentPost((prev) => {
        if (!prev || prev._id !== postId) {
          return prev;
        }

        return {
          ...prev,

          comments: (prev.comments || []).map(
            (comment) => {
              if (comment._id !== commentId) {
                return comment;
              }

              return {
                ...comment,
                isLiked: !!data.isLiked,
                likesCount:
                  data.commentLikesCount || 0,
              };
            },
          ),
        };
      });
    } catch (error) {
      console.log(
        "Comment like error:",
        error,
      );
    }
  };

  /*
   * ============================================================
   * TOGGLE REPLY INPUT
   * ============================================================
   */

  const toggleReplyInput = (commentId) => {
    setReplyInputs((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  /*
   * ============================================================
   * ADD REPLY
   * ============================================================
   */

  const addReply = async (
    postId,
    commentId,
  ) => {
    const text =
      replyText[commentId]?.trim();

    if (!text) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${postId}/comments/${commentId}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            text,
          }),
        },
      );

      const rawText = await res.text();

      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error(
          "Invalid reply response:",
          rawText,
        );
        return;
      }

      if (!res.ok) {
        console.log(
          data.message ||
            "Failed to add reply",
        );
        return;
      }

      const comments = Array.isArray(
        data.comments,
      )
        ? data.comments
        : [];

      /*
       * Replace comments with backend response.
       */
      setPostComments((prev) => ({
        ...prev,
        [postId]: comments,
      }));

      /*
       * Also update commentPost.
       */
      setCommentPost((prev) => {
        if (!prev || prev._id !== postId) {
          return prev;
        }

        return {
          ...prev,
          comments,
        };
      });

      /*
       * Initialize reply likes for newly
       * returned replies.
       */
      comments.forEach((comment) => {
        if (Array.isArray(comment.replies)) {
          comment.replies.forEach((reply) => {
            const likes = Array.isArray(
              reply.likes,
            )
              ? reply.likes
              : [];

            setReplyLikes((prev) => ({
              ...prev,
              [reply._id]:
                reply.likesCount !== undefined
                  ? reply.likesCount
                  : likes.length,
            }));

            if (
              reply.isLiked !== undefined
            ) {
              setLikedReplies((prev) => ({
                ...prev,
                [reply._id]:
                  reply.isLiked,
              }));
            }
          });
        }
      });

      /*
       * Clear input.
       */
      setReplyText((prev) => ({
        ...prev,
        [commentId]: "",
      }));

      setReplyInputs((prev) => ({
        ...prev,
        [commentId]: false,
      }));

      /*
       * Automatically open replies.
       */
      setOpenReplies((prev) => ({
        ...prev,
        [commentId]: true,
      }));
    } catch (error) {
      console.log(
        "Reply error:",
        error,
      );
    }
  };

  /*
   * ============================================================
   * LIKE REPLY
   * ============================================================
   */

  const toggleReplyLike = async (
    postId,
    commentId,
    replyId,
  ) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/student/posts/${postId}/comments/${commentId}/replies/${replyId}/like`,
        {
          method: "PUT",
          credentials: "include",
        },
      );

      const rawText = await res.text();

      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.error(
          "Invalid reply like response:",
          rawText,
        );
        return;
      }

      if (!res.ok) {
        console.log(
          data.message ||
            "Failed to like reply",
        );
        return;
      }

      const newIsLiked = !!data.isLiked;

      const newCount =
        data.replyLikesCount ??
        data.likesCount ??
        0;

      /*
       * ========================================================
       * UPDATE REPLY LIKE STATE
       * ========================================================
       */

      setLikedReplies((prev) => ({
        ...prev,
        [replyId]: newIsLiked,
      }));

      /*
       * ========================================================
       * UPDATE REPLY COUNT
       * ========================================================
       */

      setReplyLikes((prev) => ({
        ...prev,
        [replyId]: newCount,
      }));

      /*
       * ========================================================
       * UPDATE ACTUAL REPLY OBJECT
       * ========================================================
       */

      setPostComments((prev) => {
        const comments = prev[postId] || [];

        return {
          ...prev,

          [postId]: comments.map(
            (comment) => {
              if (
                comment._id !== commentId
              ) {
                return comment;
              }

              return {
                ...comment,

                replies: (
                  comment.replies || []
                ).map((reply) => {
                  if (
                    reply._id !== replyId
                  ) {
                    return reply;
                  }

                  return {
                    ...reply,
                    isLiked:
                      newIsLiked,
                    likesCount:
                      newCount,
                  };
                }),
              };
            },
          ),
        };
      });

      /*
       * ========================================================
       * UPDATE COMMENT POST OBJECT
       * ========================================================
       */

      setCommentPost((prev) => {
        if (!prev || prev._id !== postId) {
          return prev;
        }

        return {
          ...prev,

          comments: (
            prev.comments || []
          ).map((comment) => {
            if (
              comment._id !== commentId
            ) {
              return comment;
            }

            return {
              ...comment,

              replies: (
                comment.replies || []
              ).map((reply) => {
                if (
                  reply._id !== replyId
                ) {
                  return reply;
                }

                return {
                  ...reply,
                  isLiked:
                    newIsLiked,
                  likesCount:
                    newCount,
                };
              }),
            };
          }),
        };
      });
    } catch (error) {
      console.log(
        "Reply like error:",
        error,
      );
    }
  };

  /*
   * ============================================================
   * SHARE
   * ============================================================
   */

  const handleShareWithFriend = (
    friendName,
  ) => {
    alert(
      `Post shared with ${friendName}`,
    );

    setSharePost(null);
  };

  /*
   * ============================================================
   * WHATSAPP SHARE
   * ============================================================
   */

  const handleWhatsAppShare = (
    post,
  ) => {
    const postUrl = `${window.location.origin}/post/${post._id}`;

    const message =
      `Check out this post on Grontiy: ${postUrl}`;

    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(
        message,
      )}`;

    window.open(
      whatsappUrl,
      "_blank",
    );
  };

  /*
   * ============================================================
   * COPY LINK
   * ============================================================
   */

  const handleCopyLink = async (
    post,
  ) => {
    const postUrl =
      `${window.location.origin}/post/${post._id}`;

    try {
      await navigator.clipboard.writeText(
        postUrl,
      );

      alert(
        "Post link copied successfully",
      );
    } catch (err) {
      alert(
        "Failed to copy link",
      );
    }
  };

  /*
   * ============================================================
   * FEED FILTER
   * ============================================================
   */

  const feed = (
    showSaved
      ? savedPosts
      : posts
  ).filter((post) => {
    const text =
      `${post.author || ""} ${
        post.content || ""
      } ${
        post.tags || ""
      }`.toLowerCase();

    const searchMatch =
      searchText.trim() === "" ||
      text.includes(
        searchText.toLowerCase(),
      );

    const tagMatch =
      selectedTags.length === 0 ||
      selectedTags.some((tag) =>
        text.includes(
          tag.toLowerCase(),
        ),
      );

    return (
      searchMatch &&
      tagMatch
    );
  });

  /*
   * ============================================================
   * CURRENT COMMENTS
   * ============================================================
   */

  const currentComments =
    commentPost
      ? postComments[
          commentPost._id
        ] || []
      : [];

  /*
   * ============================================================
   * TOGGLE REPLIES
   * ============================================================
   */

  const toggleReplies = (
    commentId,
  ) => {
    setOpenReplies((prev) => ({
      ...prev,
      [commentId]:
        !prev[commentId],
    }));
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <>





     {!isMobile && showNavbar && (
  <StudentNavbar
    onNotificationClick={onNotificationClick}
    searchText={searchText}
    setSearchText={setSearchText}
    feedType={feedType}
    setFeedType={setFeedType}
    selectedTags={selectedTags}
    setSelectedTags={setSelectedTags}
    onCreatePostClick={onCreatePostClick}
  />
)}






      <div className="homePageLayout">

        {/* ======================================================
            MAIN FEED
        ====================================================== */}

        <div className="mobilePostScroll">

           {isMobile && showNavbar && (
      <StudentNavbar
        onNotificationClick={onNotificationClick}
        searchText={searchText}
        setSearchText={setSearchText}
        feedType={feedType}
        setFeedType={setFeedType}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        onCreatePostClick={onCreatePostClick}
      />
    )}


          <div className="homeMainColumn">

            {feedType !==
              "Trending" && (
              <div className="statusSection compactStatus">
                <StudentStatus
                  setShowNavbar={
                    setShowNavbar
                  }
                />
              </div>
            )}

            {feedType ===
            "Trending" ? (
              <TrendingHashtagsPage />
            ) : (
              feed.map((post) => {

                const isSaved =
                  !!post.isSaved;

                const isLiked =
                  likedPosts.includes(
                    post._id,
                  ) ||
                  post.isLiked;

                const commentCount =
                  (
                    postComments[
                      post._id
                    ] ||
                    post.comments ||
                    []
                  ).length;

                const likeCount =
                  postLikes[
                    post._id
                  ] ||
                  post.likesCount ||
                  0;

                return (
                  <div
                    className="postCard"
                    key={post._id}
                    onDoubleClick={() =>
                      toggleLike(
                        post._id,
                      )
                    }
                  >

                    {/* ==================================================
                        POST HEADER
                    ================================================== */}

                    <div className="postHeader">

                      <div className="headerLeft">

                        <img
                          src={
                            post.profileImage ||
                            "https://i.pravatar.cc/150?img=8"
                          }
                          alt="profile"
                          className="profileImage clickableProfile"
                          onClick={() =>
                            openStudentProfile(
                              post,
                            )
                          }
                        />

                        <div className="userInfo">

                          <h4>
                            {post.author ||
                              "User"}
                          </h4>

                          <span className="time">
                            {post.createdAt
                              ? new Date(
                                  post.createdAt,
                                ).toLocaleString()
                              : "Now"}
                          </span>

                        </div>

                      </div>

                      <button
                        type="button"
                        className="iconOnlyBtn"
                      >
                        <MoreHorizontal
                          size={18}
                        />
                      </button>

                    </div>

                    {/* ==================================================
                        POST CONTENT
                    ================================================== */}

                    <p className="postContent">
                      {post.content}
                    </p>

                    {/* ==================================================
                        POST IMAGE
                    ================================================== */}

                    {post.imageUrl && (
                      <img
                        src={
                          post.imageUrl
                        }
                        alt="post"
                        className="postImage"
                      />
                    )}

                    {/* ==================================================
                        POST VIDEO
                    ================================================== */}

                    {post.videoUrl && (
                      <video
                        className="postVideo"
                        controls
                      >
                        <source
                          src={
                            post.videoUrl
                          }
                          type="video/mp4"
                        />
                      </video>
                    )}

                    {/* ==================================================
                        POST ACTIONS
                    ================================================== */}

                    <div className="postActions">

                      <div className="leftActions">

                        {/* LIKE */}

                        <button
                          type="button"
                          className="actionWithCount actionBtnIcon"
                          onClick={() =>
                            toggleLike(
                              post._id,
                            )
                          }
                        >
                          <Heart
                            size={22}
                            className={
                              isLiked
                                ? "likedIcon"
                                : ""
                            }
                            fill={
                              isLiked
                                ? "currentColor"
                                : "none"
                            }
                          />

                          <span>
                            {likeCount}
                          </span>
                        </button>

                        {/* COMMENTS */}

                        <button
                          type="button"
                          className="actionWithCount actionBtnIcon"
                          onClick={() =>
                            openComments(
                              post,
                            )
                          }
                        >
                          <MessageCircle
                            size={22}
                          />

                          <span>
                            {commentCount}
                          </span>
                        </button>

                        {/* SHARE */}

                        <button
                          type="button"
                          className="actionWithCount actionBtnIcon"
                          onClick={() =>
                            setSharePost(
                              post,
                            )
                          }
                        >
                          <Share2
                            size={22}
                          />
                        </button>

                      </div>

                      {/* SAVE */}

                      <button
                        type="button"
                        className="bookmarkBtn"
                        onClick={() =>
                          toggleSave(
                            post._id,
                          )
                        }
                      >
                        <Bookmark
                          size={22}
                          className={
                            isSaved
                              ? "savedIcon"
                              : ""
                          }
                          fill={
                            isSaved
                              ? "currentColor"
                              : "none"
                          }
                        />
                      </button>

                    </div>

                    {/* ==================================================
                        POST STATS
                    ================================================== */}

                    <div className="postStats">

                      <span>
                        {likeCount} likes
                      </span>

                      <span
                        className="viewCommentsText"
                        onClick={() =>
                          openComments(
                            post,
                          )
                        }
                      >
                        View all{" "}
                        {commentCount}{" "}
                        comments
                      </span>

                    </div>

                  </div>
                );
              })
            )}

          </div>
        </div>

        {/* ==========================================================
            RIGHT SIDEBAR
        ========================================================== */}

        <aside className="rightSidebar">

          <div className="sidebarSticky">

            <div className="sidebarCard">

              <div className="sidebarCardHeader">
                <h3>
                  Trending Topics
                </h3>
              </div>

              <div className="trendingList">

                {trendingLoading ? (
                  <div className="trendingItem">
                    <p>
                      Loading...
                    </p>
                  </div>
                ) : trendingTopics.length ===
                  0 ? (
                  <div className="trendingItem">
                    <p>
                      No trending topics
                      yet. Start a post
                      with a #hashtag!
                    </p>
                  </div>
                ) : (
                  trendingTopics.map(
                    (topic) => (
                      <div
                        key={
                          topic._id ||
                          topic.tag
                        }
                        className="trendingItem"
                        onClick={() =>
                          navigate(
                            `/student/trending/${topic.tag.replace(
                              "#",
                              "",
                            )}`,
                          )
                        }
                      >
                        <h4>
                          {
                            topic.tag
                          }
                        </h4>

                        <p>
                          {
                            topic.posts
                          }
                        </p>
                      </div>
                    ),
                  )
                )}

              </div>

            </div>

          </div>

        </aside>

        {/* ==========================================================
            COMMENTS POPUP
        ========================================================== */}

        {commentPost && (
          <div
            className="commentPopup"
            onClick={() =>
              setCommentPost(null)
            }
          >

            <div
              className="commentBox"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* ====================================================
                  COMMENT HEADER
              ==================================================== */}

              <div className="commentHeader">

                <h3>
                  Comments
                </h3>

                <button
                  type="button"
                  className="iconOnlyBtn"
                  onClick={() =>
                    setCommentPost(
                      null,
                    )
                  }
                >
                  <X size={20} />
                </button>

              </div>

              {/* ====================================================
                  COMMENT COUNT
              ==================================================== */}

              <div className="commentCountText">
                {
                  currentComments.length
                }{" "}
                comments
              </div>

              {/* ====================================================
                  ADD COMMENT
              ==================================================== */}

              <div className="commentInputBox">

                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={
                    newComment
                  }
                  onChange={(e) =>
                    setNewComment(
                      e.target.value,
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key ===
                      "Enter"
                    ) {
                      addComment();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={
                    addComment
                  }
                >
                  <Send size={18} />
                </button>

              </div>

              {/* ====================================================
                  COMMENT LIST
              ==================================================== */}

              <div className="commentList">

                {currentComments.length ===
                0 ? (
                  <div className="noComments">
                    No comments yet.
                  </div>
                ) : (
                  currentComments.map(
                    (comment) => {

                      /*
                       * =================================================
                       * COMMENT NAME
                       *
                       * Your backend stores:
                       * comment.name
                       * comment.profileImage
                       *
                       * So these are checked FIRST.
                       * =================================================
                       */

                      const commentName =
                        comment.name ||
                        comment.user?.name ||
                        comment.userName ||
                        comment.username ||
                        "User";

                      const commentAvatar =
                        comment.profileImage ||
                        comment.user?.avatar ||
                        comment.user?.profileImage ||
                        "https://i.pravatar.cc/150?img=10";

                      const commentLikes =
                        Array.isArray(
                          comment.likes,
                        )
                          ? comment.likes
                          : [];

                      const commentLikeCount =
                        comment.likesCount ??
                        commentLikes.length;

                      return (
                        <div
                          className="commentCard"
                          key={
                            comment._id
                          }
                        >

                          <div className="commentTop">

                            {/* ========================================
                                COMMENT AVATAR
                            ======================================== */}

                            <img
                              src={
                                commentAvatar
                              }
                              alt=""
                              className="commentAvatar"
                            />

                            <div className="commentContentBox">

                              {/* ======================================
                                  COMMENT USERNAME
                              ====================================== */}

                              <div className="commentMeta">

                                <div>

                                  <h4>
                                    {
                                      commentName
                                    }
                                  </h4>

                                  <span>
                                    {comment.createdAt
                                      ? new Date(
                                          comment.createdAt,
                                        ).toLocaleString()
                                      : "Now"}
                                  </span>

                                </div>

                              </div>

                              {/* ======================================
                                  COMMENT TEXT
                              ====================================== */}

                              <p>
                                {
                                  comment.text
                                }
                              </p>

                              {/* ======================================
                                  COMMENT ACTIONS
                              ====================================== */}

                              <div className="commentActionsRow">

                                {/* COMMENT LIKE */}

                                <button
                                  type="button"
                                  className={`actionBtn ${
                                    comment.isLiked
                                      ? "liked"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    toggleCommentLike(
                                      commentPost._id,
                                      comment._id,
                                    )
                                  }
                                >

                                  <Heart
                                    size={16}
                                    fill={
                                      comment.isLiked
                                        ? "currentColor"
                                        : "none"
                                    }
                                  />

                                  <span>
                                    {
                                      commentLikeCount
                                    }
                                  </span>

                                </button>

                                {/* COMMENT REPLY */}

                                <button
                                  type="button"
                                  className="actionBtn"
                                  onClick={() =>
                                    toggleReplyInput(
                                      comment._id,
                                    )
                                  }
                                >
                                  Reply
                                </button>

                              </div>

                              {/* ======================================
                                  REPLY INPUT
                              ====================================== */}

                              {replyInputs[
                                comment._id
                              ] && (
                                <div className="replyInputBox">

                                  <input
                                    type="text"
                                    placeholder="Write a reply..."
                                    value={
                                      replyText[
                                        comment._id
                                      ] ||
                                      ""
                                    }
                                    onChange={(
                                      e,
                                    ) =>
                                      setReplyText(
                                        (
                                          prev,
                                        ) => ({
                                          ...prev,
                                          [comment._id]:
                                            e.target
                                              .value,
                                        }),
                                      )
                                    }
                                    onKeyDown={(
                                      e,
                                    ) => {
                                      if (
                                        e.key ===
                                        "Enter"
                                      ) {
                                        addReply(
                                          commentPost._id,
                                          comment._id,
                                        );
                                      }
                                    }}
                                  />

                                  <button
                                    type="button"
                                    className="replySendBtn"
                                    onClick={() =>
                                      addReply(
                                        commentPost._id,
                                        comment._id,
                                      )
                                    }
                                  >
                                    Send
                                  </button>

                                </div>
                              )}

                              {/* ======================================
                                  VIEW REPLIES
                              ====================================== */}

                              {comment.replies?.length >
                                0 && (
                                <button
                                  type="button"
                                  className="viewRepliesBtn"
                                  onClick={() =>
                                    toggleReplies(
                                      comment._id,
                                    )
                                  }
                                >

                                  <span className="viewRepliesLine"></span>

                                  {openReplies[
                                    comment._id
                                  ]
                                    ? "Hide replies"
                                    : `View replies (${comment.replies.length})`}

                                </button>
                              )}

                              {/* ======================================
                                  REPLY LIST
                              ====================================== */}

                              {openReplies[
                                comment._id
                              ] && (
                                <div className="replyList">

                                  {(
                                    comment.replies ||
                                    []
                                  ).map(
                                    (
                                      reply,
                                    ) => {

                                      /*
                                       * =================================================
                                       * IMPORTANT:
                                       * Backend stores reply.name
                                       *
                                       * So use reply.name FIRST.
                                       * =================================================
                                       */

                                      const replyName =
                                        reply.name ||
                                        reply.user?.name ||
                                        reply.userName ||
                                        reply.username ||
                                        "User";

                                      const replyAvatar =
                                        reply.profileImage ||
                                        reply.user?.avatar ||
                                        reply.user?.profileImage ||
                                        "https://i.pravatar.cc/150?img=20";

                                      const isReplyLiked =
                                        likedReplies[
                                          reply._id
                                        ] ??
                                        reply.isLiked ??
                                        false;

                                      const replyLikeCount =
                                        replyLikes[
                                          reply._id
                                        ] ??
                                        reply.likesCount ??
                                        (
                                          Array.isArray(
                                            reply.likes,
                                          )
                                            ? reply.likes.length
                                            : 0
                                        );

                                      return (
                                        <div
                                          className="replyCard"
                                          key={
                                            reply._id
                                          }
                                        >

                                          {/* ====================================
                                              REPLY AVATAR
                                          ==================================== */}

                                          <img
                                            src={
                                              replyAvatar
                                            }
                                            alt=""
                                            className="replyAvatar"
                                          />

                                          <div className="replyContent">

                                            {/* ==================================
                                                REPLY USERNAME
                                            ================================== */}

                                            <div className="replyMeta">

                                              <h5>
                                                {
                                                  replyName
                                                }
                                              </h5>

                                              <span>
                                                {reply.createdAt
                                                  ? new Date(
                                                      reply.createdAt,
                                                    ).toLocaleString()
                                                  : "Now"}
                                              </span>

                                            </div>

                                            {/* ==================================
                                                REPLY TEXT
                                            ================================== */}

                                            <p>
                                              {
                                                reply.text
                                              }
                                            </p>

                                            {/* ==================================
                                                REPLY ACTIONS
                                            ================================== */}

                                            <div className="replyActions">

                                              {/* ================================
                                                  REPLY LIKE
                                              ================================= */}

                                              <button
                                                type="button"
                                                className={`replyActionBtn ${
                                                  isReplyLiked
                                                    ? "liked"
                                                    : ""
                                                }`}
                                                onClick={() =>
                                                  toggleReplyLike(
                                                    commentPost._id,
                                                    comment._id,
                                                    reply._id,
                                                  )
                                                }
                                              >

                                                <Heart
                                                  size={
                                                    15
                                                  }
                                                  fill={
                                                    isReplyLiked
                                                      ? "currentColor"
                                                      : "none"
                                                  }
                                                />

                                                <span>
                                                  Like
                                                </span>

                                                {replyLikeCount >
                                                  0 && (
                                                  <span>
                                                    {
                                                      replyLikeCount
                                                    }
                                                  </span>
                                                )}

                                              </button>

                                              {/* ================================
                                                  REPLY BUTTON
                                              ================================= */}

                                              <button
                                                type="button"
                                                className="replyActionBtn"
                                                onClick={() =>
                                                  toggleReplyInput(
                                                    comment._id,
                                                  )
                                                }
                                              >
                                                Reply
                                              </button>

                                            </div>

                                          </div>

                                        </div>
                                      );
                                    },
                                  )}

                                </div>
                              )}

                            </div>

                          </div>

                        </div>
                      );
                    },
                  )
                )}

              </div>

            </div>

          </div>
        )}

        {/* ==========================================================
            SHARE POPUP
        ========================================================== */}

        {sharePost && (
          <div
            className="sharePopup"
            onClick={() =>
              setSharePost(null)
            }
          >

            <div
              className="shareBox"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* ====================================================
                  SHARE HEADER
              ==================================================== */}

              <div className="shareHeader">

                <h3>
                  Share Post
                </h3>

                <button
                  type="button"
                  className="iconOnlyBtn"
                  onClick={() =>
                    setSharePost(
                      null,
                    )
                  }
                >
                  <X size={20} />
                </button>

              </div>

              {/* ====================================================
                  FRIENDS
              ==================================================== */}

              <div className="friendsList">

                {appFriends.map(
                  (friend) => (
                    <div
                      className="friendCard"
                      key={
                        friend.id
                      }
                      onClick={() =>
                        handleShareWithFriend(
                          friend.name,
                        )
                      }
                    >

                      <img
                        src={
                          friend.avatar
                        }
                        alt={
                          friend.name
                        }
                      />

                      <span>
                        {
                          friend.name
                        }
                      </span>

                    </div>
                  ),
                )}

              </div>

              {/* ====================================================
                  SHARE OPTIONS
              ==================================================== */}

              <div className="shareOptions">

                <button
                  type="button"
                  onClick={() =>
                    handleWhatsAppShare(
                      sharePost,
                    )
                  }
                >
                  <Send size={18} />
                  WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleCopyLink(
                      sharePost,
                    )
                  }
                >
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