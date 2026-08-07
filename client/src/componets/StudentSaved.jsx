import React, { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import "./StudentSaved.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function StudentSaved() {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/student/saved-posts`, {
        credentials: "include",
      });

      const rawText = await res.text();
      let data = [];

      try {
        data = rawText ? JSON.parse(rawText) : [];
      } catch (err) {
        console.log("Saved response invalid:", rawText);
        return;
      }

      if (!res.ok) {
        console.log(data.message || "Failed to fetch saved posts");
        return;
      }

      setSavedPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Error fetching saved posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const unsavePost = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/api/student/posts/${postId}/save`, {
        method: "PUT",
        credentials: "include",
      });

      const rawText = await res.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (err) {
        console.log("Unsave response invalid:", rawText);
        return;
      }

      if (!res.ok) {
        console.log(data.message || "Failed to unsave");
        return;
      }

      setSavedPosts((prev) => prev.filter((post) => post._id !== postId));
    } catch (err) {
      console.log("Error unsaving post:", err);
    }
  };

  if (loading) {
    return <div className="student-saved-page">Loading...</div>;
  }

  return (
    <div className="student-saved-page">
      {savedPosts.length === 0 ? (
        <div className="student-saved-card">
          <Bookmark size={32} />
          <h2>Saved Items</h2>
          <p>No saved posts yet.</p>
        </div>
      ) : (
        <div className="saved-list">
          {savedPosts.map((post) => (
            <div key={post._id} className="saved-post">
              <div className="saved-post-header">
                <h4>{post.author || "User"}</h4>

                <button
                  type="button"
                  className="saved-bookmark-btn active"
                  onClick={() => unsavePost(post._id)}
                >
                  <Bookmark size={20} />
                </button>
              </div>

              {post.content && <p>{post.content}</p>}

              {post.imageUrl && <img src={post.imageUrl} alt="" />}

              {post.videoUrl && (
                <video controls>
                  <source src={post.videoUrl} />
                </video>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}