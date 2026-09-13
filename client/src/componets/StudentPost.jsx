import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Calendar,
  Send,
  ArrowLeft,
  Image as ImageIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
} from "lucide-react";

import Cropper from "react-easy-crop";

import "./StudentPost.css";

export default function StudentPost({ onBack }) {
  const navigate = useNavigate();

  /* =====================================================
     BASIC POST STATES
  ===================================================== */

  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaType, setMediaType] = useState("");

  const [schedule, setSchedule] = useState("");
  const [postMode, setPostMode] = useState("post");
  const [loading, setLoading] = useState(false);

  const [visibility, setVisibility] = useState("public");
  const [sharedToFeed, setSharedToFeed] = useState(false);

  /* =====================================================
     EDITOR SCREEN
  ===================================================== */

  const [showVideoEditor, setShowVideoEditor] = useState(false);

  /* =====================================================
     CROP STATES
  ===================================================== */

  const [showCrop, setShowCrop] = useState(false);

  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [aspect, setAspect] = useState(null);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const [cropImage, setCropImage] = useState("");

  /* =====================================================
     VIDEO STATES
  ===================================================== */

  const videoRef = useRef(null);

  const [videoDuration, setVideoDuration] = useState(0);

  const [trimStart, setTrimStart] = useState(0);

  const [trimEnd, setTrimEnd] = useState(0);

  const [videoCurrentTime, setVideoCurrentTime] =
    useState(0);

  const [videoPlaying, setVideoPlaying] = useState(false);

  const [videoMuted, setVideoMuted] = useState(false);

  /* =====================================================
     COVER PHOTO
  ===================================================== */

  const [coverFrames, setCoverFrames] = useState([]);

  const [selectedCoverIndex, setSelectedCoverIndex] =
    useState(0);

  const [selectedCoverTime, setSelectedCoverTime] =
    useState(0);

  /* =====================================================
     VIDEO FILE SELECT
  ===================================================== */

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/")
    ) {
      alert("Only image or video allowed");
      return;
    }

    const type = file.type.startsWith("video/")
      ? "video"
      : "image";

    const previewUrl = URL.createObjectURL(file);

    setMediaFile(file);
    setMediaType(type);
    setMediaPreview(previewUrl);

    /* =================================================
       IMAGE
    ================================================= */

    if (type === "image") {
      setCropImage(previewUrl);

      setCrop({
        x: 0,
        y: 0,
      });

      setZoom(1);
      setAspect(null);

      setShowCrop(true);
      return;
    }

    /* =================================================
       VIDEO
    ================================================= */

    setVideoDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setVideoCurrentTime(0);

    setCoverFrames([]);
    setSelectedCoverIndex(0);
    setSelectedCoverTime(0);

    setShowVideoEditor(true);
  };

  /* =====================================================
     VIDEO METADATA
  ===================================================== */

  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current;

    if (!video) return;

    const duration = video.duration;

    if (!Number.isFinite(duration)) return;

    setVideoDuration(duration);

    setTrimStart(0);
    setTrimEnd(duration);

    generateCoverFrames(video);
  };

  /* =====================================================
     GENERATE VIDEO COVER FRAMES
  ===================================================== */

  const generateCoverFrames = async (video) => {
    try {
      const duration = video.duration;

      if (!duration || !Number.isFinite(duration)) {
        return;
      }

      const numberOfFrames = 6;

      const canvas = document.createElement("canvas");

      const width = 240;

      const height =
        (video.videoHeight / video.videoWidth) *
        width;

      canvas.width = width;
      canvas.height = height || 150;

      const ctx = canvas.getContext("2d");

      const frames = [];

      for (let i = 0; i < numberOfFrames; i++) {
        const time =
          (duration / (numberOfFrames - 1)) * i;

        await seekVideo(video, time);

        ctx.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const image = canvas.toDataURL(
          "image/jpeg",
          0.85
        );

        frames.push({
          image,
          time,
        });
      }

      setCoverFrames(frames);

      if (frames.length > 0) {
        setSelectedCoverTime(frames[0].time);
        setSelectedCoverIndex(0);
      }

      video.currentTime = 0;
    } catch (error) {
      console.error(
        "Cover frame generation error:",
        error
      );
    }
  };

  /* =====================================================
     SEEK VIDEO
  ===================================================== */

  const seekVideo = (video, time) => {
    return new Promise((resolve) => {
      const handler = () => {
        video.removeEventListener(
          "seeked",
          handler
        );

        resolve();
      };

      video.addEventListener(
        "seeked",
        handler
      );

      video.currentTime = Math.max(
        0,
        Math.min(time, video.duration)
      );
    });
  };

  /* =====================================================
     VIDEO PLAY / PAUSE
  ===================================================== */

  const toggleVideoPlay = async () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.paused) {
      if (
        video.currentTime < trimStart ||
        video.currentTime >= trimEnd
      ) {
        video.currentTime = trimStart;
      }

      try {
        await video.play();
        setVideoPlaying(true);
      } catch (error) {
        console.error(error);
      }
    } else {
      video.pause();
      setVideoPlaying(false);
    }
  };

  /* =====================================================
     VIDEO TIME UPDATE
  ===================================================== */

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) return;

    setVideoCurrentTime(video.currentTime);

    if (video.currentTime >= trimEnd) {
      video.pause();

      video.currentTime = trimStart;

      setVideoPlaying(false);
    }
  };

  /* =====================================================
     VIDEO END
  ===================================================== */

  const handleVideoEnded = () => {
    const video = videoRef.current;

    if (!video) return;

    video.currentTime = trimStart;

    setVideoPlaying(false);
  };

  /* =====================================================
     SELECT COVER
  ===================================================== */

  const handleSelectCover = (frame, index) => {
    setSelectedCoverIndex(index);

    setSelectedCoverTime(frame.time);

    const video = videoRef.current;

    if (video) {
      video.currentTime = frame.time;
      video.pause();
      setVideoPlaying(false);
    }
  };

  /* =====================================================
     TRIM START
  ===================================================== */

  const handleTrimStart = (value) => {
    const newStart = Number(value);

    if (newStart >= trimEnd) return;

    setTrimStart(newStart);

    const video = videoRef.current;

    if (
      video &&
      video.currentTime < newStart
    ) {
      video.currentTime = newStart;
    }
  };

  /* =====================================================
     TRIM END
  ===================================================== */

  const handleTrimEnd = (value) => {
    const newEnd = Number(value);

    if (newEnd <= trimStart) return;

    setTrimEnd(newEnd);

    const video = videoRef.current;

    if (
      video &&
      video.currentTime > newEnd
    ) {
      video.currentTime = newEnd;
    }
  };

  /* =====================================================
     SOUND
  ===================================================== */

  const toggleVideoSound = () => {
    const video = videoRef.current;

    if (!video) return;

    video.muted = !video.muted;

    setVideoMuted(video.muted);
  };

  /* =====================================================
     FORMAT TIME
  ===================================================== */

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) {
      return "0s";
    }

    const rounded = Math.floor(seconds);

    const minutes = Math.floor(
      rounded / 60
    );

    const secs = rounded % 60;

    if (minutes > 0) {
      return `${minutes}:${String(
        secs
      ).padStart(2, "0")}`;
    }

    return `${secs}s`;
  };

  /* =====================================================
     GO FROM VIDEO EDIT TO CROP
  ===================================================== */

  const handleVideoEditorNext = () => {
    if (!mediaPreview) return;

    setCropImage(mediaPreview);

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(1);

    setAspect(null);

    setShowVideoEditor(false);

    setShowCrop(true);
  };

  /* =====================================================
     CROP COMPLETE
  ===================================================== */

  const onCropComplete = useCallback(
    (croppedArea, croppedAreaPixelsValue) => {
      setCroppedAreaPixels(
        croppedAreaPixelsValue
      );
    },
    []
  );

  /* =====================================================
     CREATE CROPPED IMAGE
     IMAGE ONLY
  ===================================================== */

  const createCroppedImage = async () => {
    if (
      !cropImage ||
      !croppedAreaPixels
    ) {
      return;
    }

    /* =================================================
       VIDEO
       Do NOT convert video into image.
       Save crop settings for backend.
    ================================================= */

    if (mediaType === "video") {
      setShowCrop(false);

      return;
    }

    /* =================================================
       IMAGE CROP
    ================================================= */

    try {
      const image = new Image();

      image.src = cropImage;

      await new Promise(
        (resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        }
      );

      const canvas =
        document.createElement(
          "canvas"
        );

      const width =
        croppedAreaPixels.width;

      const height =
        croppedAreaPixels.height;

      canvas.width = width;
      canvas.height = height;

      const ctx =
        canvas.getContext("2d");

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        width,
        height
      );

      const blob =
        await new Promise(
          (resolve) => {
            canvas.toBlob(
              (result) =>
                resolve(result),
              "image/jpeg",
              0.95
            );
          }
        );

      if (!blob) {
        alert("Unable to crop image");
        return;
      }

      const croppedFile =
        new File(
          [blob],
          mediaFile?.name ||
            "cropped-image.jpg",
          {
            type: "image/jpeg",
          }
        );

      const croppedUrl =
        URL.createObjectURL(blob);

      setMediaFile(croppedFile);
      setMediaPreview(croppedUrl);

      setShowCrop(false);
    } catch (error) {
      console.error(
        "Crop error:",
        error
      );

      alert(
        "Unable to crop image"
      );
    }
  };

  /* =====================================================
     CANCEL CROP
  ===================================================== */

  const cancelCrop = () => {
    setShowCrop(false);

    if (mediaType === "video") {
      setShowVideoEditor(true);
    }
  };

  /* =====================================================
     CHANGE ASPECT
  ===================================================== */

  const changeAspect = (value) => {
    setZoom(1);

    setCrop({
      x: 0,
      y: 0,
    });

    if (value === "original") {
      setAspect(null);
    }

    if (value === "square") {
      setAspect(1);
    }

    if (value === "portrait") {
      setAspect(4 / 5);
    }

    if (value === "landscape") {
      setAspect(16 / 9);
    }
  };

  /* =====================================================
     VIDEO EDIT SCREEN
  ===================================================== */

  if (showVideoEditor) {
    return (
      <div className="instagram-video-editor">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="video-editor-header">

          <button
            type="button"
            className="video-editor-back"
            onClick={() => {
              setShowVideoEditor(false);
              setMediaFile(null);
              setMediaPreview("");
              setMediaType("");
            }}
          >
            <ArrowLeft size={25} />
          </button>

          <h2>Edit</h2>

          <button
            type="button"
            className="video-editor-next"
            onClick={
              handleVideoEditorNext
            }
          >
            Next
          </button>

        </div>

        {/* =================================================
            EDITOR BODY
        ================================================= */}

        <div className="video-editor-body">

          {/* =================================================
              VIDEO PREVIEW
          ================================================= */}

          <div className="video-editor-preview">

            <video
              ref={videoRef}
              src={mediaPreview}
              className="video-editor-main-video"
              playsInline
              preload="metadata"
              muted={videoMuted}
              onLoadedMetadata={
                handleVideoLoadedMetadata
              }
              onTimeUpdate={
                handleVideoTimeUpdate
              }
              onEnded={
                handleVideoEnded
              }
            />

            {/* PLAY BUTTON */}

            <button
              type="button"
              className="video-center-play"
              onClick={
                toggleVideoPlay
              }
            >
              {videoPlaying ? (
                <Pause size={30} />
              ) : (
                <Play size={30} />
              )}
            </button>

            {/* SOUND */}

            <button
              type="button"
              className="video-sound-btn"
              onClick={
                toggleVideoSound
              }
            >
              {videoMuted ? (
                <VolumeX size={20} />
              ) : (
                <Volume2 size={20} />
              )}
            </button>

          </div>

          {/* =================================================
              RIGHT / BOTTOM EDIT CONTENT
          ================================================= */}

          <div className="video-editor-controls">

            {/* =================================================
                COVER PHOTO
            ================================================= */}

            <div className="video-editor-section">

              <div className="video-section-title-row">

                <h3>
                  Cover photo
                </h3>

                <button
                  type="button"
                  className="select-cover-computer"
                  onClick={() =>
                    document
                      .getElementById(
                        "cover-upload"
                      )
                      ?.click()
                  }
                >
                  Select from computer
                </button>

                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file =
                      e.target.files?.[0];

                    if (!file) return;

                    const url =
                      URL.createObjectURL(
                        file
                      );

                    setCoverFrames([
                      {
                        image: url,
                        time: selectedCoverTime,
                        custom: true,
                      },
                      ...coverFrames,
                    ]);

                    setSelectedCoverIndex(
                      0
                    );
                  }}
                />

              </div>

              {/* COVER FRAMES */}

              <div className="cover-frame-strip">

                {coverFrames.map(
                  (frame, index) => (
                    <button
                      type="button"
                      key={`${frame.time}-${index}`}
                      className={`cover-frame ${
                        selectedCoverIndex ===
                        index
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelectCover(
                          frame,
                          index
                        )
                      }
                    >
                      <img
                        src={
                          frame.image
                        }
                        alt={`Cover ${index + 1}`}
                      />
                    </button>
                  )
                )}

              </div>

            </div>

            {/* =================================================
                TRIM
            ================================================= */}

            <div className="video-editor-section trim-section">

              <h3>Trim</h3>

              <div className="trim-preview-strip">

                {coverFrames.map(
                  (frame, index) => (
                    <img
                      key={index}
                      src={
                        frame.image
                      }
                      alt=""
                    />
                  )
                )}

                <div
                  className="trim-selection"
                  style={{
                    left:
                      videoDuration
                        ? `${
                            (trimStart /
                              videoDuration) *
                            100
                          }%`
                        : "0%",
                    width:
                      videoDuration
                        ? `${
                            ((trimEnd -
                              trimStart) /
                              videoDuration) *
                            100
                          }%`
                        : "100%",
                  }}
                />

              </div>

              {/* RANGE */}

              <div className="trim-range-wrapper">

                <input
                  type="range"
                  min="0"
                  max={videoDuration || 1}
                  step="0.01"
                  value={trimStart}
                  onChange={(e) =>
                    handleTrimStart(
                      e.target.value
                    )
                  }
                  className="trim-range trim-start"
                />

                <input
                  type="range"
                  min="0"
                  max={videoDuration || 1}
                  step="0.01"
                  value={trimEnd}
                  onChange={(e) =>
                    handleTrimEnd(
                      e.target.value
                    )
                  }
                  className="trim-range trim-end"
                />

              </div>

              {/* TIME */}

              <div className="trim-time-labels">

                <span>
                  {formatTime(
                    trimStart
                  )}
                </span>

                <span>
                  {formatTime(
                    trimEnd
                  )}
                </span>

              </div>

            </div>

            {/* =================================================
                SOUND
            ================================================= */}

            <div className="video-sound-row">

              <span>
                Sound{" "}
                {videoMuted
                  ? "off"
                  : "on"}
              </span>

              <button
                type="button"
                className={`sound-switch ${
                  !videoMuted
                    ? "on"
                    : ""
                }`}
                onClick={
                  toggleVideoSound
                }
              >
                <span />
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  /* =====================================================
     CROP SCREEN
  ===================================================== */

  if (showCrop) {
    return (
      <div className="instagram-crop-page">

        {/* HEADER */}

        <div className="crop-header">

          <button
            type="button"
            className="crop-back-btn"
            onClick={cancelCrop}
          >
            <ArrowLeft size={25} />
          </button>

          <h2>Crop</h2>

          <button
            type="button"
            className="crop-next-btn"
            onClick={
              createCroppedImage
            }
          >
            Next
          </button>

        </div>

        {/* MAIN */}

        <div className="crop-main-area">

          <div className="crop-image-container">

            {mediaType === "video" ? (
              <Cropper
                video={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={
                  aspect || undefined
                }
                onCropChange={
                  setCrop
                }
                onZoomChange={
                  setZoom
                }
                onCropComplete={
                  onCropComplete
                }
                showGrid={true}
                objectFit="contain"
                restrictPosition={
                  false
                }
              />
            ) : (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={
                  aspect || undefined
                }
                onCropChange={
                  setCrop
                }
                onZoomChange={
                  setZoom
                }
                onCropComplete={
                  onCropComplete
                }
                showGrid={true}
                objectFit="contain"
                restrictPosition={
                  false
                }
              />
            )}

          </div>

          {/* RATIO MENU */}

          <div className="crop-ratio-menu">

            <button
              type="button"
              className={`crop-ratio-btn ${
                aspect === null
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                changeAspect(
                  "original"
                )
              }
            >
              <span>
                Original
              </span>

              <ImageIcon
                size={21}
              />
            </button>

            <button
              type="button"
              className={`crop-ratio-btn ${
                aspect === 1
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                changeAspect(
                  "square"
                )
              }
            >
              <span>1:1</span>

              <span className="ratio-icon ratio-square" />
            </button>

            <button
              type="button"
              className={`crop-ratio-btn ${
                aspect === 4 / 5
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                changeAspect(
                  "portrait"
                )
              }
            >
              <span>4:5</span>

              <span className="ratio-icon ratio-portrait" />
            </button>

            <button
              type="button"
              className={`crop-ratio-btn ${
                aspect === 16 / 9
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                changeAspect(
                  "landscape"
                )
              }
            >
              <span>16:9</span>

              <span className="ratio-icon ratio-landscape" />
            </button>

          </div>

        </div>

        {/* BOTTOM */}

        <div className="crop-bottom-controls">

          <button
            type="button"
            className="crop-control-btn"
            onClick={() => {
              setCrop({
                x: 0,
                y: 0,
              });

              setZoom(1);
            }}
          >
            <Maximize
              size={20}
            />
          </button>

          <div className="zoom-control">

            <span>−</span>

            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) =>
                setZoom(
                  Number(
                    e.target.value
                  )
                )
              }
            />

            <span>+</span>

          </div>

        </div>

      </div>
    );
  }

  /* =====================================================
     NORMAL POST PAGE
  ===================================================== */

  const handleSubmit = async (
    isScheduled = false
  ) => {
    if (
      !content.trim() &&
      !mediaFile
    ) {
      alert(
        "Please enter content or choose media"
      );

      return;
    }

    if (
      isScheduled &&
      !schedule
    ) {
      alert(
        "Please select schedule date and time"
      );

      return;
    }

    try {
      setLoading(true);

      const formData =
        new FormData();

      formData.append(
        "content",
        content.trim()
      );

      if (
        postMode === "reel"
      ) {
        formData.append(
          "sharedToFeed",
          sharedToFeed
        );
      }

      if (mediaFile) {
        formData.append(
          "media",
          mediaFile
        );
      }

      /* =================================================
         VIDEO EDIT SETTINGS
      ================================================= */

      if (
        mediaType === "video"
      ) {
        formData.append(
          "trimStart",
          trimStart
        );

        formData.append(
          "trimEnd",
          trimEnd
        );

        formData.append(
          "selectedCoverTime",
          selectedCoverTime
        );

        formData.append(
          "cropX",
          crop.x
        );

        formData.append(
          "cropY",
          crop.y
        );

        formData.append(
          "cropZoom",
          zoom
        );

        formData.append(
          "cropAspect",
          aspect || "original"
        );

        formData.append(
          "videoMuted",
          videoMuted
        );

        /* =================================================
           COVER IMAGE
        ================================================= */

        if (
          coverFrames[
            selectedCoverIndex
          ]
        ) {
          try {
            const coverBlob =
              await fetch(
                coverFrames[
                  selectedCoverIndex
                ].image
              ).then((r) =>
                r.blob()
              );

            const coverFile =
              new File(
                [coverBlob],
                "video-cover.jpg",
                {
                  type: "image/jpeg",
                }
              );

            formData.append(
              "cover",
              coverFile
            );
          } catch (error) {
            console.error(
              "Cover upload error:",
              error
            );
          }
        }
      }

      if (
        postMode === "post"
      ) {
        formData.append(
          "visibility",
          visibility
        );
      }

      if (
        isScheduled &&
        schedule
      ) {
        formData.append(
          "schedule",
          schedule
        );
      }

      const apiUrl =
        postMode === "post"
          ? `${import.meta.env.VITE_API_URL}/api/student/posts`
          : `${import.meta.env.VITE_API_URL}/api/student/reels`;

      const res =
        await fetch(
          apiUrl,
          {
            method: "POST",
            credentials: "include",
            body: formData,
          }
        );

      const text =
        await res.text();

      let data = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch (e) {
        console.error(
          "Non-JSON response:",
          text
        );

        alert(
          `Server returned invalid response for ${postMode}. Check backend route.`
        );

        return;
      }

      if (!res.ok) {
        alert(
          data.message ||
            `Failed to create ${postMode}`
        );

        return;
      }

      alert(
        isScheduled
          ? `${
              postMode ===
              "post"
                ? "Post"
                : "Reel"
            } scheduled successfully`
          : `${
              postMode ===
              "post"
                ? "Post"
                : "Reel"
            } created successfully`
      );

      setContent("");
      setMediaFile(null);
      setMediaPreview("");
      setMediaType("");
      setSchedule("");
      setSharedToFeed(false);

      setShowVideoEditor(false);
      setShowCrop(false);

      setCoverFrames([]);
      setSelectedCoverIndex(0);
      setSelectedCoverTime(0);

      setTrimStart(0);
      setTrimEnd(0);

      navigate(
        "/student/student"
      );
    } catch (error) {
      console.error(
        `Create ${postMode} error:`,
        error
      );

      alert(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     NORMAL PAGE
  ===================================================== */

  return (
    <div className="student-post-wrapper">

      <div className="student-post-card">

<div className="student-post-header">

  {/* MOBILE BACK ARROW */}

  <button
    type="button"
    className="mobile-post-back"
    onClick={(e) => {
      e.stopPropagation();

      if (onBack) {
        onBack();
      } else {
        navigate(-1);
      }
    }}
    aria-label="Back"
  >
    <ArrowLeft size={24} />
  </button>


  {/* HEADER TEXT */}

  <div className="student-post-header-content">

    <h2>
      Create{" "}
      {postMode === "post"
        ? "Post"
        : "Reel"}
    </h2>

    <p>
      Share your content with
      the Gronxity community.
    </p>

  </div>

</div>



        {/* CONTENT TYPE */}

        <div className="share-type-box">

          <label className="field-label">
            Content Type
          </label>

          <select
            className="post-input"
            value={postMode}
            onChange={(e) =>
              setPostMode(
                e.target.value
              )
            }
          >
            <option value="post">
              Post
            </option>

            <option value="reel">
              Reel
            </option>
          </select>

        </div>

        {/* VISIBILITY */}

        {postMode ===
          "post" && (
          <div className="share-type-box">

            <label className="field-label">
              Visibility
            </label>

            <select
              className="post-input"
              value={
                visibility
              }
              onChange={(e) =>
                setVisibility(
                  e.target.value
                )
              }
            >
              <option value="public">
                🌍 Public
              </option>

              <option value="private">
                👥 Followers &
                Connections
              </option>
            </select>

          </div>
        )}

        {/* REEL FEED */}

        {postMode ===
          "reel" && (
          <label className="reel-feed-checkbox">

            <input
              type="checkbox"
              checked={
                sharedToFeed
              }
              onChange={(e) =>
                setSharedToFeed(
                  e.target.checked
                )
              }
            />

            <span>
              Share reel to
              Posts feed
            </span>

          </label>
        )}

        {/* CONTENT */}

        <textarea
          className="post-textarea"
          placeholder={`Write your ${postMode} content...`}
          value={content}
          onChange={(e) =>
            setContent(
              e.target.value
            )
          }
        />

        {/* MEDIA */}

        <div className="upload-block">

          <label className="field-label">
            Upload Image / Video
          </label>

          <input
            type="file"
            className="post-input"
            accept="image/*,video/*"
            onChange={
              handleFileChange
            }
          />

        </div>

        {/* SCHEDULE */}

        <div className="schedule-block">

          <label className="field-label">
            Schedule
          </label>

          <input
            type="datetime-local"
            className="post-input"
            value={schedule}
            onChange={(e) =>
              setSchedule(
                e.target.value
              )
            }
          />

        </div>

        {/* PREVIEW */}

        {mediaPreview && (
          <div className="preview-section">

            <h3>
              Preview
            </h3>

            <div className="media-preview-card">

              {mediaType ===
              "video" ? (
                <video
                  controls
                  className="preview-media"
                  src={
                    mediaPreview
                  }
                />
              ) : (
                <img
                  src={
                    mediaPreview
                  }
                  alt="preview"
                  className="preview-media"
                />
              )}

            </div>

          </div>
        )}

        {/* BUTTONS */}

        <div className="post-btn-row">

          <button
            type="button"
            className="submit-post-btn"
            onClick={() =>
              handleSubmit(
                false
              )
            }
            disabled={loading}
          >
            <Send size={18} />

            {loading
              ? "Posting..."
              : postMode ===
                "post"
              ? "Post"
              : "Reel"}
          </button>

          <button
            type="button"
            className="schedule-post-btn"
            onClick={() =>
              handleSubmit(
                true
              )
            }
            disabled={loading}
          >
            <Calendar
              size={18}
            />

            {loading
              ? "Scheduling..."
              : `Schedule ${postMode}`}
          </button>

        </div>

      </div>

    </div>
  );
}