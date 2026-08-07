import React from "react";
import {
  Home,
  BookOpen,
  Search,
  MessageCircle,
  User,
  Briefcase,
  Bell,
  LogOut,
  PlusSquare,
  Plus
} from "lucide-react";

export default function JobScreen() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* Sidebar */}
      <div
        style={{
          width: "240px",
          background: "#111827",
          color: "white",
          padding: "20px",
        }}
      >
        <h2 style={{ marginBottom: "30px" }}>My App</h2>

        <SidebarItem icon={<Home size={18} />} text="Home" />
        <SidebarItem icon={<Search size={18} />} text="Search" />
        <SidebarItem icon={<Briefcase size={18} />} text="Jobs" />
        <SidebarItem icon={<BookOpen size={18} />} text="Courses" />
        <SidebarItem icon={<MessageCircle size={18} />} text="Messages" />
        <SidebarItem icon={<Bell size={18} />} text="Notifications" />
        <SidebarItem icon={<PlusSquare size={18} />} text="Post Job" />
        <SidebarItem icon={<User size={18} />} text="Profile" />
        <SidebarItem icon={<LogOut size={18} />} text="Logout" />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "40px" }}>
        <h1>Welcome to Dashboard</h1>
        <p>Select menu from left side.</p>
      </div>
    </div>
  );
}

function SidebarItem({ icon, text }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px",
        cursor: "pointer",
        borderRadius: "6px",
        marginBottom: "10px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#1f2937")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}