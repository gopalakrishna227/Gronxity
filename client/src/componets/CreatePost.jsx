import React, { useState } from "react";
import "./CreatePost.css";

const CreatePost = ({ user, addPost }) => {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaType(type);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!content && !mediaFile) return;

    const newPost = {
      id: Date.now(),
      author: user?.name || "Guest",
      avatar: user?.avatar || "",
      content,
      media: preview,
      isVideo: mediaType === "video",
      time: "Just now",
    };

    if (addPost) addPost(newPost);

    setContent("");
    setMediaFile(null);
    setPreview(null);
    setMediaType(null);
  };

  return (
    <div className="createpost-page">
      <div className="modal">
        <h2 className="modal-title">Create Post</h2>

        <div className="user-info">
          {user?.avatar && (
            <img src={user.avatar} alt="user" className="avatar" />
          )}
          <span className="username">{user?.name || "Guest"}</span>
        </div>

        <textarea
          className="post-textarea"
          placeholder="What do you want to talk about?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {preview && (
          <div className="preview-box">
            <button
              className="remove-btn"
              onClick={() => {
                setMediaFile(null);
                setPreview(null);
                setMediaType(null);
              }}
            >
              ✕
            </button>

            {mediaType === "video" ? (
              <video src={preview} controls className="media-preview" />
            ) : (
              <img src={preview} alt="preview" className="media-preview" />
            )}
          </div>
        )}

        <div className="actions">
          <div>
            <label className="file-btn">
              📷 Image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleFileChange(e, "image")}
              />
            </label>

            <label className="file-btn">
              🎥 Video
              <input
                type="file"
                accept="video/*"
                hidden
                onChange={(e) => handleFileChange(e, "video")}
              />
            </label>
          </div>

          <button
            className="post-btn"
            disabled={!content && !mediaFile}
            onClick={handleSubmit}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;