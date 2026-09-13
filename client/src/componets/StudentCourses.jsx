import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  X,
  Play,
  Upload,
  Bookmark,
  Bell,
} from "lucide-react";
import "./StudentCourses.css";
import socket from "../socket";

const API = import.meta.env.VITE_API_URL;

export default function StudentCourses() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [savedCourses, setSavedCourses] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCourseProfileBox, setShowCourseProfileBox] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const [courseProfileForm, setCourseProfileForm] = useState({
    name: "",
    about: "",
    instagram: "",
    linkedin: "",
    telegram: "",
    customLink1Label: "",
    customLink1Url: "",
    customLink2Label: "",
    customLink2Url: "",
    avatarFile: null,
    backgroundImageFile: null,
    avatarPreview: "",
    backgroundPreview: "",
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    videoFile: null,
    thumbnailFile: null,
    thumbnailPreview: "",
  });

  useEffect(() => {
    fetchMyProfile();
    fetchMyCourseProfile();
    fetchAllCourses();
    fetchSavedCourses();
    fetchUnreadCourseNotifications();
  }, []);

  useEffect(() => {
    if (!myProfile?._id) return;

    socket.emit("join_course_notification_room", myProfile._id);

    const handleNewCourseNotification = () => {
      fetchUnreadCourseNotifications();
    };

    socket.on("new_course_notification", handleNewCourseNotification);

    return () => {
      socket.off("new_course_notification", handleNewCourseNotification);
    };
  }, [myProfile?._id]);

  const fetchMyProfile = async () => {
    try {
      const res = await axios.get(`${API}/api/student/profile/me`, {
        withCredentials: true,
      });
      setMyProfile(res.data?.profile || null);
    } catch (err) {
      console.error("Fetch my profile error:", err);
    }
  };

  const fetchMyCourseProfile = async () => {
    try {
      const res = await axios.get(`${API}/api/student/course-profile/me`, {
        withCredentials: true,
      });

      const cp = res.data?.courseProfile || {};

      setCourseProfileForm((prev) => ({
        ...prev,
        name: cp.name || "",
        about: cp.about || "",
        instagram: cp.instagram || "",
        linkedin: cp.linkedin || "",
        telegram: cp.telegram || "",
        customLink1Label: cp.customLink1Label || "",
        customLink1Url: cp.customLink1Url || "",
        customLink2Label: cp.customLink2Label || "",
        customLink2Url: cp.customLink2Url || "",
        avatarFile: null,
        backgroundImageFile: null,
        avatarPreview: cp.avatar || "",
        backgroundPreview: cp.backgroundImage || "",
      }));
    } catch (err) {
      console.error("Fetch my course profile error:", err);
    }
  };

  const fetchAllCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/student/courses`, {
        withCredentials: true,
      });
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch all courses error:", err);
      alert(err.response?.data?.message || "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedCourses = async () => {
    try {
      const res = await axios.get(`${API}/api/student/saved-courses`, {
        withCredentials: true,
      });
      setSavedCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch saved courses error:", err);
    }
  };

  const fetchUnreadCourseNotifications = async () => {
    try {
      const res = await axios.get(
        `${API}/api/student/course-notifications/unread-count`,
        {
          withCredentials: true,
        }
      );
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      console.error("Fetch unread course notifications error:", err);
    }
  };

  const displayCourses = showSavedOnly ? savedCourses : courses;

  const filteredCourses = useMemo(() => {
    return displayCourses.filter((course) => {
      const title = (course.title || "").toLowerCase();
      const owner = (course.owner?.name || "").toLowerCase();
      const q = search.toLowerCase();
      return title.includes(q) || owner.includes(q);
    });
  }, [displayCourses, search]);

  const getInitials = (name = "") => {
    if (!name.trim()) return "GK";
    return name
      .split(" ")
      .map((item) => item[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCourseProfileInput = (e) => {
    const { name, value } = e.target;
    setCourseProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      videoFile: null,
      thumbnailFile: null,
      thumbnailPreview: "",
    });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      thumbnailFile: file,
      thumbnailPreview: file ? URL.createObjectURL(file) : "",
    }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      videoFile: file,
    }));
  };

  const handleCourseAvatarChange = (e) => {
    const file = e.target.files?.[0] || null;

    setCourseProfileForm((prev) => ({
      ...prev,
      avatarFile: file,
      avatarPreview: file ? URL.createObjectURL(file) : prev.avatarPreview,
    }));
  };

  const handleCourseBackgroundChange = (e) => {
    const file = e.target.files?.[0] || null;

    setCourseProfileForm((prev) => ({
      ...prev,
      backgroundImageFile: file,
      backgroundPreview: file
        ? URL.createObjectURL(file)
        : prev.backgroundPreview,
    }));
  };

  const handleUploadCourse = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Course title is required");
      return;
    }

    if (!form.videoFile) {
      alert("Please upload video file");
      return;
    }

    if (!form.thumbnailFile) {
      alert("Please upload thumbnail image");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append(
        "profileName",
        courseProfileForm.name?.trim() || myProfile?.name || "Student"
      );
      formData.append("video", form.videoFile);
      formData.append("thumbnail", form.thumbnailFile);

      const res = await axios.post(`${API}/api/student/courses`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newCourse = res.data?.course;

      if (newCourse) {
        setCourses((prev) => [
          {
            ...newCourse,
            owner: {
              _id: myProfile?._id || newCourse.userId,
              name: courseProfileForm.name || newCourse.author || "Student",
              avatar: newCourse.profileImage || courseProfileForm.avatarPreview || "",
              headline: "",
            },
            isOwner: true,
            isSaved: false,
            isLiked: false,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
          },
          ...prev,
        ]);
      }

      resetForm();
      setShowUpload(false);
      alert("Course uploaded successfully");
    } catch (err) {
      console.error("Upload course error:", err);
      alert(err.response?.data?.message || "Failed to upload course");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCourse = async (courseId) => {
    try {
      const res = await axios.put(
        `${API}/api/student/course/${courseId}/save`,
        {},
        { withCredentials: true }
      );

      const newSavedState = Boolean(res.data?.isSaved);

      setCourses((prev) =>
        prev.map((course) =>
          course._id === courseId
            ? { ...course, isSaved: newSavedState }
            : course
        )
      );

      if (showSavedOnly || newSavedState) {
        fetchSavedCourses();
      } else {
        setSavedCourses((prev) =>
          prev.filter((course) => course._id !== courseId)
        );
      }
    } catch (err) {
      console.error("Save course error:", err);
      alert(err.response?.data?.message || "Failed to save course");
    }
  };

  const handleSaveCourseProfile = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("name", courseProfileForm.name);
      formData.append("about", courseProfileForm.about);
      formData.append("instagram", courseProfileForm.instagram);
      formData.append("linkedin", courseProfileForm.linkedin);
      formData.append("telegram", courseProfileForm.telegram);
      formData.append("customLink1Label", courseProfileForm.customLink1Label);
      formData.append("customLink1Url", courseProfileForm.customLink1Url);
      formData.append("customLink2Label", courseProfileForm.customLink2Label);
      formData.append("customLink2Url", courseProfileForm.customLink2Url);

      if (courseProfileForm.avatarFile) {
        formData.append("avatar", courseProfileForm.avatarFile);
      }

      if (courseProfileForm.backgroundImageFile) {
        formData.append("backgroundImage", courseProfileForm.backgroundImageFile);
      }

      await axios.put(`${API}/api/student/course-profile/me`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Course profile updated successfully");
      setShowCourseProfileBox(false);
      fetchMyCourseProfile();
      fetchAllCourses();
    } catch (err) {
      console.error("Save course profile error:", err);
      alert(err.response?.data?.message || "Failed to update course profile");
    }
  };

  const handleRemoveCourseAvatar = async () => {
    try {
      await axios.delete(`${API}/api/student/course-profile/avatar`, {
        withCredentials: true,
      });

      setCourseProfileForm((prev) => ({
        ...prev,
        avatarFile: null,
        avatarPreview: "",
      }));

      fetchMyCourseProfile();
    } catch (err) {
      console.error("Remove course avatar error:", err);
      alert(err.response?.data?.message || "Failed to remove avatar");
    }
  };

  const handleRemoveCourseBackground = async () => {
    try {
      await axios.delete(`${API}/api/student/course-profile/background`, {
        withCredentials: true,
      });

      setCourseProfileForm((prev) => ({
        ...prev,
        backgroundImageFile: null,
        backgroundPreview: "",
      }));

      fetchMyCourseProfile();
    } catch (err) {
      console.error("Remove course background error:", err);
      alert(err.response?.data?.message || "Failed to remove background");
    }
  };

  const handleOpenPlayer = (courseId) => {
    navigate(`/student/course/${courseId}`);
  };

  const handleOpenProfileCourses = (userId) => {
    navigate(`/student/course-profile/${userId}`);
  };

  const handleOpenCourseNotifications = () => {
    navigate("/student/course-notifications");
  };

  return (
    <div className="student-courses-page">
      <header className="student-courses-navbar">
        <div className="student-courses-navbar-left">
          <h1 className="student-courses-logo">Gronxtiy</h1>
        </div>





        

<div
  className={`student-courses-navbar-center ${
    mobileSearchOpen ? "mobile-search-active" : ""
  }`}
>
  {/* DESKTOP / LAPTOP SEARCH */}
  <div className="student-courses-search desktop-course-search">
    <Search size={18} />

    <input
      type="text"
      placeholder={
        showSavedOnly
          ? "Search saved courses..."
          : "Search uploaded courses..."
      }
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>

  {/* MOBILE SEARCH ICON */}
  <button
    type="button"
    className="student-courses-mobile-search-trigger"
    onClick={() => setMobileSearchOpen(true)}
  >
    <Search size={22} />
  </button>

  {/* MOBILE OPEN SEARCH BAR */}
  {mobileSearchOpen && (
    <div className="student-courses-mobile-search-box">

      <button
        type="button"
        className="student-courses-mobile-search-back"
        onClick={() => setMobileSearchOpen(false)}
      >
        <X size={21} />
      </button>

      <input
        type="text"
        autoFocus
        placeholder={
          showSavedOnly
            ? "Search saved courses..."
            : "Search courses..."
        }
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Search
        size={21}
        className="student-courses-mobile-search-icon"
      />

    </div>
  )}
</div>




















        <div className="student-courses-navbar-right">
          <button
            className={`student-courses-secondary-btn ${
              showSavedOnly ? "active" : ""
            }`}
            onClick={() => setShowSavedOnly((prev) => !prev)}
          >
            <Bookmark size={18} />
            <span>{showSavedOnly ? "All Courses" : "Saved Courses"}</span>
          </button>

          <button
            className="student-courses-notification-btn"
            onClick={handleOpenCourseNotifications}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="student-courses-notification-badge">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            className="student-courses-upload-btn"
            onClick={() => setShowUpload(true)}
          >
            <Plus size={18} />
            <span>Upload Course</span>
          </button>

          <div
            className="student-courses-profile-chip"
            onClick={() => setShowCourseProfileBox(true)}
          >
            {getInitials(courseProfileForm?.name || myProfile?.name || "GK")}
          </div>
        </div>
      </header>
<main className="student-courses-main">
  <div className="student-courses-mobile-scroll">
    {loading ? (
      <div className="student-courses-empty">
        Loading courses...
      </div>
    ) : filteredCourses.length === 0 ? (
      <div className="student-courses-empty">
        {showSavedOnly
          ? "No saved courses found"
          : "No courses found"}
      </div>
    ) : (
      <div className="student-courses-grid">
        {filteredCourses.map((course) => (
          <div className="student-course-card" key={course._id}>
            
            <div
              className="student-course-thumb-wrap"
              onClick={() => handleOpenPlayer(course._id)}
            >
              <img
                src={
                  course.thumbnail ||
                  "https://via.placeholder.com/800x450?text=Course+Thumbnail"
                }
                alt={course.title}
                className="student-course-thumb"
              />

              <div className="student-course-play-overlay">
                <Play size={30} />
              </div>
            </div>

            <div className="student-course-card-body">

              <div
                className="student-course-owner-avatar"
                onClick={() =>
                  handleOpenProfileCourses(course.owner?._id)
                }
              >
                {course.owner?.avatar ? (
                  <img
                    src={course.owner.avatar}
                    alt={course.owner?.name}
                    className="student-course-owner-img"
                  />
                ) : (
                  getInitials(course.owner?.name || "Student")
                )}
              </div>

              <div className="student-course-info">

                <h3
                  onClick={() =>
                    handleOpenPlayer(course._id)
                  }
                >
                  {course.title}
                </h3>

                <p
                  className="student-course-owner-name"
                  onClick={() =>
                    handleOpenProfileCourses(course.owner?._id)
                  }
                >
                  {course.owner?.name || "Student"}
                </p>

                <span className="student-course-meta">
                  {course.views || 0} views •{" "}
                  {course.likesCount || 0} likes
                </span>

              </div>

              <div className="student-course-card-actions">

                <button
                  className={`student-course-save-btn ${
                    course.isSaved ? "saved" : ""
                  }`}
                  onClick={() =>
                    handleSaveCourse(course._id)
                  }
                >
                  <Bookmark size={16} />

                  <span>
                    {course.isSaved ? "Saved" : "Save"}
                  </span>
                </button>

              </div>

            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</main>

      {showUpload && (
        <div
          className="student-course-modal-overlay"
          onClick={() => setShowUpload(false)}
        >
          <div
            className="student-course-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="student-course-modal-header">
              <h2>Upload Course</h2>
              <button
                className="student-course-modal-close"
                onClick={() => setShowUpload(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="student-course-upload-form"
              onSubmit={handleUploadCourse}
            >
              <div className="student-course-form-group">
                <label>Course Title</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="Enter course title"
                />
              </div>

              <div className="student-course-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Enter course description"
                  rows="4"
                />
              </div>

              <div className="student-course-form-group">
                <label>Upload Video File</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                />
              </div>

              <div className="student-course-form-group">
                <label>Upload Thumbnail Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                />

                {form.thumbnailPreview && (
                  <div className="student-youtube-preview-box">
                    <img
                      src={form.thumbnailPreview}
                      alt="Thumbnail Preview"
                      className="student-youtube-preview-image"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="student-course-submit-btn"
                disabled={uploading}
              >
                <Upload size={18} />
                {uploading ? "Uploading..." : "Upload Course"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showCourseProfileBox && (
        <div
          className="student-course-modal-overlay"
          onClick={() => setShowCourseProfileBox(false)}
        >
          <div
            className="student-course-modal student-course-profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="student-course-modal-header">
              <h2>Edit Course Profile</h2>
              <button
                className="student-course-modal-close"
                onClick={() => setShowCourseProfileBox(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="student-course-upload-form"
              onSubmit={handleSaveCourseProfile}
            >
              <div className="student-course-form-group">
                <label>Course Profile Name</label>
                <input
                  type="text"
                  name="name"
                  value={courseProfileForm.name}
                  onChange={handleCourseProfileInput}
                  placeholder="Enter course profile name"
                />
              </div>

              <div className="student-course-form-group">
                <label>About</label>
                <textarea
                  name="about"
                  value={courseProfileForm.about}
                  onChange={handleCourseProfileInput}
                  placeholder="Write about your course profile"
                  rows="4"
                />
              </div>

              <div className="student-course-form-group">
                <label>Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCourseAvatarChange}
                />
                {courseProfileForm.avatarPreview && (
                  <div className="student-course-profile-preview-box">
                    <img
                      src={courseProfileForm.avatarPreview}
                      alt="Avatar Preview"
                    />
                    <button
                      type="button"
                      className="student-course-remove-image-btn"
                      onClick={handleRemoveCourseAvatar}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="student-course-form-group">
                <label>Background Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCourseBackgroundChange}
                />
                {courseProfileForm.backgroundPreview && (
                  <div className="student-course-profile-preview-box">
                    <img
                      src={courseProfileForm.backgroundPreview}
                      alt="Background Preview"
                    />
                    <button
                      type="button"
                      className="student-course-remove-image-btn"
                      onClick={handleRemoveCourseBackground}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="student-course-form-group">
                <label>Instagram Link</label>
                <input
                  type="text"
                  name="instagram"
                  value={courseProfileForm.instagram}
                  onChange={handleCourseProfileInput}
                  placeholder="Enter instagram link"
                />
              </div>

              <div className="student-course-form-group">
                <label>LinkedIn Link</label>
                <input
                  type="text"
                  name="linkedin"
                  value={courseProfileForm.linkedin}
                  onChange={handleCourseProfileInput}
                  placeholder="Enter linkedin link"
                />
              </div>

              <div className="student-course-form-group">
                <label>Telegram Link</label>
                <input
                  type="text"
                  name="telegram"
                  value={courseProfileForm.telegram}
                  onChange={handleCourseProfileInput}
                  placeholder="Enter telegram link"
                />
              </div>

              <div className="student-course-form-group">
                <label>Custom Link 1 Label</label>
                <input
                  type="text"
                  name="customLink1Label"
                  value={courseProfileForm.customLink1Label}
                  onChange={handleCourseProfileInput}
                  placeholder="Example: YouTube"
                />
              </div>

              <div className="student-course-form-group">
                <label>Custom Link 1 URL</label>
                <input
                  type="text"
                  name="customLink1Url"
                  value={courseProfileForm.customLink1Url}
                  onChange={handleCourseProfileInput}
                  placeholder="Enter custom link 1 URL"
                />
              </div>

              <div className="student-course-form-group">
                <label>Custom Link 2 Label</label>
                <input
                  type="text"
                  name="customLink2Label"
                  value={courseProfileForm.customLink2Label}
                  onChange={handleCourseProfileInput}
                  placeholder="Example: Website"
                />
              </div>

              <div className="student-course-form-group">
                <label>Custom Link 2 URL</label>
                <input
                  type="text"
                  name="customLink2Url"
                  value={courseProfileForm.customLink2Url}
                  onChange={handleCourseProfileInput}
                  placeholder="Enter custom link 2 URL"
                />
              </div>

              <button type="submit" className="student-course-submit-btn">
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}