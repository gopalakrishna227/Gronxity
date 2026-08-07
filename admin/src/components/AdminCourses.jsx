import { useEffect, useState } from "react";
import axios from "axios";
import "./AdminCourses.css";

const API_BASE = import.meta.env.VITE_API_URL;

const categoryOptions = [
  "Python",
  "AI",
  "ML",
  "AI and ML",
  "Java",
  "JavaScript",
  "React",
  "Node.js",
  "MongoDB",
];

export default function AdminCourses() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Python",
    imageUrl: "",
    videoUrl: "",
  });

  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editId, setEditId] = useState(null);

  const fetchCourses = async () => {
    try {
      setFetching(true);
      const res = await axios.get(`${API_BASE}/api/admin/courses`, {
        withCredentials: true,
      });
      setCourses(res.data.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch courses");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "imageUrl") {
      setForm((prev) => ({
        ...prev,
        imageUrl: value,
        videoUrl: value ? "" : prev.videoUrl,
      }));
      return;
    }

    if (name === "videoUrl") {
      setForm((prev) => ({
        ...prev,
        videoUrl: value,
        imageUrl: value ? "" : prev.imageUrl,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      category: "Python",
      imageUrl: "",
      videoUrl: "",
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (form.imageUrl && form.videoUrl) {
        setError("Only one media allowed: image URL or video URL");
        setLoading(false);
        return;
      }

      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        imageUrl: form.imageUrl,
        videoUrl: form.videoUrl,
      };

      if (editId) {
        const res = await axios.put(
          `${API_BASE}/api/admin/courses/${editId}`,
          payload,
          { withCredentials: true }
        );
        setMessage(res.data.message || "Course updated successfully");
      } else {
        const res = await axios.post(`${API_BASE}/api/admin/courses`, payload, {
          withCredentials: true,
        });
        setMessage(res.data.message || "Course created successfully");
      }

      resetForm();
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditId(course._id);
    setForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "Python",
      imageUrl: course.imageUrl || "",
      videoUrl: course.videoUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this course?");
    if (!ok) return;

    try {
      setMessage("");
      setError("");
      const res = await axios.delete(`${API_BASE}/api/admin/courses/${id}`, {
        withCredentials: true,
      });
      setMessage(res.data.message || "Course deleted successfully");
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete course");
    }
  };

  return (
    <div className="admin-courses-page">
      <div className="admin-courses-header">
        <h1>Admin Courses</h1>
        <p>Create and manage course content for students</p>
      </div>

      <div className="admin-courses-grid">
        <div className="admin-course-form-card">
          <h2>{editId ? "Edit Course" : "Create Course"}</h2>

          {message && <p className="admin-success">{message}</p>}
          {error && <p className="admin-error">{error}</p>}

          <form onSubmit={handleSubmit} className="admin-course-form">
            <div className="admin-form-group">
              <label>Course Title</label>
              <input
                type="text"
                name="title"
                placeholder="Enter course title"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-group">
              <label>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Enter course description"
                rows="4"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-group">
              <label>Image URL</label>
              <input
                type="text"
                name="imageUrl"
                placeholder="Enter image URL"
                value={form.imageUrl}
                onChange={handleChange}
              />
            </div>

            <div className="admin-form-group">
              <label>Video URL</label>
              <input
                type="text"
                name="videoUrl"
                placeholder="Enter video URL"
                value={form.videoUrl}
                onChange={handleChange}
              />
            </div>

            <p className="admin-note">
              Add only one media: image URL or video URL
            </p>

            <div className="admin-course-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : editId ? "Update Course" : "Create Course"}
              </button>

              {editId && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-course-list-card">
          <h2>All Courses</h2>

          {fetching ? (
            <p className="admin-empty">Loading courses...</p>
          ) : courses.length === 0 ? (
            <p className="admin-empty">No courses created yet</p>
          ) : (
            <div className="admin-course-list">
              {courses.map((course) => (
                <div key={course._id} className="admin-course-item">
                  <div className="admin-course-preview">
                    {course.mediaType === "image" && course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.title} />
                    ) : course.mediaType === "video" && course.videoUrl ? (
                      <video src={course.videoUrl} controls />
                    ) : (
                      <div className="admin-no-media">No Media</div>
                    )}
                  </div>

                  <div className="admin-course-content">
                    <h3>{course.title}</h3>
                    <span className="admin-course-category">{course.category}</span>
                    <p>{course.description || "No description"}</p>

                    <div className="admin-course-buttons">
                      <button onClick={() => handleEdit(course)}>Edit</button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(course._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}