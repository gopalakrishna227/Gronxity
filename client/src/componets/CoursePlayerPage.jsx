import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  Trash2,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Bell,
  Send,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "./CoursePlayerPage.css";

const API = import.meta.env.VITE_API_URL;

export default function CoursePlayerPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${API}/api/student/course/${courseId}`, {
        withCredentials: true,
      });

      const fetchedCourse = res.data?.course || null;
      setCourse(fetchedCourse);
      setIsOwner(Boolean(res.data?.isOwner));
    } catch (err) {
      console.error("Fetch single course error:", err);
      alert(err.response?.data?.message || "Failed to fetch course");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("Are you sure you want to delete this course?");
    if (!ok) return;

    try {
      await axios.delete(`${API}/api/student/course/${courseId}`, {
        withCredentials: true,
      });

      alert("Course deleted successfully");
      navigate("/student/courses");
    } catch (err) {
      console.error("Delete course error:", err);
      alert(err.response?.data?.message || "Failed to delete course");
    }
  };

  const handleLike = async () => {
    try {
      const res = await axios.put(
        `${API}/api/student/course/${courseId}/like`,
        {},
        { withCredentials: true }
      );

      setCourse((prev) => ({
        ...prev,
        isLiked: Boolean(res.data?.isLiked),
        likesCount: res.data?.likesCount ?? prev.likesCount,
      }));
    } catch (err) {
      console.error("Like course error:", err);
      alert(err.response?.data?.message || "Failed to like course");
    }
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(
        `${API}/api/student/course/${courseId}/save`,
        {},
        { withCredentials: true }
      );

      setCourse((prev) => ({
        ...prev,
        isSaved: Boolean(res.data?.isSaved),
      }));
    } catch (err) {
      console.error("Save course error:", err);
      alert(err.response?.data?.message || "Failed to save course");
    }
  };

  const handleShare = async () => {
    try {
      const res = await axios.post(
        `${API}/api/student/course/${courseId}/share`,
        {},
        { withCredentials: true }
      );

      const shareUrl =
        res.data?.shareUrl || `${window.location.origin}/student/course/${courseId}`;

      if (navigator.share) {
        await navigator.share({
          title: course?.title || "Course",
          text: "Check this course",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Course link copied");
      }

      setCourse((prev) => ({
        ...prev,
        sharesCount: res.data?.sharesCount ?? prev.sharesCount,
      }));
    } catch (err) {
      console.error("Share course error:", err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);

      const res = await axios.post(
        `${API}/api/student/course/${courseId}/comment`,
        { text: commentText },
        { withCredentials: true }
      );

      setCourse((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), res.data.comment],
        commentsCount:
          res.data?.commentsCount ??
          ((prev.commentsCount || 0) + 1),
      }));

      setCommentText("");
    } catch (err) {
      console.error("Comment course error:", err);
      alert(err.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <div className="student-course-player-empty">Loading...</div>;
  }

  if (!course) {
    return <div className="student-course-player-empty">Course not found</div>;
  }

  return (
    <div className="student-course-player-page">
      <div className="student-course-player-topbar">
        <button
          className="student-course-player-back-btn"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="student-course-player-topbar-right">
          <button
            className="student-course-player-icon-btn"
            onClick={() => navigate("/student/course-notifications")}
            title="Course Notifications"
          >
            <Bell size={18} />
          </button>

          {isOwner && (
            <button
              className="student-course-player-delete-btn"
              onClick={handleDelete}
            >
              <Trash2 size={18} />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="student-course-player-layout">
        <div className="student-course-video-box">
          {course.videoUrl ? (
            <video
              key={course.videoUrl}
              src={course.videoUrl}
              className="student-course-video-frame"
              controls
              autoPlay
              playsInline
            />
          ) : (
            <div className="student-course-player-empty">
              Video URL not found
            </div>
          )}
        </div>

        <div className="student-course-player-info">
          <h1>{course.title || "Untitled Course"}</h1>

          <div className="student-course-player-owner">
            {course.userId?.avatar ? (
              <img
                src={course.userId.avatar}
                alt={course.userId?.name}
                className="student-course-player-owner-img"
              />
            ) : (
              <div className="student-course-player-owner-fallback">
                {(course.userId?.name || course.author || "ST")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}

            <div>
              <h3>{course.userId?.name || course.author || "Student"}</h3>
              <p>
                {course.views || 0} views • {course.likesCount || 0} likes •{" "}
                {course.commentsCount || 0} comments
              </p>
            </div>
          </div>

          <div className="student-course-player-actions">
            <button
              className={`student-course-action-btn ${
                course.isLiked ? "active" : ""
              }`}
              onClick={handleLike}
            >
              <Heart size={18} />
              <span>{course.likesCount || 0}</span>
            </button>

            <button className="student-course-action-btn">
              <MessageCircle size={18} />
              <span>{course.commentsCount || 0}</span>
            </button>

            <button
              className={`student-course-action-btn ${
                course.isSaved ? "active" : ""
              }`}
              onClick={handleSave}
            >
              <Bookmark size={18} />
              <span>{course.isSaved ? "Saved" : "Save"}</span>
            </button>

            <button
              className="student-course-action-btn"
              onClick={handleShare}
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>

          <div className="student-course-player-description">
            {course.description || "No description added"}
          </div>

          <div className="student-course-comments-box">
            <h2>Comments</h2>

            <div className="student-course-comment-input-wrap">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="student-course-comment-input"
              />
              <button
                className="student-course-comment-send-btn"
                onClick={handleCommentSubmit}
                disabled={submittingComment}
              >
                <Send size={18} />
              </button>
            </div>

            <div className="student-course-comments-list">
              {(course.comments || []).length === 0 ? (
                <p className="student-course-no-comments">No comments yet</p>
              ) : (
                [...course.comments].reverse().map((comment) => (
                  <div className="student-course-comment-item" key={comment._id}>
                    <div className="student-course-comment-avatar">
                      {comment.userId?.avatar ? (
                        <img
                          src={comment.userId.avatar}
                          alt={comment.userId?.name}
                        />
                      ) : (
                        <span>
                          {(comment.userId?.name || "S")
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="student-course-comment-content">
                      <h4>{comment.userId?.name || "Student"}</h4>
                      <p>{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}