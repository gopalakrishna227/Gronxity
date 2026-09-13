import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentNavbar from "./StudentNavbar";
import "./TrendingPostsPage.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function TrendingAllPostsPage() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/student/posts/trending`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const openStudentProfile = (post) => {
    if (!post?.userId) return;

    const profileId =
      typeof post.userId === "object"
        ? post.userId._id
        : post.userId;

    navigate(`/student/profile/${profileId}`);
  };

  return (
    <>
      <StudentNavbar />

      <div className="trendingPageWrapper">
        <div className="trendingPage">

          <div className="trendingHeader">
            <h2>🔥 Trending Posts</h2>
            <p>{posts.length} Posts</p>
          </div>

          {loading ? (
            <div className="noPosts">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="noPosts">No trending posts found.</div>
          ) : (
            posts.map((post) => (
              <div className="trendingPostCard" key={post._id}>

                <div className="postHeader">
                  <img
                    src={
                      post.profileImage ||
                      "https://i.pravatar.cc/150?img=8"
                    }
                    alt=""
                    className="profileImage clickableProfile"
                    onClick={() => openStudentProfile(post)}
                  />

                  <div
                    className="userDetails clickableProfile"
                    onClick={() => openStudentProfile(post)}
                  >
                    <h4>{post.author}</h4>
                    <span>
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="postContent">
                  {post.content}
                </div>

                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt=""
                    className="postImage"
                  />
                )}

                {post.videoUrl && (
                  <video controls className="postVideo">
                    <source
                      src={post.videoUrl}
                      type="video/mp4"
                    />
                  </video>
                )}

                <div className="postFooter">
                  <span>❤️ {post.likesCount || 0} Likes</span>
                  <span>💬 {post.commentsCount || 0} Comments</span>
                </div>

              </div>
            ))
          )}

        </div>
      </div>
    </>
  );
}