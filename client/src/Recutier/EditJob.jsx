import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./PostJob.css";

const departments = [
  "Engineering",
  "Marketing",
  "Sales",
  "Product",
  "Customer Support",
  "Human Resources",
  "Finance",
  "Operations",
  "Design",
  "Business Development",
  "Medical",
  "Nursing",
  "Pharmacy",
  "Healthcare Administration",
  "Data Science",
  "Quality Assurance"
];

const locations = [
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Mumbai",
  "Pune",
  "Kolkata",
  "Delhi",
  "Noida",
  "Gurgaon",
  "Ahmedabad",
  "Visakhapatnam",
  "Coimbatore",
  "Kochi",
  "Lucknow",
  "Jaipur"
];

const jobTypes = ["Full-time", "Part-time", "Contract", "Internship"];

const experienceLevels = [
  "Fresher",
  "0-1 Year",
  "1-3 Years",
  "3-6 Years",
  "6-9 Years",
  "9-12 Years",
  "12-15 Years",
  "15+ Years"
];

const educationOptions = [
  "High School",
  "Intermediate",
  "Diploma",
  "Bachelor's Degree",
  "B.Tech",
  "B.Sc",
  "B.Com",
  "MCA",
  "Master's Degree",
  "PhD"
];

const salaryRanges = [
  "2-4 LPA",
  "4-6 LPA",
  "6-8 LPA",
  "8-12 LPA",
  "12-16 LPA",
  "16-20 LPA",
  "20+ LPA"
];

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [job, setJob] = useState({
    title: "",
    department: "",
    location: "",
    jobType: "",
    experienceLevel: "",
    educationLevels: [],
    salaryRange: "",
    description: "",
    responsibilities: [],
    qualifications: [],
    benefits: [],
    skills: [],
    requiredSkills: "",
    imageUrl: "",
    status: "draft",
  });

  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [qualificationInput, setQualificationInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [jobImage, setJobImage] = useState(null);

  const [educationOpen, setEducationOpen] = useState(false);
  const educationRef = useRef(null);

  useEffect(() => {
    fetchJob();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (educationRef.current && !educationRef.current.contains(event.target)) {
        setEducationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchJob = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/recruiter/job/${id}`,
        {
          withCredentials: true,
        }
      );

      setJob({
        title: res.data.title || "",
        department: res.data.department || "",
        location: res.data.location || "",
        jobType: res.data.jobType || "",
        experienceLevel: res.data.experienceLevel || "",
        educationLevels: res.data.educationLevels || [],
        salaryRange: res.data.salaryRange || "",
        description: res.data.description || "",
        responsibilities: res.data.responsibilities || [],
        qualifications: res.data.qualifications || [],
        benefits: res.data.benefits || [],
        skills: res.data.skills || [],
        requiredSkills: res.data.requiredSkills || "",
        imageUrl: res.data.imageUrl || "",
        status: res.data.status || "draft",
      });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to fetch job");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setJob((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleEducation = (value) => {
    setJob((prev) => ({
      ...prev,
      educationLevels: prev.educationLevels.includes(value)
        ? prev.educationLevels.filter((item) => item !== value)
        : [...prev.educationLevels, value],
    }));
  };

  const addListItem = (inputValue, setInput, field) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const splitItems = trimmed
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    setJob((prev) => ({
      ...prev,
      [field]: [...prev[field], ...splitItems],
    }));

    setInput("");
  };

  const removeListItem = (field, index) => {
    setJob((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleEnterAdd = (e, inputValue, setInput, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addListItem(inputValue, setInput, field);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("title", job.title);
      formData.append("department", job.department);
      formData.append("location", job.location);
      formData.append("jobType", job.jobType);
      formData.append("experienceLevel", job.experienceLevel);
      formData.append("salaryRange", job.salaryRange);
      formData.append("description", job.description);
      formData.append("requiredSkills", job.requiredSkills);
      formData.append("imageUrl", job.imageUrl);
      formData.append("status", job.status);

      formData.append("educationLevels", JSON.stringify(job.educationLevels));
      formData.append("responsibilities", JSON.stringify(job.responsibilities));
      formData.append("qualifications", JSON.stringify(job.qualifications));
      formData.append("benefits", JSON.stringify(job.benefits));
      formData.append("skills", JSON.stringify(job.skills));

      if (jobImage) {
        formData.append("jobImage", jobImage);
      }

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/recruiter/job/${id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(res.data.message || "Job updated successfully");
      navigate("/myjobs");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading job...</div>;

  return (
    <div className="job-page">
      <div className="job-card">
        <div className="job-header">
          <div>
            <p className="job-subtitle">Recruiter Panel</p>
            <h1>Edit Job Post</h1>
            <p className="job-text">
              Update the job details and save your changes.
            </p>
          </div>
        </div>

        <div className="job-form-grid">
          <div className="form-group full">
            <label>Job Title *</label>
            <input
              type="text"
              name="title"
              placeholder="Example: Frontend Developer"
              value={job.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Department *</label>
            <select
              name="department"
              value={job.department}
              onChange={handleChange}
            >
              <option value="">Select Department</option>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Location *</label>
            <select
              name="location"
              value={job.location}
              onChange={handleChange}
            >
              <option value="">Select Location</option>
              {locations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Job Type *</label>
            <select
              name="jobType"
              value={job.jobType}
              onChange={handleChange}
            >
              <option value="">Select Job Type</option>
              {jobTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Experience Level *</label>
            <select
              name="experienceLevel"
              value={job.experienceLevel}
              onChange={handleChange}
            >
              <option value="">Select Experience</option>
              {experienceLevels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group full" ref={educationRef}>
            <label>Education Level *</label>

            <div className="education-dropdown">
              <div
                className="education-dropdown-header"
                onClick={() => setEducationOpen(!educationOpen)}
              >
                <span className="education-placeholder">
                  {job.educationLevels.length > 0
                    ? job.educationLevels.join(", ")
                    : "Select Education Level"}
                </span>
                <span className="education-arrow">
                  {educationOpen ? "▲" : "▼"}
                </span>
              </div>

              {educationOpen && (
                <div className="education-dropdown-menu">
                  {educationOptions.map((item) => (
                    <label key={item} className="education-option">
                      <input
                        type="checkbox"
                        checked={job.educationLevels.includes(item)}
                        onChange={() => toggleEducation(item)}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Salary Range *</label>
            <select
              name="salaryRange"
              value={job.salaryRange}
              onChange={handleChange}
            >
              <option value="">Select Salary Range</option>
              {salaryRanges.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Company Logo / Job Image URL</label>
            <input
              type="text"
              name="imageUrl"
              placeholder="Paste image URL"
              value={job.imageUrl}
              onChange={handleChange}
            />
          </div>

          <div className="form-group full">
            <label>Or Upload Company Logo / Job Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setJobImage(e.target.files[0])}
            />
          </div>

          <div className="form-group full">
            <label>Job Description *</label>
            <textarea
              name="description"
              rows="5"
              placeholder="Write complete job description"
              value={job.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group full">
            <label>Key Roles and Responsibilities</label>
            <div className="add-row">
              <textarea
                rows="3"
                placeholder="Type a responsibility and press Enter or Add"
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                onKeyDown={(e) =>
                  handleEnterAdd(
                    e,
                    responsibilityInput,
                    setResponsibilityInput,
                    "responsibilities"
                  )
                }
              />
              <button
                type="button"
                className="mini-btn"
                onClick={() =>
                  addListItem(
                    responsibilityInput,
                    setResponsibilityInput,
                    "responsibilities"
                  )
                }
              >
                Add
              </button>
            </div>

            <div className="tag-list">
              {job.responsibilities.map((item, index) => (
                <div key={index} className="tag-item">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeListItem("responsibilities", index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group full">
            <label>Skills and Qualifications</label>
            <div className="add-row">
              <textarea
                rows="3"
                placeholder="Type qualifications and press Enter or Add"
                value={qualificationInput}
                onChange={(e) => setQualificationInput(e.target.value)}
                onKeyDown={(e) =>
                  handleEnterAdd(
                    e,
                    qualificationInput,
                    setQualificationInput,
                    "qualifications"
                  )
                }
              />
              <button
                type="button"
                className="mini-btn"
                onClick={() =>
                  addListItem(
                    qualificationInput,
                    setQualificationInput,
                    "qualifications"
                  )
                }
              >
                Add
              </button>
            </div>

            <div className="tag-list">
              {job.qualifications.map((item, index) => (
                <div key={index} className="tag-item">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeListItem("qualifications", index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group full">
            <label>Benefits</label>
            <div className="add-row">
              <textarea
                rows="3"
                placeholder="Type benefits and press Enter or Add"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) =>
                  handleEnterAdd(e, benefitInput, setBenefitInput, "benefits")
                }
              />
              <button
                type="button"
                className="mini-btn"
                onClick={() =>
                  addListItem(benefitInput, setBenefitInput, "benefits")
                }
              >
                Add
              </button>
            </div>

            <div className="tag-list">
              {job.benefits.map((item, index) => (
                <div key={index} className="tag-item">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeListItem("benefits", index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group full">
            <label>Required Skills (Optional)</label>
            <div className="add-row">
              <input
                type="text"
                placeholder="Example: React, Node.js, MongoDB"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) =>
                  handleEnterAdd(e, skillInput, setSkillInput, "skills")
                }
              />
              <button
                type="button"
                className="mini-btn"
                onClick={() => addListItem(skillInput, setSkillInput, "skills")}
              >
                Add
              </button>
            </div>

            <div className="tag-list">
              {job.skills.map((item, index) => (
                <div key={index} className="tag-item">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeListItem("skills", index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group full">
            <label>Status</label>
            <select name="status" value={job.status} onChange={handleChange}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="action-row">
          <button
            className="publish-btn"
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? "Updating..." : "Update Job"}
          </button>
        </div>
      </div>
    </div>
  );
}