import React, { useState } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Inbox,
  Video,
  Star,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";

import "./Sidebar.css";

// Import Your Pages
import RecutierDashboard from "./RecutierDashboard";
import MyJobs from "./MyJobs";
import VideoProfiles from "./VideoProfiles";
import Interviews from "./Interviews";
import Analytics from "./Analytics";
import SettingsPage from "./Settings";
import PostJob from "./PostJob";
import RecruiterApplications from "./RecruiterApplications";
import ShortlistedCandidates from "./ShortlistedCandidates";




export default function Sidebar() {
  const [active, setActive] = useState("Dashboard");

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Post Job", icon: <PlusCircle size={20} /> },
    { name: "My Jobs", icon: <FileText size={20} /> },
    { name: "Applications", icon: <Inbox size={20} /> },
    { name: "Videos", icon: <Video size={20} />, }, // mobileHide: true
    { name: "Shortlisted", icon: <Star size={20} /> },
    { name: "Interviews", icon: <Calendar size={20} />,}, // mobileHide: true
    { name: "Analytics", icon: <BarChart3 size={20} /> },
    { name: "Settings", icon: <Settings size={20} />,  }, //mobileHide: true
  ];

  const pages = {
    Dashboard: <RecutierDashboard />,
    "Post Job": <PostJob />,
    "My Jobs": <MyJobs />,
    Applications: <RecruiterApplications />,
    Videos: <VideoProfiles />,
    Shortlisted: <ShortlistedCandidates onBackToApplications={() => setActive("Applications")} />,
    Interviews: <Interviews />,
    Analytics: <Analytics />,
    Settings: <SettingsPage />,
  };

  return (
    <div className="dashboard-container">
      
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="logo">GroNxt</h2>
        <p className="tagline">Recruiter Panel</p>

        {menuItems.map((item) => (
          <SidebarItem
            key={item.name}
            icon={item.icon}
            text={item.name}
            active={active === item.name}
            onClick={() => setActive(item.name)}
            mobileHide={item.mobileHide}
          />
        ))}
      </div>

      {/* Content Area */}
      <div className="content">
        {pages[active]}
      </div>
    </div>
  );
}

////////////////////////////////////////////////////

function SidebarItem({ icon, text, active, onClick, mobileHide }) {
  return (
    <div
      onClick={onClick}
      className={`sidebar-item ${active ? "active" : ""} ${
        mobileHide ? "mobile-hide" : ""
      }`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}