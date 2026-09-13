import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  RiArrowDropDownLine,
  RiBookmarkLine,
  RiBookmarkFill,
} from "react-icons/ri";
import axios from "axios";
import "./StudentJobs.css";
import { Search, ArrowLeft } from "lucide-react";


function getPostedTime(dateString) {
  const now = new Date();
  const postedDate = new Date(dateString);
  const diffMs = now - postedDate;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Small pill-shaped badge rendering the hybrid-search match %.
// Colour ramps from red (weak match) through amber to green (strong match).
function MatchBadge({ percent, large = false }) {
  const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
  // HSL: 0 (red) -> 120 (green), saturated/light consistently.
  const hue = Math.round((p / 100) * 120);
  const style = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: large ? "6px 12px" : "4px 9px",
    borderRadius: "999px",
    background: `hsl(${hue}, 70%, 92%)`,
    color: `hsl(${hue}, 65%, 28%)`,
    fontWeight: 700,
    fontSize: large ? "14px" : "12px",
    border: `1px solid hsl(${hue}, 60%, 70%)`,
    whiteSpace: "nowrap",
    lineHeight: 1,
  };
  return (
    <span style={style} title={`Match score: ${p}%`}>
      <span style={{ opacity: 0.85 }}>★</span>
      {p}% match
    </span>
  );
}

function parseArrayField(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function StudentJobs() {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [search, setSearch] = useState("");
  const [salary, setSalary] = useState("");
  const [experience, setExperience] = useState("");
  const [jobType, setJobType] = useState("");
  const [education, setEducation] = useState("");
  const [skill, setSkill] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  const [applying, setApplying] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState([]);

  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  const [savedJobs, setSavedJobs] = useState(() => {
    const stored = localStorage.getItem("savedJobs");
    return stored ? JSON.parse(stored) : [];
  });

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
    "Jaipur",
  ];

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
  }, [savedJobs]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoadingJobs(true);

        // Primary source: hybrid recommendation engine (BGE + BM25 fusion).
        // Returns published jobs already sorted by relevance to *this*
        // student, each one annotated with a matchPercent field.
        // Falls back to the plain listing if the recommender is down.
        let source;
        try {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/recommender/jobs`,
            { withCredentials: true }
          );
          source = Array.isArray(res.data) ? res.data : [];
        } catch (recErr) {
          console.warn(
            "Recommender unavailable, falling back to /api/student/jobs",
            recErr?.message
          );
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/student/jobs`,
            { withCredentials: true }
          );
          source = Array.isArray(res.data) ? res.data : [];
        }

        const formattedJobs = source
          .filter((job) => job.status === "published")
          .map((job) => ({
            id: job._id,
            title: job.title || "",
            company: job.recruiterId?.company || "Company Name",
            logo:
              job.imageFile && job.imageFile.startsWith("http")
                ? job.imageFile
                : job.imageUrl || "https://via.placeholder.com/80",
            location: job.location || "",
            salary: job.salaryRange || "",
            type: job.jobType || "",
            education: parseArrayField(job.educationLevels),
            experience: job.experienceLevel || "",
            match:
              typeof job.matchPercent === "number"
                ? job.matchPercent
                : null,
            posted: getPostedTime(job.createdAt),
            skills: parseArrayField(job.skills),
            description: job.description || "",
            responsibilities: parseArrayField(job.responsibilities),
            qualifications: parseArrayField(job.qualifications),
            benefits: parseArrayField(job.benefits),
            status: job.status,
          }));

        setJobs(formattedJobs);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        alert(err?.response?.data?.message || "Failed to fetch jobs");
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  const fetchMyApplications = async () => {
    try {
      setLoadingApplications(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/student/my-applications`,
        { withCredentials: true }
      );

      const apps = Array.isArray(res.data) ? res.data : [];

      setApplications(apps);

      const jobIds = apps.map((app) => app?.job?._id).filter(Boolean);
      setAppliedJobs(jobIds);
    } catch (err) {
      console.error("Fetch applications error:", err);
      alert(err?.response?.data?.message || "Failed to fetch applications");
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  useEffect(() => {
    if (activeTab === "applications") {
      fetchMyApplications();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSaveJob = (jobId) => {
    setSavedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleCheckboxChange = (city) => {
    setSelectedLocations((prev) =>
      prev.includes(city)
        ? prev.filter((item) => item !== city)
        : [...prev, city]
    );
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const searchText = search.toLowerCase().trim();

      const searchMatch =
        !searchText ||
        job.title.toLowerCase().includes(searchText) ||
        job.company.toLowerCase().includes(searchText) ||
        job.location.toLowerCase().includes(searchText) ||
        job.skills.some((item) => item.toLowerCase().includes(searchText));

      const locationMatch =
        selectedLocations.length === 0
          ? true
          : selectedLocations.some(
              (city) =>
                city.toLowerCase().trim() === job.location.toLowerCase().trim()
            );

      const salaryMatch = salary ? job.salary === salary : true;
      const experienceMatch = experience ? job.experience === experience : true;
      const jobTypeMatch = jobType ? job.type === jobType : true;

      const educationMatch = education
        ? job.education.some(
            (item) =>
              item.toLowerCase().trim() === education.toLowerCase().trim()
          )
        : true;

      const skillMatch = skill
        ? job.skills.some(
            (item) => item.toLowerCase().trim() === skill.toLowerCase().trim()
          )
        : true;

      return (
        searchMatch &&
        locationMatch &&
        salaryMatch &&
        experienceMatch &&
        jobTypeMatch &&
        educationMatch &&
        skillMatch
      );
    });
  }, [
    jobs,
    search,
    selectedLocations,
    salary,
    experience,
    jobType,
    education,
    skill,
  ]);

  const savedJobsList = useMemo(() => {
    return jobs.filter((job) => savedJobs.includes(job.id));
  }, [jobs, savedJobs]);

  useEffect(() => {
    const currentList = activeTab === "saved" ? savedJobsList : filteredJobs;

    if (currentList.length > 0) {
      const stillExists = currentList.find((job) => job.id === selectedJob?.id);
      setSelectedJob(stillExists || currentList[0]);
    } else {
      setSelectedJob(null);
    }
  }, [filteredJobs, savedJobsList, activeTab, selectedJob?.id]);

  const displayJobs = activeTab === "saved" ? savedJobsList : filteredJobs;

  const handleApply = async (jobId) => {
    try {
      setApplying(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/apply/${jobId}`,
        {},
        { withCredentials: true }
      );

      alert(res.data.message || "Applied successfully");
      await fetchMyApplications();
      setActiveTab("applications");
    } catch (err) {
      console.error("Apply error:", err);
      alert(err.response?.data?.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const getStatusClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "shortlisted":
        return "status-badge shortlisted";
      case "rejected":
        return "status-badge rejected";
      case "reviewing":
        return "status-badge reviewing";
      case "selected":
        return "status-badge selected";
      default:
        return "status-badge applied";
    }
  };

  return (
    <div className="jobs-container">
      <div className="filter-box">
       <div className="search-box">
  <Search className="search-icon" size={20} />

  <input
    type="text"
    placeholder="Search job title, company, location, skill..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="search-input"
  />
</div>
        <div className="nav-tabs" style={{ display: "flex", gap: "5px" }}>
          <button
  className={activeTab === "jobs" ? "tab active" : "tab"}
  onClick={() => {
    setActiveTab("jobs");
    setShowMobileDetails(false);
  }}
>
  Browse Jobs
</button>

          <button
  className={activeTab === "saved" ? "tab active" : "tab"}
  onClick={() => {
    setActiveTab("saved");
    setShowMobileDetails(false);
  }}
>
  Saved Jobs
</button>

         <button
  className={activeTab === "applications" ? "tab active" : "tab"}
  onClick={() => {
    setActiveTab("applications");
    setShowMobileDetails(false);
  }}
>
  My Applications
</button>
        </div>
      </div>

      {activeTab !== "applications" && (
        <div className="filters">
          <div
            className="filter-select-wrap"
            ref={locationDropdownRef}
            style={{ position: "relative", overflow: "visible" }}
          >
            <div
              className="filter-chip filter-select"
              onClick={() => setShowDropdown((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedLocations.length > 0
                  ? selectedLocations.join(", ")
                  : "Location"}
              </span>
              <RiArrowDropDownLine className="select-icon" />
            </div>

            {showDropdown && (
              <div className="location-checkbox-dropdown">
                {locations.map((city) => (
                  <label key={city} className="location-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedLocations.includes(city)}
                      onChange={() => handleCheckboxChange(city)}
                    />
                    <span>{city}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="filter-select-wrap">
            <select
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="filter-chip filter-select"
            >
              <option value="">Salary</option>
              <option>2-4 LPA</option>
              <option>4-6 LPA</option>
              <option>6-8 LPA</option>
              <option>8-12 LPA</option>
              <option>12-16 LPA</option>
              <option>16-20 LPA</option>
              <option>20+ LPA</option>
            </select>
            <RiArrowDropDownLine className="select-icon" />
          </div>

          <div className="filter-select-wrap">
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="filter-chip filter-select"
            >
              <option value="">Experience</option>
              <option>Fresher</option>
              <option>0-1 Year</option>
              <option>1-3 Years</option>
              <option>3-6 Years</option>
              <option>6-9 Years</option>
              <option>9-12 Years</option>
              <option>12-15 Years</option>
              <option>15+ Years</option>
            </select>
            <RiArrowDropDownLine className="select-icon" />
          </div>

          <div className="filter-select-wrap">
            <select
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="filter-chip filter-select"
            >
              <option value="">Education</option>
              <option>High School</option>
              <option>Intermediate</option>
              <option>Diploma</option>
              <option>Bachelor&apos;s Degree</option>
              <option>B.Tech</option>
              <option>B.Sc</option>
              <option>B.Com</option>
              <option>MCA</option>
              <option>Master&apos;s Degree</option>
              <option>PhD</option>
            </select>
            <RiArrowDropDownLine className="select-icon" />
          </div>

          <div className="filter-select-wrap">
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="filter-chip filter-select"
            >
              <option value="">Skills</option>
              <option>React</option>
              <option>Node.js</option>
              <option>JavaScript</option>
              <option>Python</option>
              <option>Java</option>
              <option>MongoDB</option>
              <option>SQL</option>
              <option>HTML</option>
              <option>CSS</option>
              <option>Express</option>
            </select>
            <RiArrowDropDownLine className="select-icon" />
          </div>

          <div className="filter-select-wrap">
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="filter-chip filter-select"
            >
              <option value="">Job Type</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
            <RiArrowDropDownLine className="select-icon" />
          </div>
        </div>
      )}

      {(activeTab === "jobs" || activeTab === "saved") && (
        <div
          className="jobs-main"
          style={{ display: "flex", gap: "20px", width: "100%" }}
        >




          <div
  className={`job-list ${
    showMobileDetails ? "mobile-job-list-hidden" : ""
  }`}
  style={{
    flex: 1,
    height: "80vh",
    overflowY: "auto",
    maxWidth: "40vw",
  }}
>






            {loadingJobs ? (
              <div className="no-jobs">Loading jobs...</div>
            ) : displayJobs.length > 0 ? (
              displayJobs.map((job) => (
                <div
                  key={job.id}
                  className={`job-card ${
                    selectedJob?.id === job.id ? "active" : ""
                  }`}
                 onClick={() => {
  setSelectedJob(job);
  setShowMobileDetails(true);
}}
                >
                  <div className="job-header">
                    <img
                      src={job.logo}
                      alt={job.company}
                      className="job-logo"
                    />
                    <div>
                      <h3>{job.title}</h3>
                      <p className="company">{job.company}</p>
                    </div>

                    <div
                      style={{
                        marginLeft: "auto",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      {typeof job.match === "number" && (
                        <MatchBadge percent={job.match} />
                      )}
                      <div
                        className="save-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveJob(job.id);
                        }}
                      >
                        {savedJobs.includes(job.id) ? (
                          <RiBookmarkFill size={24} color="black" />
                        ) : (
                          <RiBookmarkLine size={24} color="#666" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="job-info">
                    <p>📍 {job.location}</p>
                    <p>💰 {job.salary}</p>
                    <p>🎯 {job.experience}</p>
                    <p>🕒 {job.type}</p>
                    <p>⏰ {job.posted}</p>
                  </div>

                  <div className="skills">
                    {job.skills.map((item, idx) => (
                      <span key={idx} className="skill-tag">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-jobs">
                {activeTab === "saved"
                  ? "No saved jobs yet 🔖"
                  : "No jobs found 😔"}
              </div>
            )}
          </div>





          <div
  className={`job-details ${
    showMobileDetails ? "mobile-job-details-visible" : ""
  }`}
  style={{
    flex: 2,
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    maxWidth: "60vw",
  }}
>



            {selectedJob ? (
              <>

              <button
  type="button"
  className="mobile-job-back-btn"
  onClick={() => setShowMobileDetails(false)}
>
  <ArrowLeft size={20} />
  <span>Back to Jobs</span>
</button>


                <div className="job-header">
                  <img
                    src={selectedJob.logo}
                    alt={selectedJob.company}
                    className="job-logo"
                  />
                  <div>
                    <h2>{selectedJob.title}</h2>
                    <p className="company">{selectedJob.company}</p>
                  </div>

                  <div
                    style={{
                      marginLeft: "auto",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {typeof selectedJob.match === "number" && (
                      <MatchBadge percent={selectedJob.match} large />
                    )}
                    <div
                      className="save-icon"
                      onClick={() => toggleSaveJob(selectedJob.id)}
                      style={{ cursor: "pointer" }}
                    >
                      {savedJobs.includes(selectedJob.id) ? (
                        <RiBookmarkFill size={28} color="black" />
                      ) : (
                        <RiBookmarkLine size={28} color="#666" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="job-info">
                  <p>📍 {selectedJob.location}</p>
                  <p>💰 {selectedJob.salary}</p>
                  <p>🎯 {selectedJob.experience}</p>
                  <p>🕒 {selectedJob.type}</p>
                  <p>⏰ {selectedJob.posted}</p>
                  <p>🎓 {selectedJob.education.join(", ")}</p>
                </div>

                <div className="skills">
                  {selectedJob.skills.map((item, idx) => (
                    <span key={idx} className="skill-tag">
                      {item}
                    </span>
                  ))}
                </div>

                <p className="description">{selectedJob.description}</p>

                {selectedJob.responsibilities.length > 0 && (
                  <>
                    <h3>Responsibilities</h3>
                    <ul>
                      {selectedJob.responsibilities.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                {selectedJob.qualifications.length > 0 && (
                  <>
                    <h3>Qualifications</h3>
                    <ul>
                      {selectedJob.qualifications.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                {selectedJob.benefits.length > 0 && (
                  <>
                    <h3>Benefits</h3>
                    <ul>
                      {selectedJob.benefits.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                <button
                  className="apply-btn"
                  onClick={() => handleApply(selectedJob.id)}
                  disabled={applying || appliedJobs.includes(selectedJob.id)}
                >
                  {appliedJobs.includes(selectedJob.id)
                    ? "Already Applied"
                    : applying
                    ? "Applying..."
                    : "Apply Now"}
                </button>
              </>
            ) : (
              <div className="no-jobs">Select a job to see details</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "applications" && (
        <div
          style={{
            padding: "24px",
            background: "white",
            borderRadius: "12px",
            marginTop: "20px",
          }}
        >
          <h2 style={{ marginBottom: "20px" }}>My Applications</h2>

          {loadingApplications ? (
            <p>Loading applications...</p>
          ) : applications.length === 0 ? (
            <p>No applications yet.</p>
          ) : (
            <div className="applications-list">
              {applications.map((app) => (
                <div key={app._id} className="application-card">
                  <div className="application-top">
                    <div>
                      <h3>{app.job?.title || "Untitled Job"}</h3>
                      <p className="company">
                        {app.job?.recruiter?.company || "Company Name"}
                      </p>
                    </div>

                    <span className={getStatusClass(app.status)}>
                      {app.status}
                    </span>
                  </div>

                  <div className="application-info">
                    <p>📍 {app.job?.location || "N/A"}</p>
                    <p>💰 {app.job?.salaryRange || "N/A"}</p>
                    <p>🕒 {app.job?.jobType || "N/A"}</p>
                    <p>🎯 {app.job?.experienceLevel || "N/A"}</p>
                    <p>
                      📅 Applied on{" "}
                      {app.appliedAt
                        ? new Date(app.appliedAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>

                  <div className="skills">
                    {(app.job?.skills || []).map((item, idx) => (
                      <span key={idx} className="skill-tag">
                        {item}
                      </span>
                    ))}
                  </div>

                  <p className="description" style={{ marginTop: "10px" }}>
                    {app.job?.description || ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentJobs;