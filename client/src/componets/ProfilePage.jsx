import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Share2,
  Briefcase,
  GraduationCap,
  Target,
  Code,
  Sparkles,
  Award,
  MapPin,
  Play,
  Grid3x3,
  Film,
  Trophy,
  CheckCircle,
  Star,
  Pen,
  Copy,
  MessageCircle,
  X,
  Plus,
  Download,
  FileText,
  FolderKanban,
  MoreVertical,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ATSResumeDownload from "./ATSResumeDownload";
import "./ProfilePage.css";

const API_BASE = import.meta.env.VITE_API_URL;

const openToOptions = [
  "Open to Work",
  "Content Creator",
  "Career Support",
  "Freelance Projects",
  "Internships",
  "Networking",
];

const profileTypeOptions = [
  "Student",
  "Early Career",
  "Professional",
  "Freelancer",
  "Intern",
];

const topSkillOptions = [
  "Full Stack Developer",
  "React Developer",
  "Frontend Developer",
  "Backend Developer",
  "Node.js Developer",
  "MERN Stack Developer",
  "AI/ML Engineer",
  "Data Analyst",
  "Python Developer",
  "Java Developer",
  "Mobile App Developer",
  "UI/UX Designer",
  "QA Tester",
  "Automation Tester",
  "DevOps Engineer",
  "Cloud Engineer",
  "Cybersecurity Analyst",
  "Business Analyst",
  "Digital Marketing",
  "HR Operations",
  "Finance Analyst",
  "Medical Coding",
  "Clinical Data Analyst",
  "Pharmacovigilance",
  "Healthcare Administration",
  "Nursing Specialist",
  "Lab Technician",
  "Content Writer",
  "Sales Executive",
  "Customer Support",
];

const bestAreaOptions = [
  "Product Thinking",
  "Problem Solving",
  "UI Design",
  "System Design",
  "API Development",
  "Automation",
  "Testing",
  "AI Projects",
  "Communication",
  "Leadership",
  "Research",
  "Data Interpretation",
  "Clinical Workflows",
  "Patient Support",
  "Operations",
  "Sales Conversion",
];

const educationOrder = [
  "Masters / PG",
  "Degree",
  "Intermediate / Diploma",
  "Schooling",
];

const noticePeriodOptions = ["Immediate", "30 Days Below", "2 Months"];

const preferredLocationOptions = [
  "Hyderabad",
  "Bangalore",
  "Chennai",
  "Mumbai",
  "Pune",
  "Delhi",
  "Noida",
  "Gurgaon",
  "Kolkata",
];

const emptyProfile = {
  _id: "",
  name: "",
  headline: "",
  location: "",
  openTo: "Open to Work",
  profileType: "Student",
  mainSkills: [],
  noticePeriod: "Immediate",
  yearsOfExperience: "",
  preferredLocations: [],
  connections: 0,
  followers: 0,
  recruiterViews: 0,
  about: "",
  careerGoal: "",
  avatar: "",
  coverImage: "",
  introVideoUrl: "",
  introVideoDuration: "",
  introVideoViews: 0,
  skills: [],
  topSkill: "",
  bestArea: "",
};

function SectionCard({ icon: Icon, title, right, children, className = "" }) {
  return (
    <div className={`section-card ${className}`}>
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="section-icon-box">
            <Icon size={19} />
          </div>
          <h3 className="section-title">{title}</h3>
        </div>
        {right}
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

function Dropdown({ open, children, className = "" }) {
  if (!open) return null;
  return <div className={`custom-dropdown ${className}`}>{children}</div>;
}

function EditModal({ title, children, onClose, onSave, saving = false }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => onClose(), 220);
  };

  return (
    <div
      className={`modal-overlay ${closing ? "closing" : "opening"}`}
      onClick={handleClose}
    >
      <div
        className={`edit-modal ${closing ? "closing" : "opening"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="icon-btn modal-close-btn"
            onClick={handleClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="edit-modal-body">{children}</div>

        <div className="edit-modal-footer">
          <button
            type="button"
            className="secondary-btn modal-action-btn"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-btn modal-action-btn"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizeEducationType(value = "") {
  const v = value.toLowerCase().trim();

  if (
    v.includes("master") ||
    v.includes("pg") ||
    v.includes("post graduate") ||
    v.includes("mba") ||
    v.includes("mtech") ||
    v.includes("mca") ||
    v.includes("msc") ||
    v.includes("ma")
  ) {
    return "Masters / PG";
  }

  if (
    v.includes("degree") ||
    v.includes("btech") ||
    v.includes("b.e") ||
    v.includes("be") ||
    v.includes("bsc") ||
    v.includes("bcom") ||
    v.includes("ba") ||
    v.includes("bca")
  ) {
    return "Degree";
  }

  if (
    v.includes("inter") ||
    v.includes("intermediate") ||
    v.includes("diploma") ||
    v.includes("polytechnic") ||
    v.includes("12") ||
    v.includes("puc")
  ) {
    return "Intermediate / Diploma";
  }

  if (
    v.includes("school") ||
    v.includes("ssc") ||
    v.includes("10th") ||
    v.includes("10")
  ) {
    return "Schooling";
  }

  return value || "Degree";
}

function getNextEducationLabel(list = []) {
  const used = list.map((item) => normalizeEducationType(item.degree || ""));
  for (const label of educationOrder) {
    if (!used.includes(label)) return label;
  }
  return "Degree";
}

function sortEducation(list = []) {
  const rankMap = {
    "Masters / PG": 0,
    Degree: 1,
    "Intermediate / Diploma": 2,
    Schooling: 3,
  };

  return [...list].sort((a, b) => {
    const aType = normalizeEducationType(a.degree || "");
    const bType = normalizeEducationType(b.degree || "");
    return (rankMap[aType] ?? 99) - (rankMap[bType] ?? 99);
  });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("reels");
  const [shareOpen, setShareOpen] = useState(false);

  const [profile, setProfile] = useState(emptyProfile);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [reelsContent, setReelsContent] = useState([]);
  const [postsContent, setPostsContent] = useState([]);
  const [achievements, setAchievements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const [editSection, setEditSection] = useState("");

  const [profileDraft, setProfileDraft] = useState(emptyProfile);
  const [aboutDraft, setAboutDraft] = useState("");
  const [careerGoalDraft, setCareerGoalDraft] = useState("");
  const [skillsDraft, setSkillsDraft] = useState("");
  const [experienceDraft, setExperienceDraft] = useState([]);
  const [educationDraft, setEducationDraft] = useState([]);
  const [highlightsDraft, setHighlightsDraft] = useState({
    topSkill: "",
    bestArea: "",
  });
  const [mainSkillsInput, setMainSkillsInput] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectsDraft, setProjectsDraft] = useState([]);
  const [openContentMenuId, setOpenContentMenuId] = useState(null);

  const [selectedPost, setSelectedPost] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [mediaUploading, setMediaUploading] = useState({
  avatar: false,
  coverImage: false,
  introVideo: false,
});

  const actionsRef = useRef(null);

  const loggedInUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);


  const { handleDownloadResume } = ATSResumeDownload({
  profile,
  experience,
  education,
  projects,
});


const handleProfileMediaUpload = async (file, mediaType) => {
  try {
    if (!file) return;

    setMediaUploading((prev) => ({
      ...prev,
      [mediaType]: true,
    }));

    const formData = new FormData();
    formData.append("media", file);
    formData.append("mediaType", mediaType);

    const res = await axios.put(
      `${API_BASE}/api/student/profile/upload-media`,
      formData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const saved = res.data?.profile || {};
    hydrateStateFromResponse(saved);

    alert(res.data?.message || "Upload successful");
  } catch (err) {
    console.error("Profile media upload error:", err);
    alert(err.response?.data?.message || "Upload failed");
  } finally {
    setMediaUploading((prev) => ({
      ...prev,
      [mediaType]: false,
    }));
  }
};
















  const openPostViewer = async (postId) => {
    try {
      setViewerLoading(true);
      setViewerOpen(true);

      const res = await axios.get(`${API_BASE}/api/student/posts/${postId}`, {
        withCredentials: true,
      });

      setSelectedPost(res.data?.post || null);
    } catch (err) {
      console.error("Open post viewer error:", err);
      alert(err.response?.data?.message || "Failed to load post");
      setViewerOpen(false);
      setSelectedPost(null);
    } finally {
      setViewerLoading(false);
    }
  };

  const closePostViewer = () => {
    setViewerOpen(false);
    setSelectedPost(null);
    setCommentInput("");
  };

  const handleViewerLike = async () => {
    if (!selectedPost?._id) return;

    try {
      const res = await axios.put(
        `${API_BASE}/api/student/posts/${selectedPost._id}/like`,
        {},
        { withCredentials: true },
      );

      const isLiked = res.data?.isLiked;
      const likesCount = res.data?.likesCount ?? 0;
      const me = loggedInUser?._id;

      setSelectedPost((prev) => {
        if (!prev) return prev;

        let updatedLikes = [...(prev.likes || [])];

        if (isLiked) {
          if (me && !updatedLikes.includes(me)) updatedLikes.push(me);
        } else {
          updatedLikes = updatedLikes.filter((id) => String(id) !== String(me));
        }

        return {
          ...prev,
          likes: updatedLikes,
          likesCount,
        };
      });
    } catch (err) {
      console.error("Like viewer post error:", err);
      alert(err.response?.data?.message || "Failed to like post");
    }
  };

  const handleViewerAddComment = async () => {
    if (!selectedPost?._id || !commentInput.trim()) return;

    try {
      const res = await axios.post(
        `${API_BASE}/api/student/posts/${selectedPost._id}/comments`,
        { text: commentInput },
        { withCredentials: true },
      );

      setSelectedPost((prev) => ({
        ...prev,
        comments: res.data?.comments || prev.comments || [],
      }));

      setCommentInput("");
    } catch (err) {
      console.error("Add comment error:", err);
      alert(err.response?.data?.message || "Failed to add comment");
    }
  };

  useEffect(() => {
    const trackRecruiterView = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || user.role !== "recruiter") return;
        if (!id) return;

        await axios.post(
          `${API_BASE}/api/recruiter/view-student-profile/${id}`,
          {},
          { withCredentials: true },
        );

        fetchProfile();
      } catch (err) {
        console.error("Recruiter profile view tracking error:", err);
      }
    };

    trackRecruiterView();
  }, [id]);

  const isOwnProfile = !id || id === loggedInUser?._id;

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!actionsRef.current?.contains(e.target)) {
        setShareOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizeProfile = (data = {}) => ({
    _id: data._id || "",
    name: data.name || "",
    headline: data.headline || "",
    location: data.location || "",
    openTo: data.openTo || "Open to Work",
    profileType: data.profileType || "Student",
    mainSkills: Array.isArray(data.mainSkills) ? data.mainSkills : [],
    noticePeriod: data.noticePeriod || "Immediate",
    yearsOfExperience: data.yearsOfExperience || "",
    preferredLocations: Array.isArray(data.preferredLocations)
      ? data.preferredLocations
      : [],
    connections: Number(data.connections) || 0,
    followers: Number(data.followers) || 0,
    recruiterViews: Number(data.recruiterViews) || 0,

    about: data.about || "",
    careerGoal: data.careerGoal || "",
    avatar: data.avatar || "",
    coverImage: data.coverImage || "",
    introVideoUrl: data.introVideoUrl || "",
    introVideoDuration: data.introVideoDuration || "",
    introVideoViews: Number(data.introVideoViews) || 0,
    skills: Array.isArray(data.skills) ? data.skills : [],
    topSkill: data.topSkill || "",
    bestArea: data.bestArea || "",
  });

  const hydrateStateFromResponse = (data = {}) => {
    const safeProfile = normalizeProfile(data);

    setProfile(safeProfile);
    setExperience(Array.isArray(data.experience) ? data.experience : []);
    setEducation(
      sortEducation(Array.isArray(data.education) ? data.education : []),
    );
    setReelsContent(Array.isArray(data.reelsContent) ? data.reelsContent : []);
    setPostsContent(Array.isArray(data.postsContent) ? data.postsContent : []);
    setAchievements(Array.isArray(data.achievements) ? data.achievements : []);
    setProjects(Array.isArray(data.projects) ? data.projects : []);

    setProfileDraft(safeProfile);
    setMainSkillsInput((safeProfile.mainSkills || []).join(", "));
    setAboutDraft(safeProfile.about);
    setCareerGoalDraft(safeProfile.careerGoal);
    setSkillsDraft(safeProfile.skills.join(", "));
    setExperienceDraft(
      Array.isArray(data.experience)
        ? JSON.parse(JSON.stringify(data.experience))
        : [],
    );
    setEducationDraft(
      Array.isArray(data.education)
        ? sortEducation(JSON.parse(JSON.stringify(data.education)))
        : [],
    );

    setProjectsDraft(
      Array.isArray(data.projects)
        ? JSON.parse(JSON.stringify(data.projects))
        : [],
    );

    setHighlightsDraft({
      topSkill: safeProfile.topSkill,
      bestArea: safeProfile.bestArea,
    });
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const url = isOwnProfile
        ? `${API_BASE}/api/student/profile/me`
        : `${API_BASE}/api/student/profile/${id}`;

      const res = await axios.get(url, { withCredentials: true });
      const data = res.data?.profile || {};
      hydrateStateFromResponse(data);
    } catch (err) {
      console.error("Fetch profile error:", err);
      alert(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const displayContent = useMemo(() => {
    if (activeTab === "achievements") return achievements;
    if (activeTab === "posts") return postsContent;
    return reelsContent;
  }, [activeTab, achievements, postsContent, reelsContent]);

  const completionScore = useMemo(() => {
    let score = 0;

    if (profile.name) score += 8;
    if (profile.headline) score += 8;
    if (profile.location) score += 6;
    if (profile.avatar) score += 8;
    if (profile.coverImage) score += 6;
    if (profile.about) score += 10;
    if (profile.careerGoal) score += 8;
    if ((profile.skills || []).length > 0) score += 10;
    if ((profile.mainSkills || []).length > 0) score += 8;
    if (experience.length > 0) score += 10;
    if (education.length > 0) score += 10;
    if (profile.topSkill) score += 4;
    if (profile.bestArea) score += 4;

    return Math.min(score, 100);
  }, [profile, experience, education]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied");
      setShareOpen(false);
    } catch {
      alert("Unable to copy link");
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Check out this profile: ${window.location.href}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShareOpen(false);
  };

  const openEditor = (section) => {
    if (!isOwnProfile) return;

    setEditSection(section);
    setProfileDraft({ ...profile });
    setMainSkillsInput((profile.mainSkills || []).join(", "));
    setAboutDraft(profile.about);
    setCareerGoalDraft(profile.careerGoal);
    setSkillsDraft(profile.skills.join(", "));
    setExperienceDraft(JSON.parse(JSON.stringify(experience)));
    setEducationDraft(sortEducation(JSON.parse(JSON.stringify(education))));
    setProjectsDraft(JSON.parse(JSON.stringify(projects)));
    setHighlightsDraft({
      topSkill: profile.topSkill,
      bestArea: profile.bestArea,
    });
  };

  const saveEditor = async () => {
    try {
      setSaving(true);

      let updatedProfile = { ...profile };
      let updatedExperience = [...experience];
      let updatedEducation = [...education];
      let updatedProjects = [...projects];

      if (editSection === "profile" || editSection === "introVideo") {
        updatedProfile = {
          ...profileDraft,
          mainSkills: mainSkillsInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 6),
        };
      }

      if (editSection === "about") {
        updatedProfile = { ...updatedProfile, about: aboutDraft };
      }

      if (editSection === "careerGoal") {
        updatedProfile = { ...updatedProfile, careerGoal: careerGoalDraft };
      }

      if (editSection === "skills") {
        const updatedSkills = skillsDraft
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        updatedProfile = { ...updatedProfile, skills: updatedSkills };
      }

      if (editSection === "experience") {
        updatedExperience = experienceDraft
          .map((item) => ({
            ...item,
            id: item.id || String(Date.now() + Math.random()),
          }))
          .filter((item) => item.role?.trim() || item.company?.trim());
      }

      if (editSection === "availability") {
        updatedProfile = {
          ...updatedProfile,
          noticePeriod: profileDraft.noticePeriod || "Immediate",
          yearsOfExperience: profileDraft.yearsOfExperience || "",
          preferredLocations: Array.isArray(profileDraft.preferredLocations)
            ? profileDraft.preferredLocations.slice(0, 3)
            : [],
        };
      }

      if (editSection === "education") {
        updatedEducation = sortEducation(
          educationDraft
            .map((item) => ({
              ...item,
              id: item.id || String(Date.now() + Math.random()),
            }))
            .filter((item) => item.school?.trim() || item.degree?.trim()),
        );
      }

      if (editSection === "projects") {
        updatedProjects = projectsDraft
          .map((item) => ({
            ...item,
            id: item.id || String(Date.now() + Math.random()),
          }))
          .filter(
            (item) =>
              item.title?.trim() ||
              item.techStack?.trim() ||
              item.description?.trim(),
          );
      }

      if (editSection === "highlights") {
        updatedProfile = {
          ...updatedProfile,
          topSkill: highlightsDraft.topSkill,
          bestArea: highlightsDraft.bestArea,
        };
      }

      const {
  avatar,
  coverImage,
  introVideoUrl,
  introVideoDuration,
  introVideoViews,
  ...textOnlyProfile
} = updatedProfile;

const payload = {
  ...textOnlyProfile,
  experience: updatedExperience,
  education: updatedEducation,
  projects: updatedProjects,
  reelsContent,
  postsContent,
  achievements,
};

      const res = await axios.put(
        `${API_BASE}/api/student/profile/me`,
        payload,
        {
          withCredentials: true,
        },
      );

      const saved = res.data?.profile || {};
      hydrateStateFromResponse(saved);

      setEditSection("");
      alert("Profile updated successfully");
    } catch (err) {
      console.error("Save profile error:", err);
      alert(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const saveContentToDB = async (
    updatedReels,
    updatedPosts,
    updatedAchievements,
  ) => {
    try {
      setSaving(true);

      const payload = {
        ...profile,
        experience,
        education,
        projects,
        reelsContent: updatedReels,
        postsContent: updatedPosts,
        achievements: updatedAchievements,
      };

      const res = await axios.put(
        `${API_BASE}/api/student/profile/me`,
        payload,
        { withCredentials: true },
      );

      const saved = res.data?.profile || {};
      hydrateStateFromResponse(saved);
      return true;
    } catch (err) {
      console.error("Save content error:", err);
      alert(err.response?.data?.message || "Failed to update content");
      return false;
    } finally {
      setSaving(false);
      setOpenContentMenuId(null);
    }
  };

  const handleAddToAchievement = async (content) => {
    if (!isOwnProfile) return;

    let updatedReels = [...reelsContent];
    let updatedPosts = [...postsContent];
    let updatedAchievements = [...achievements];

    const achievementItem = {
      id: content.id || String(Date.now()),
      title: content.title || "",
      thumbnail:
        content.thumbnail || "https://via.placeholder.com/400?text=Achievement",
      type: "achievement",
      date: new Date().toLocaleDateString(),
    };

    if (content.type === "reel") {
      updatedReels = updatedReels.filter((item) => item.id !== content.id);
    } else if (content.type === "post") {
      updatedPosts = updatedPosts.filter((item) => item.id !== content.id);
    } else {
      return;
    }

    updatedAchievements = [achievementItem, ...updatedAchievements];

    const ok = await saveContentToDB(
      updatedReels,
      updatedPosts,
      updatedAchievements,
    );

    if (ok) {
      setActiveTab("achievements");
      alert("Added to achievements");
    }
  };

 /* const handleDeletePost = async (postId) => {
  const confirmDelete = window.confirm("Delete this post?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/student/posts/${postId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to delete post");
      return;
    }

    alert("Deleted successfully");

    // ✅ update UI instantly
    setPostsContent((prev) =>
      prev.filter((item) => String(item.id) !== String(postId))
    );

    setReelsContent((prev) =>
      prev.filter((item) => String(item.id) !== String(postId))
    );

    setOpenContentMenuId(null);
  } catch (error) {
    console.error("Delete error:", error);
    alert("Something went wrong while deleting");
  }
};*/





const handleDeleteContent = async (content) => {
  const confirmDelete = window.confirm(`Delete this ${content.type}?`);
  if (!confirmDelete) return;

  try {
    const apiUrl =
      content.type === "reel"
        ? `${import.meta.env.VITE_API_URL}/api/student/reels/${content.id}`
        : `${import.meta.env.VITE_API_URL}/api/student/posts/${content.id}`;

    const res = await fetch(apiUrl, {
      method: "DELETE",
      credentials: "include",
    });

    const text = await res.text();
    console.log("delete status =", res.status);
    console.log("delete raw response =", text);

    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error("Delete response is not JSON:", parseError);
      alert(`Backend returned invalid response while deleting ${content.type}`);
      return;
    }

    if (!res.ok) {
      alert(data.message || `Failed to delete ${content.type}`);
      return;
    }

    alert(`${content.type} deleted successfully`);

    if (content.type === "reel") {
      setReelsContent((prev) =>
        prev.filter((item) => String(item.id) !== String(content.id))
      );
    } else {
      setPostsContent((prev) =>
        prev.filter((item) => String(item.id) !== String(content.id))
      );
    }

    setOpenContentMenuId(null);
  } catch (error) {
    console.error("Delete error:", error);
    alert("Something went wrong while deleting");
  }
};



  const handleSendRequest = async () => {
    if (!profile?._id || isOwnProfile) return;

    try {
      setSendingRequest(true);

      const res = await axios.post(
        `${API_BASE}/api/student/request/${profile._id}`,
        {},
        { withCredentials: true },
      );

      alert(res.data?.message || "Friend request sent successfully");
    } catch (err) {
      console.error("Send request error:", err);
      alert(err.response?.data?.message || "Failed to send request");
    } finally {
      setSendingRequest(false);
    }
  };


  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-wrapper">
          <div className="section-card">
            <div className="section-body">
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        <div className="profile-hero modern-profile-hero">
          <div className="profile-cover modern-profile-cover">
            <img
              src={
                profile.coverImage ||
                "https://via.placeholder.com/1400x320?text=Cover+Image"
              }
              alt="Cover"
            />
            <div className="profile-cover-overlay" />

            <div className="hero-actions" ref={actionsRef}>
              {isOwnProfile && (
                



<button
  type="button"
  className="hero-btn hero-btn-download"
  onClick={handleDownloadResume}
>
  <Download size={16} />
  <span>Resume</span>
</button>









              )}

              <div className="dropdown-parent">
                <button
                  type="button"
                  className="hero-btn"
                  onClick={() => {
                    setShareOpen((prev) => !prev);
                  }}
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>

                <Dropdown open={shareOpen}>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={handleCopyLink}
                  >
                    <Copy size={16} />
                    <span>Copy Link</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={handleWhatsAppShare}
                  >
                    <MessageCircle size={16} />
                    <span>WhatsApp Share</span>
                  </button>
                </Dropdown>
              </div>
            </div>
          </div>

          <div className="profile-hero-content modern-hero-content">
            <div className="profile-header-card">
              <div className="profile-avatar-wrap large-avatar-wrap">
                <img
                  className="profile-avatar large-profile-avatar"
                  src={
                    profile.avatar ||
                    "https://via.placeholder.com/160?text=Profile"
                  }
                  alt={profile.name || "Profile"}
                />
                <div className="profile-status-dot" />
              </div>

              <div className="profile-main-info modern-profile-main-info">
                <div className="profile-main-row">
                  <div className="profile-identity-block">
                    <div className="profile-name-row modern-profile-name-row">
                      <h1 className="profile-name">
                        {profile.name || "Your Name"}
                      </h1>
                      <span className="verified-badge">
                        <CheckCircle size={14} />
                        Verified
                      </span>
                    </div>

                    <p className="profile-headline modern-headline">
                      {profile.headline || "Add your headline"}
                    </p>

                    <div className="profile-meta modern-profile-meta">
                      <div className="profile-meta-item">
                        <MapPin size={15} />
                        <span>{profile.location || "Add location"}</span>
                      </div>

                      <div className="profile-meta-item modern-open-work">
                        <Briefcase size={15} />
                        <span>{profile.openTo}</span>
                      </div>

                      <div className="profile-meta-item profile-type-chip">
                        <GraduationCap size={15} />
                        <span>{profile.profileType}</span>
                      </div>
                    </div>

                    <div className="domain-tags modern-domain-tags">
                      {(profile.mainSkills || [])
                        .slice(0, 6)
                        .map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className={`domain-tag ${
                              index % 4 === 0
                                ? "domain-blue"
                                : index % 4 === 1
                                  ? "domain-cyan"
                                  : index % 4 === 2
                                    ? "domain-green"
                                    : "domain-purple"
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="profile-action-buttons modern-top-actions">
                    {isOwnProfile ? (
                      <button
                        type="button"
                        className="primary-btn edit-profile-main-btn"
                        onClick={() => openEditor("profile")}
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="primary-btn edit-profile-main-btn"
                        onClick={handleSendRequest}
                        disabled={sendingRequest}
                      >
                        {sendingRequest ? "Sending..." : "Connect"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="profile-stats-inline modern-profile-stats-inline">
                  <div
                    className="profile-stat-inline"
                    onClick={() => navigate("/student/connections")}
                    style={{ cursor: "pointer" }}
                  >
                    <strong>{profile.connections}</strong>
                    <span>Connections</span>
                  </div>

                  <div className="profile-stat-inline"  onClick={() => navigate("/student/follow")}
                    style={{ cursor: "pointer" }}>
                    <strong>{profile.followers}</strong>
                    <span>Followers</span>
                  </div>

                  <div className="profile-stat-inline">
                    <strong>{completionScore}%</strong>
                    <span>Profile Strength</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="metric-grid metric-grid-three modern-metric-grid">
              <div className="metric-card metric-blue">
                <p>Profile Score</p>
                <h3>{completionScore}%</h3>
              </div>
              <div className="metric-card metric-purple">
                <p>Recruiter Views</p>
                <h3>{profile.recruiterViews || 0}</h3>
              </div>
              <div className="metric-card metric-green">
                <p>Achievements</p>
                <h3>{achievements.length}</h3>
              </div>
            </div>
          </div>
        </div>












        <div className="profile-layout modern-profile-layout">
          <div className="left-column">
            <SectionCard
              icon={Sparkles}
              title="Introduction Reel"
              right={
                isOwnProfile && (
                  <button
                    type="button"
                    className="icon-btn edit-icon-btn"
                    onClick={() => openEditor("introVideo")}
                  >
                    <Pen size={16} />
                  </button>
                )
              }
            >
              <div className="intro-video-card modern-intro-card">
                {profile.introVideoUrl ? (
                  <video
                    className="intro-video-player"
                    src={profile.introVideoUrl}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="intro-video-empty">No video added</div>
                )}
              </div>
            </SectionCard>






















            <SectionCard
              icon={GraduationCap}
              title="About Me"
              right={
                isOwnProfile && (
                  <button
                    type="button"
                    className="icon-btn edit-icon-btn"
                    onClick={() => openEditor("about")}
                  >
                    <Pen size={16} />
                  </button>
                )
              }
            >
              <p className="about-text">
                {profile.about || "Add your about section"}
              </p>
            </SectionCard>

            <div className="section-card">
              <div className="content-tabs">
                <button
                  type="button"
                  className={`content-tab ${activeTab === "reels" ? "active" : ""}`}
                  onClick={() => setActiveTab("reels")}
                >
                  <Film size={16} />
                  <span>Reels</span>
                </button>

                <button
                  type="button"
                  className={`content-tab ${activeTab === "posts" ? "active" : ""}`}
                  onClick={() => setActiveTab("posts")}
                >
                  <Grid3x3 size={16} />
                  <span>Posts</span>
                </button>

                <button
                  type="button"
                  className={`content-tab ${activeTab === "achievements" ? "active" : ""}`}
                  onClick={() => setActiveTab("achievements")}
                >
                  <Trophy size={16} />
                  <span>Achievements</span>
                </button>
              </div>

              <div className="content-grid-wrap">
                <div className="content-grid">
                  {displayContent.length > 0 ? (
                    displayContent.map((content, index) => (
                      <div
                        key={content.id || `${content.type}-${index}`}
                        className="content-card"
                        onClick={() =>
                          content.type !== "achievement" &&
                          openPostViewer(content.id)
                        }
                      >
                        {isOwnProfile && (
                          <div
                            className="content-menu-wrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="content-menu-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenContentMenuId((prev) =>
                                  prev === content.id ? null : content.id,
                                );
                              }}
                            >
                              <MoreVertical size={18} />
                            </button>

                            {openContentMenuId === content.id && (
                              <div className="content-menu-dropdown">
                                {content.type !== "achievement" && (
                                  <button
                                    type="button"
                                    className="content-menu-item"
                                    onClick={() =>
                                      handleAddToAchievement(content)
                                    }
                                  >
                                    Add Achievement
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="content-menu-item delete"
                                 onClick={() => handleDeleteContent(content)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {content.type === "reel" ? (
                          content.thumbnail ? (
                            <video
                              className="content-media reel-video"
                              src={content.thumbnail}
                              controls
                              playsInline
                              muted
                              preload="metadata"
                            />
                          ) : (
                            <div className="content-media reel-video-empty">
                              No reel added
                            </div>
                          )
                        ) : (
                          <img
                            className="content-media"
                            src={
                              content.thumbnail ||
                              "https://via.placeholder.com/400?text=Media"
                            }
                            alt={content.title || "Content"}
                          />
                        )}

                        <div className="content-card-overlay" />

                        <div className="content-top-badge">
                          {content.type === "reel" && (
                            <span className="mini-dark-badge insta-view-badge">
                              <Play size={11} fill="#fff" color="#fff" />
                              {content.views || 0}
                            </span>
                          )}

                          {content.type === "achievement" && (
                            <div className="mini-gold-badge">
                              <Star size={16} fill="#fff" color="#fff" />
                            </div>
                          )}
                        </div>

                        <div className="content-bottom">
                          <p className="content-title">
                            {content.title || "Untitled"}
                          </p>

                          {"duration" in content && content.duration ? (
                            <p className="content-sub">{content.duration}</p>
                          ) : null}

                          {"date" in content && content.date ? (
                            <p className="content-sub">{content.date}</p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state-card">
                      <p>No content added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="right-column">
            <SectionCard
              icon={Target}
              title="Career Goal"
              right={
                isOwnProfile && (
                  <button
                    type="button"
                    className="icon-btn edit-icon-btn"
                    onClick={() => openEditor("careerGoal")}
                  >
                    <Pen size={16} />
                  </button>
                )
              }
            >
              <div className="goal-box">
                <div className="goal-inner">
                  <div className="goal-icon">
                    <Briefcase size={20} color="#2563eb" />
                  </div>

                  <div className="goal-text">
                    <p>{profile.careerGoal || "Add your career goal"}</p>
                    <div className="goal-note">
                      This helps recommendations for jobs, recruiters, courses
                      and content.
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Code}
              title="Skills & Interests"
              right={
                isOwnProfile && (
                  <button
                    type="button"
                    className="icon-btn edit-icon-btn"
                    onClick={() => openEditor("skills")}
                  >
                    <Pen size={16} />
                  </button>
                )
              }
            >
              <div className="skills-ai-box">
                <div className="skills-wrap">
                  {(profile.skills || []).length > 0 ? (
                    profile.skills.map((skill, index) => (
                      <span className="skill-pill" key={`${skill}-${index}`}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p>No skills added yet.</p>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Briefcase}
              title="Experience / Internship"
              right={
                isOwnProfile && (
                  <button
                    type="button"
                    className="icon-btn edit-icon-btn"
                    onClick={() => openEditor("experience")}
                  >
                    <Pen size={16} />
                  </button>
                )
              }
            >
              <div className="timeline">
                {experience.length === 0 && <p>No experience added yet.</p>}

                {experience.map((job, index) => (
                  <div className="timeline-item" key={job.id || index}>
                    {index !== experience.length - 1 && (
                      <div className="timeline-line" />
                    )}
                    <div
                      className={`timeline-dot ${index === 0 ? "primary" : "secondary"}`}
                    />

                    <div className="timeline-card">
                      <div className="timeline-card-top">
                        <div>
                          <h4>{job.role}</h4>
                          <p className="timeline-company">{job.company}</p>
                        </div>
                        <span className="timeline-period">{job.period}</span>
                      </div>

                      <p>{job.description}</p>

                      <div className="timeline-tags">
                        {(job.tags || []).map((tag, tagIndex) => (
                          <span
                            className="timeline-tag"
                            key={`${tag}-${tagIndex}`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={FolderKanban}
              title="Projects"
              right={
                isOwnProfile && (
                  <button
                    type="button"
                    className="icon-btn edit-icon-btn"
                    onClick={() => openEditor("projects")}
                  >
                    <Pen size={16} />
                  </button>
                )
              }
            >
              <div className="timeline">
                {projects.length === 0 && <p>No projects added yet.</p>}

                {projects.map((project, index) => (
                  <div className="timeline-item" key={project.id || index}>
                    {index !== projects.length - 1 && (
                      <div className="timeline-line" />
                    )}
                    <div
                      className={`timeline-dot ${index === 0 ? "primary" : "secondary"}`}
                    />

                    <div className="timeline-card">
                      <div className="timeline-card-top">
                        <div>
                          <h4>{project.title}</h4>
                          <p className="timeline-company">
                            {project.techStack}
                          </p>
                        </div>
                        <span className="timeline-period">
                          {project.period}
                        </span>
                      </div>

                      <p>{project.description}</p>

                      {project.link ? (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noreferrer"
                          className="project-link"
                        >
                          View Project
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={GraduationCap}
              title="Education"
              className="modern-education-section"
              right={
                isOwnProfile && (
                  <button
                    type="button"
                    className="icon-btn edit-icon-btn"
                    onClick={() => openEditor("education")}
                  >
                    <Pen size={16} />
                  </button>
                )
              }
            >
              <div className="modern-education-list">
                {education.length === 0 && <p>No education added yet.</p>}

                {sortEducation(education).map((edu, index) => {
                  const eduType = normalizeEducationType(edu.degree || "");
                  return (
                    <div
                      className="modern-education-card"
                      key={edu.id || index}
                    >
                      <div className="modern-education-left">
                        <div className="modern-education-icon">
                          <GraduationCap size={20} />
                        </div>
                      </div>

                      <div className="modern-education-right">
                        <div className="modern-education-top">
                          <span className="modern-edu-type">{eduType}</span>
                          <span className="modern-edu-period">
                            {edu.period || "Add period"}
                          </span>
                        </div>

                        <h4>{edu.school || "Add institution"}</h4>
                        <p>{edu.degree || "Add degree / level"}</p>

                        <div className="modern-education-footer">
                          <span className="modern-edu-grade">
                            Grade: {edu.grade || "Not added"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              icon={Award}
              title="Highlights"
              right={
                isOwnProfile && (
                  <button
                    type="button"
                    className="icon-btn edit-icon-btn"
                    onClick={() => openEditor("highlights")}
                  >
                    <Pen size={16} />
                  </button>
                )
              }
            >
              <div className="highlights-grid">
                <div className="highlight-card highlight-blue">
                  <p>Top Skill</p>
                  <p>{profile.topSkill || "Add top skill"}</p>
                </div>

                <div className="highlight-card highlight-purple">
                  <p>Best Area</p>
                  <p>{profile.bestArea || "Add best area"}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Briefcase}
              title="Availability & Preferred Locations"
              right={
                isOwnProfile && (
                  <button
                    type="button"
                    className="icon-btn edit-icon-btn"
                    onClick={() => openEditor("availability")}
                  >
                    <Pen size={16} />
                  </button>
                )
              }
            >
              <div className="availability-card">
                <div className="availability-row">
                  <span className="availability-label">Notice Period</span>
                  <span className="availability-value">
                    {profile.noticePeriod || "Immediate"}
                  </span>
                </div>

                <div className="availability-row">
                <span className="availability-label">Years of Experience</span>
                <span className="availability-value">
                  {profile.yearsOfExperience || "Not added"}
                </span>
              </div>

                              <div className="availability-row availability-row-column">
                  <span className="availability-label">
                    Preferred Locations
                  </span>

                  <div className="availability-location-wrap">
                    {(profile.preferredLocations || []).length > 0 ? (
                      profile.preferredLocations.map((city, index) => (
                        <span
                          key={`${city}-${index}`}
                          className="availability-pill"
                        >
                          {city}
                        </span>
                      ))
                    ) : (
                      <span className="availability-empty">
                        No preferred locations added
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {isOwnProfile && editSection === "availability" && (
              <EditModal
                title="Edit Availability & Preferred Locations"
                onClose={() => setEditSection("")}
                onSave={saveEditor}
                saving={saving}
              >
                <div className="form-grid">
                  <div className="form-field">
                    <label>Notice Period</label>
                    <select
                      value={profileDraft.noticePeriod || "Immediate"}
                      onChange={(e) =>
                        setProfileDraft({
                          ...profileDraft,
                          noticePeriod: e.target.value,
                        })
                      }
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="30 Days Below">30 Days Below</option>
                      <option value="2 Months">2 Months</option>
                    </select>
                  </div>


<div className="form-field">
  <label>Years of Experience</label>
  <select
    value={profileDraft.yearsOfExperience || ""}
    onChange={(e) =>
      setProfileDraft({
        ...profileDraft,
        yearsOfExperience: e.target.value,
      })
    }
  >
    <option value="">Select experience</option>
    <option value="Fresher">Fresher</option>
    <option value="0-1 Years">0-1 Years</option>
    <option value="1-2 Years">1-2 Years</option>
    <option value="2-3 Years">2-3 Years</option>
    <option value="3-5 Years">3-5 Years</option>
    <option value="5-7 Years">5-7 Years</option>
    <option value="7-10 Years">7-10 Years</option>
    <option value="10+ Years">10+ Years</option>
  </select>
</div>





















                  <div className="form-field full-width">
                    <label>Preferred Locations (select up to 3)</label>

                    <div className="checkbox-grid">
                      {[
                        "Hyderabad",
                        "Bangalore",
                        "Chennai",
                        "Mumbai",
                        "Pune",
                        "Delhi",
                        "Noida",
                        "Gurgaon",
                      ].map((city) => {
                        const selected = profileDraft.preferredLocations || [];

                        return (
                          <label key={city} className="checkbox-pill">
                            <input
                              type="checkbox"
                              checked={selected.includes(city)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selected.length >= 3) return;
                                  setProfileDraft({
                                    ...profileDraft,
                                    preferredLocations: [...selected, city],
                                  });
                                } else {
                                  setProfileDraft({
                                    ...profileDraft,
                                    preferredLocations: selected.filter(
                                      (item) => item !== city,
                                    ),
                                  });
                                }
                              }}
                            />
                            <span>{city}</span>
                          </label>
                        );
                      })}
                    </div>

                    <small>
                      {(profileDraft.preferredLocations || []).length}/3
                      selected
                    </small>
                  </div>
                </div>
              </EditModal>
            )}

<SectionCard icon={FileText} title="ATS Resume">
  <div className="resume-card-box">
    <p>Open your ATS resume in a separate page.</p>
    <button
      type="button"
      className="primary-btn resume-download-btn"
      onClick={() =>
        navigate("/student/ats-resume", {
          state: {
            profile,
            experience,
            education,
            projects,
          },
        })
      }
    >
      <FileText size={16} />
      <span>Open ATS Resume</span>
    </button>
  </div>
</SectionCard>



          </div>
        </div>
      </div>







      

      {isOwnProfile && editSection === "profile" && (
        <EditModal
          title="Edit Profile"
          onClose={() => setEditSection("")}
          onSave={saveEditor}
          saving={saving}
        >
          <div className="form-grid">
            <div className="form-field">
<div className="form-group">
  <label>Profile Image</label>

  {profile.avatar ? (
    <img
      src={profile.avatar}
      alt="Profile"
      style={{
        width: "90px",
        height: "90px",
        objectFit: "cover",
        borderRadius: "50%",
        marginBottom: "10px",
        display: "block",
      }}
    />
  ) : null}

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) handleProfileMediaUpload(file, "avatar");
    }}
  />

  {mediaUploading.avatar ? <p>Uploading profile image...</p> : null}
</div>
            </div>

            <div className="form-field">
        
<div className="form-group">
  <label>Cover Image</label>

  {profile.coverImage ? (
    <img
      src={profile.coverImage}
      alt="Cover"
      style={{
        width: "100%",
        maxWidth: "280px",
        height: "120px",
        objectFit: "cover",
        borderRadius: "12px",
        marginBottom: "10px",
        display: "block",
      }}
    />
  ) : null}

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) handleProfileMediaUpload(file, "coverImage");
    }}
  />

  {mediaUploading.coverImage ? <p>Uploading cover image...</p> : null}
</div>
            </div>

            <div className="form-field">
              <label>Name</label>
              <input
                value={profileDraft.name}
                onChange={(e) =>
                  setProfileDraft({ ...profileDraft, name: e.target.value })
                }
              />
            </div>

            <div className="form-field">
              <label>Headline</label>
              <input
                value={profileDraft.headline}
                onChange={(e) =>
                  setProfileDraft({ ...profileDraft, headline: e.target.value })
                }
              />
            </div>

            <div className="form-field">
              <label>Location</label>
              <input
                value={profileDraft.location}
                onChange={(e) =>
                  setProfileDraft({ ...profileDraft, location: e.target.value })
                }
              />
            </div>

            <div className="form-field">
              <label>Who you are / Open To</label>
              <select
                value={profileDraft.openTo}
                onChange={(e) =>
                  setProfileDraft({ ...profileDraft, openTo: e.target.value })
                }
              >
                {openToOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Profile Type</label>
              <select
                value={profileDraft.profileType}
                onChange={(e) =>
                  setProfileDraft({
                    ...profileDraft,
                    profileType: e.target.value,
                  })
                }
              >
                {profileTypeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field full-width">
              <label>Main Skills (max 6, comma separated)</label>
              <input
                type="text"
                placeholder="React, Node.js, MongoDB, JavaScript"
                value={mainSkillsInput}
                onChange={(e) => setMainSkillsInput(e.target.value)}
              />
              <small>
                {
                  mainSkillsInput
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .slice(0, 6).length
                }
                /6 skills
              </small>
            </div>
          </div>
        </EditModal>
      )}

      {isOwnProfile && editSection === "introVideo" && (
  <EditModal
    title="Edit Introduction Video"
    onClose={() => setEditSection("")}
    onSave={saveEditor}
    saving={saving}
  >
    <div className="form-group">
      <label>Intro Video</label>

      {profile.introVideoUrl ? (
        <video
          src={profile.introVideoUrl}
          controls
          style={{
            width: "100%",
            maxWidth: "320px",
            borderRadius: "12px",
            marginBottom: "10px",
            display: "block",
          }}
        />
      ) : null}

      <input
        type="file"
        accept="video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleProfileMediaUpload(file, "introVideo");
        }}
      />

      {mediaUploading.introVideo ? (
        <p>Uploading intro video...</p>
      ) : null}
    </div>
  </EditModal>
)}

      {isOwnProfile && editSection === "about" && (
        <EditModal
          title="Edit About Me"
          onClose={() => setEditSection("")}
          onSave={saveEditor}
          saving={saving}
        >
          <div className="form-field">
            <label>About</label>
            <textarea
              rows="7"
              value={aboutDraft}
              onChange={(e) => setAboutDraft(e.target.value)}
            />
          </div>
        </EditModal>
      )}

      {isOwnProfile && editSection === "careerGoal" && (
        <EditModal
          title="Edit Career Goal"
          onClose={() => setEditSection("")}
          onSave={saveEditor}
          saving={saving}
        >
          <div className="form-field">
            <label>Career Goal</label>
            <textarea
              rows="6"
              value={careerGoalDraft}
              onChange={(e) => setCareerGoalDraft(e.target.value)}
            />
          </div>
        </EditModal>
      )}

      {isOwnProfile && editSection === "skills" && (
        <EditModal
          title="Edit Skills & Interests"
          onClose={() => setEditSection("")}
          onSave={saveEditor}
          saving={saving}
        >
          <div className="form-field">
            <label>Skills (comma separated)</label>
            <textarea
              rows="6"
              value={skillsDraft}
              onChange={(e) => setSkillsDraft(e.target.value)}
            />
          </div>
        </EditModal>
      )}

      {isOwnProfile && editSection === "experience" && (
        <EditModal
          title="Edit Experience / Internship"
          onClose={() => setEditSection("")}
          onSave={saveEditor}
          saving={saving}
        >
          <div className="dynamic-edit-list">
            {experienceDraft.map((item, index) => (
              <div className="dynamic-card" key={item.id || index}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Role</label>
                    <input
                      value={item.role || ""}
                      onChange={(e) => {
                        const arr = [...experienceDraft];
                        arr[index].role = e.target.value;
                        setExperienceDraft(arr);
                      }}
                    />
                  </div>

                  <div className="form-field">
                    <label>Company</label>
                    <input
                      value={item.company || ""}
                      onChange={(e) => {
                        const arr = [...experienceDraft];
                        arr[index].company = e.target.value;
                        setExperienceDraft(arr);
                      }}
                    />
                  </div>

                  <div className="form-field">
                    <label>Period</label>
                    <input
                      value={item.period || ""}
                      onChange={(e) => {
                        const arr = [...experienceDraft];
                        arr[index].period = e.target.value;
                        setExperienceDraft(arr);
                      }}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={item.description || ""}
                      onChange={(e) => {
                        const arr = [...experienceDraft];
                        arr[index].description = e.target.value;
                        setExperienceDraft(arr);
                      }}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Tags (comma separated)</label>
                    <input
                      value={(item.tags || []).join(", ")}
                      onChange={(e) => {
                        const arr = [...experienceDraft];
                        arr[index].tags = e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean);
                        setExperienceDraft(arr);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              className="secondary-btn add-btn"
              type="button"
              onClick={() =>
                setExperienceDraft((prev) => [
                  ...prev,
                  {
                    id: String(Date.now()),
                    role: "",
                    company: "",
                    period: "",
                    description: "",
                    tags: [],
                  },
                ])
              }
            >
              <Plus size={16} />
              Add Experience / Internship
            </button>
          </div>
        </EditModal>
      )}

      {isOwnProfile && editSection === "education" && (
        <EditModal
          title="Edit Education"
          onClose={() => setEditSection("")}
          onSave={saveEditor}
          saving={saving}
        >
          <div className="edit-guideline">
            Recommended order: Masters / PG, Degree, Intermediate / Diploma,
            Schooling.
          </div>

          <div className="dynamic-edit-list">
            {sortEducation(educationDraft).map((item, index) => (
              <div
                className="dynamic-card modern-edu-edit-card"
                key={item.id || index}
              >
                <div className="education-edit-badge">
                  {normalizeEducationType(item.degree || "")}
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label>School / Institution</label>
                    <input
                      value={item.school || ""}
                      onChange={(e) => {
                        const arr = [...educationDraft];
                        arr[index].school = e.target.value;
                        setEducationDraft(sortEducation(arr));
                      }}
                    />
                  </div>

                  <div className="form-field">
                    <label>Degree / Level</label>
                    <select
                      value={item.degree || ""}
                      onChange={(e) => {
                        const arr = [...educationDraft];
                        arr[index].degree = e.target.value;
                        setEducationDraft(sortEducation(arr));
                      }}
                    >
                      {educationOrder.map((eduType) => (
                        <option key={eduType} value={eduType}>
                          {eduType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Period</label>
                    <input
                      value={item.period || ""}
                      onChange={(e) => {
                        const arr = [...educationDraft];
                        arr[index].period = e.target.value;
                        setEducationDraft(sortEducation(arr));
                      }}
                    />
                  </div>

                  <div className="form-field">
                    <label>Grade</label>
                    <input
                      value={item.grade || ""}
                      onChange={(e) => {
                        const arr = [...educationDraft];
                        arr[index].grade = e.target.value;
                        setEducationDraft(sortEducation(arr));
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              className="secondary-btn add-btn"
              type="button"
              onClick={() =>
                setEducationDraft((prev) =>
                  sortEducation([
                    ...prev,
                    {
                      id: String(Date.now()),
                      school: "",
                      degree: getNextEducationLabel(prev),
                      period: "",
                      grade: "",
                    },
                  ]),
                )
              }
            >
              <Plus size={16} />
              Add Education
            </button>
          </div>
        </EditModal>
      )}

      {isOwnProfile && editSection === "projects" && (
        <EditModal
          title="Edit Projects"
          onClose={() => setEditSection("")}
          onSave={saveEditor}
          saving={saving}
        >
          <div className="dynamic-edit-list">
            {projectsDraft.map((item, index) => (
              <div className="dynamic-card" key={item.id || index}>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Project Title</label>
                    <input
                      value={item.title || ""}
                      onChange={(e) => {
                        const arr = [...projectsDraft];
                        arr[index].title = e.target.value;
                        setProjectsDraft(arr);
                      }}
                    />
                  </div>

                  <div className="form-field">
                    <label>Period</label>
                    <input
                      placeholder="Example: Jan 2025 - Mar 2025"
                      value={item.period || ""}
                      onChange={(e) => {
                        const arr = [...projectsDraft];
                        arr[index].period = e.target.value;
                        setProjectsDraft(arr);
                      }}
                    />{" "}
                  </div>

                  <div className="form-field full-width">
                    <label>Tech Stack</label>
                    <input
                      placeholder="React, Node.js, MongoDB"
                      value={item.techStack || ""}
                      onChange={(e) => {
                        const arr = [...projectsDraft];
                        arr[index].techStack = e.target.value;
                        setProjectsDraft(arr);
                      }}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Description</label>
                    <textarea
                      rows="4"
                      value={item.description || ""}
                      onChange={(e) => {
                        const arr = [...projectsDraft];
                        arr[index].description = e.target.value;
                        setProjectsDraft(arr);
                      }}
                    />
                  </div>

                  <div className="form-field full-width">
                    <label>Project Link</label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/project"
                      value={item.link || ""}
                      onChange={(e) => {
                        const arr = [...projectsDraft];
                        arr[index].link = e.target.value;
                        setProjectsDraft(arr);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              className="secondary-btn add-btn"
              type="button"
              onClick={() =>
                setProjectsDraft((prev) => [
                  ...prev,
                  {
                    id: String(Date.now()),
                    title: "",
                    period: "",
                    techStack: "",
                    description: "",
                    link: "",
                  },
                ])
              }
            >
              <Plus size={16} />
              Add Project
            </button>
          </div>
        </EditModal>
      )}

      {isOwnProfile && editSection === "highlights" && (
        <EditModal
          title="Edit Highlights"
          onClose={() => setEditSection("")}
          onSave={saveEditor}
          saving={saving}
        >
          <div className="form-grid">
            <div className="form-field">
              <label>Top Skill / Domain</label>
              <select
                value={highlightsDraft.topSkill}
                onChange={(e) =>
                  setHighlightsDraft((prev) => ({
                    ...prev,
                    topSkill: e.target.value,
                  }))
                }
              >
                <option value="">Select top skill</option>
                {topSkillOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Best Area</label>
              <select
                value={highlightsDraft.bestArea}
                onChange={(e) =>
                  setHighlightsDraft((prev) => ({
                    ...prev,
                    bestArea: e.target.value,
                  }))
                }
              >
                <option value="">Select best area</option>
                {bestAreaOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </EditModal>
      )}

{viewerOpen && (
  <div className="insta-viewer-overlay" onClick={closePostViewer}>
    <div
      className="insta-viewer-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="insta-viewer-close"
        onClick={closePostViewer}
      >
        <X size={20} />
      </button>

      {viewerLoading ? (
        <div className="insta-viewer-loading">Loading...</div>
      ) : selectedPost ? (
        <>
          <div className="insta-viewer-left">
            {selectedPost.postType === "video" ? (
              <video
                src={selectedPost.videoUrl || selectedPost.thumbnail}
                className="insta-viewer-media"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={selectedPost.imageUrl || selectedPost.thumbnail}
                alt={selectedPost.content || "Post"}
                className="insta-viewer-media"
              />
            )}
          </div>

          <div className="insta-viewer-right">
            <div className="insta-viewer-header">
              <div className="insta-viewer-user">
                <img
                  src={
                    selectedPost.profileImage ||
                    "https://via.placeholder.com/40?text=U"
                  }
                  alt={selectedPost.author}
                  className="insta-viewer-avatar"
                />
                <div>
                  <h4>{selectedPost.author || "Student"}</h4>
                </div>
              </div>
            </div>

            <div className="insta-viewer-comments">
              {selectedPost.content && (
                <div className="insta-comment-item">
                  <img
                    src={
                      selectedPost.profileImage ||
                      "https://via.placeholder.com/40?text=U"
                    }
                    alt={selectedPost.author}
                    className="insta-comment-avatar"
                  />
                  <div>
                    <strong>{selectedPost.author || "Student"}</strong>
                    <p>{selectedPost.content}</p>
                  </div>
                </div>
              )}

              {(selectedPost.comments || []).map((comment) => (
                <div
                  key={comment._id}
                  className="insta-comment-item"
                >
                  <img
                    src={
                      comment.profileImage ||
                      "https://via.placeholder.com/40?text=U"
                    }
                    alt={comment.name}
                    className="insta-comment-avatar"
                  />
                  <div className="insta-comment-body">
                    <p>
                      <strong>{comment.name || "Student"}</strong> {comment.text}
                    </p>
                    <span className="insta-comment-like-count">
                      {comment.likes?.length || 0} likes
                    </span>

                    {(comment.replies || []).map((reply) => (
                      <div key={reply._id} className="insta-reply-item">
                        <strong>{reply.name || "Student"}</strong> {reply.text}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="insta-viewer-actions">
              <button
                type="button"
                className="insta-action-btn liked"
                onClick={handleViewerLike}
              >
                ❤️
              </button>

              <span className="insta-like-text">
                Liked by {selectedPost.likesCount || 0} people
              </span>
            </div>

            <div className="insta-viewer-add-comment">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
              />
              <button type="button" onClick={handleViewerAddComment}>
                Post
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="insta-viewer-loading">No post found</div>
      )}
    </div>
  </div>
)}

      
    </div>
  );
}
