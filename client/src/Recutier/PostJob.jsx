import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
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

export default function PostJob() {
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    jobType: "",
    experienceLevel: "",
    educationLevels: [],
    salaryRange: "",
    description: "",
    imageUrl: ""
  });

  const [responsibilitiesInput, setResponsibilitiesInput] = useState("");
  const [qualificationsInput, setQualificationsInput] = useState("");
  const [benefitsInput, setBenefitsInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");

  const [responsibilities, setResponsibilities] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [skills, setSkills] = useState([]);

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [educationOpen, setEducationOpen] = useState(false);

  const educationRef = useRef(null);

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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleEducation = (value) => {
    setFormData((prev) => ({
      ...prev,
      educationLevels: prev.educationLevels.includes(value)
        ? prev.educationLevels.filter((item) => item !== value)
        : [...prev.educationLevels, value]
    }));
  };

  const addListItem = (inputValue, setInput, list, setList) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const splitItems = trimmed
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const uniqueItems = [...new Set([...list, ...splitItems])];
    setList(uniqueItems);
    setInput("");
  };

  const removeListItem = (index, list, setList) => {
    setList(list.filter((_, i) => i !== index));
  };

  const buildFormPayload = (statusValue) => {
    const data = new FormData();

    data.append("title", formData.title);
    data.append("department", formData.department);
    data.append("location", formData.location);
    data.append("jobType", formData.jobType);
    data.append("experienceLevel", formData.experienceLevel);
    data.append("salaryRange", formData.salaryRange);
    data.append("description", formData.description);
    data.append("imageUrl", formData.imageUrl);
    data.append("status", statusValue);

    data.append("educationLevels", JSON.stringify(formData.educationLevels));
    data.append("responsibilities", JSON.stringify(responsibilities));
    data.append("qualifications", JSON.stringify(qualifications));
    data.append("benefits", JSON.stringify(benefits));
    data.append("skills", JSON.stringify(skills));

    if (imageFile) {
      data.append("jobImage", imageFile);
    }

    return data;
  };

  const submitJob = async (statusValue) => {
    try {
      setLoading(true);

      const payload = buildFormPayload(statusValue);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/recruiter/create-job`,
        payload,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      alert(res.data.message || `Job ${statusValue} successfully`);

      setFormData({
        title: "",
        department: "",
        location: "",
        jobType: "",
        experienceLevel: "",
        educationLevels: [],
        salaryRange: "",
        description: "",
        imageUrl: ""
      });

      setResponsibilities([]);
      setQualifications([]);
      setBenefits([]);
      setSkills([]);

      setResponsibilitiesInput("");
      setQualificationsInput("");
      setBenefitsInput("");
      setSkillsInput("");
      setImageFile(null);
      setEducationOpen(false);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Error posting job");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterAdd = (e, inputValue, setInput, list, setList) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addListItem(inputValue, setInput, list, setList);
    }
  };

  return (
    <div className="job-page">
      <div className="job-card">
        <div className="job-header">
          <div>
            <p className="job-subtitle">Recruiter Panel</p>
            <h1>Create a Professional Job Post</h1>
            <p className="job-text">
              Fill in the required details and publish an attractive job posting
              for candidates.
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
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Department *</label>
            <select
              name="department"
              value={formData.department}
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
              value={formData.location}
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
              value={formData.jobType}
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
              value={formData.experienceLevel}
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
                  {formData.educationLevels.length > 0
                    ? formData.educationLevels.join(", ")
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
                        checked={formData.educationLevels.includes(item)}
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
              value={formData.salaryRange}
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
              value={formData.imageUrl}
              onChange={handleChange}
            />
          </div>

          <div className="form-group full">
            <label>Or Upload Company Logo / Job Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </div>

          <div className="form-group full">
            <label>Job Description *</label>
            <textarea
              name="description"
              rows="5"
              placeholder="Write complete job description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group full">
            <label>Key Roles and Responsibilities</label>
            <div className="add-row">
              <textarea
                rows="3"
                placeholder="Type a responsibility and press Enter or Add. You can also paste multiple lines."
                value={responsibilitiesInput}
                onChange={(e) => setResponsibilitiesInput(e.target.value)}
                onKeyDown={(e) =>
                  handleEnterAdd(
                    e,
                    responsibilitiesInput,
                    setResponsibilitiesInput,
                    responsibilities,
                    setResponsibilities
                  )
                }
              />
              <button
                type="button"
                className="mini-btn"
                onClick={() =>
                  addListItem(
                    responsibilitiesInput,
                    setResponsibilitiesInput,
                    responsibilities,
                    setResponsibilities
                  )
                }
              >
                Add
              </button>
            </div>

            <div className="tag-list">
              {responsibilities.map((item, index) => (
                <div key={index} className="tag-item">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() =>
                      removeListItem(index, responsibilities, setResponsibilities)
                    }
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
                value={qualificationsInput}
                onChange={(e) => setQualificationsInput(e.target.value)}
                onKeyDown={(e) =>
                  handleEnterAdd(
                    e,
                    qualificationsInput,
                    setQualificationsInput,
                    qualifications,
                    setQualifications
                  )
                }
              />
              <button
                type="button"
                className="mini-btn"
                onClick={() =>
                  addListItem(
                    qualificationsInput,
                    setQualificationsInput,
                    qualifications,
                    setQualifications
                  )
                }
              >
                Add
              </button>
            </div>

            <div className="tag-list">
              {qualifications.map((item, index) => (
                <div key={index} className="tag-item">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() =>
                      removeListItem(index, qualifications, setQualifications)
                    }
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
                value={benefitsInput}
                onChange={(e) => setBenefitsInput(e.target.value)}
                onKeyDown={(e) =>
                  handleEnterAdd(
                    e,
                    benefitsInput,
                    setBenefitsInput,
                    benefits,
                    setBenefits
                  )
                }
              />
              <button
                type="button"
                className="mini-btn"
                onClick={() =>
                  addListItem(
                    benefitsInput,
                    setBenefitsInput,
                    benefits,
                    setBenefits
                  )
                }
              >
                Add
              </button>
            </div>

            <div className="tag-list">
              {benefits.map((item, index) => (
                <div key={index} className="tag-item">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeListItem(index, benefits, setBenefits)}
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
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                onKeyDown={(e) =>
                  handleEnterAdd(e, skillsInput, setSkillsInput, skills, setSkills)
                }
              />
              <button
                type="button"
                className="mini-btn"
                onClick={() =>
                  addListItem(skillsInput, setSkillsInput, skills, setSkills)
                }
              >
                Add
              </button>
            </div>

            <div className="tag-list">
              {skills.map((item, index) => (
                <div key={index} className="tag-item">
                  <span>{item}</span>
                  <button
                    type="button"
                    onClick={() => removeListItem(index, skills, setSkills)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="action-row">
          <button
            className="draft-btn"
            onClick={() => submitJob("draft")}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Draft"}
          </button>

          <button
            className="publish-btn"
            onClick={() => submitJob("published")}
            disabled={loading}
          >
            {loading ? "Publishing..." : "Publish Job"}
          </button>
        </div>
      </div>
    </div>
  );
}