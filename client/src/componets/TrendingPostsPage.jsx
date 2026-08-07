import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./TrendingPostsPage.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function TrendingPostsPage() {
  const { tag } = useParams();
const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/student/posts/hashtag/${tag}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {

  if (Array.isArray(data)) {
    setPosts(data);
    setTotalPosts(data.length);
  } else {
    setPosts(data.posts || []);
    setTotalPosts(data.totalPosts || 0);
  }

})
      .catch((err) => console.log(err));
  }, [tag]);



  const openStudentProfile = (post) => {
  if (!post?.userId) return;

  const profileId =
    typeof post.userId === "object" ? post.userId._id : post.userId;

  navigate(`/student/profile/${profileId}`);
};

  return (
    <>
     

      <div className="trendingPageWrapper">
        <div className="trendingPage">

          <div className="trendingHeader">
            <h2>#{tag}</h2>
            <p>{totalPosts} Posts</p>
          </div>

          {posts.length === 0 ? (
            <div className="noPosts">No posts found.</div>
          ) : (
            posts.map((post) => (
              <div className="trendingPostCard" key={post._id}>

                <div className="postHeader">
  <img
    src={post.profileImage || "https://i.pravatar.cc/150?img=8"}
    alt=""
    className="profileImage clickableProfile"
    onClick={() => openStudentProfile(post)}
  />

  <div
    className="userDetails clickableProfile"
    onClick={() => openStudentProfile(post)}
  >
    <h4>{post.author}</h4>
    <span>{new Date(post.createdAt).toLocaleString()}</span>
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
                    <source src={post.videoUrl} type="video/mp4" />
                  </video>
                )}

                <div className="postFooter">
                  <span>❤️ {post.likesCount} Likes</span>
                  <span>💬 {post.commentsCount} Comments</span>
                </div>

              </div>
            ))
          )}

        </div>
      </div>
    </>
  );
}