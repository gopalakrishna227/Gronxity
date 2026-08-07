import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Send } from "lucide-react";
import "./StudentPost.css";

export default function StudentPostReel() {
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaType, setMediaType] = useState("");
  const [schedule, setSchedule] = useState("");
  const [postMode, setPostMode] = useState("post"); // post or reel
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState("public");
  const [sharedToFeed, setSharedToFeed] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("Only image or video allowed");
      return;
    }

    setMediaFile(file);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    setMediaPreview(URL.createObjectURL(file));
  };

const handleSubmit = async (isScheduled = false) => {
  if (!content.trim() && !mediaFile) {
    alert("Please enter content or choose media");
    return;
  }

  if (isScheduled && !schedule) {
    alert("Please select schedule date and time");
    return;
  }

  try {
    setLoading(true);

const formData = new FormData();

formData.append("content", content.trim());

if (postMode === "reel") {
  formData.append("sharedToFeed", sharedToFeed);
}

if (mediaFile) {
  formData.append("media", mediaFile);
}

if (postMode === "post") {
  formData.append("visibility", visibility); // public or private
}

if (isScheduled && schedule) {
  formData.append("schedule", schedule);
}



    const apiUrl =
      postMode === "post"
        ? `${import.meta.env.VITE_API_URL}/api/student/posts`
        : `${import.meta.env.VITE_API_URL}/api/student/reels`;

    const res = await fetch(apiUrl, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const text = await res.text();
    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("Non-JSON response:", text);
      alert(`Server returned invalid response for ${postMode}. Check backend route.`);
      return;
    }

    if (!res.ok) {
      alert(data.message || `Failed to create ${postMode}`);
      return;
    }

    alert(
      isScheduled
        ? `${postMode === "post" ? "Post" : "Reel"} scheduled successfully`
        : `${postMode === "post" ? "Post" : "Reel"} created successfully`
    );

    setContent("");
    setMediaFile(null);
    setMediaPreview("");
    setMediaType("");
    setSchedule("");
    setSharedToFeed(false);

    navigate("/student/student");
  } catch (error) {
    console.error(`Create ${postMode} error:`, error);
    alert("Something went wrong");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="student-post-wrapper">
      <div className="student-post-card">
        <h2>Create {postMode === "post" ? "Post" : "Reel"}</h2>

        <select
          className="post-input"
          value={postMode}
          onChange={(e) => setPostMode(e.target.value)}
        >
          <option value="post">Post</option>
          <option value="reel">Reel</option>
        </select>


        {/* Show only for Posts */}
{postMode === "post" && (
  <select
    className="post-input"
    value={visibility}
    onChange={(e) => setVisibility(e.target.value)}
  >
    <option value="public">🌍 Public</option>
    <option value="private">👥 Followers & Connections</option>
  </select>
)}


{postMode === "reel" && (
  <label
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "15px",
      fontWeight: "500",
    }}
  >
    <input
      type="checkbox"
      checked={sharedToFeed}
      onChange={(e) => setSharedToFeed(e.target.checked)}
    />
    Share reel to Posts feed
  </label>
)}

        <textarea
          className="post-textarea"
          placeholder={`Write your ${postMode} content...`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <input
          type="file"
          className="post-input"
          accept="image/*,video/*"
          onChange={handleFileChange}
        />

        <input
          type="datetime-local"
          className="post-input"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
        />

        {mediaPreview && (
          <div className="media-preview">
            {mediaType === "video" ? (
              <video controls className="preview-media" src={mediaPreview} />
            ) : (
              <img src={mediaPreview} alt="preview" className="preview-media" />
            )}
          </div>
        )}

        <div className="post-btn-row">
          <button
            className="submit-post-btn"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            <Send size={18} />
            {loading
              ? "Posting..."
              : postMode === "post"
              ? "Post"
              : "Reel"}
          </button>

          <button
            className="schedule-post-btn"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            <Calendar size={18} />
            {loading ? "Scheduling..." : `Schedule ${postMode}`}
          </button>
        </div>
      </div>
    </div>
  );
}