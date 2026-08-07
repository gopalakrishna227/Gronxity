import React, { useState , useEffect,} from "react";
import {
  Home,
  BookOpen,
  Search,
  MessageCircle,
  User,
  Briefcase,
  Bell,
  PlusSquare,
    TextAlignJustify,
     Clapperboard, // ✅ added reels icon

} from "lucide-react";
import "./Student.css";

import StudentHomePage from "./StudentHomePage";
import StudentJobs from "./StudentJobs";
import StudentPost from "./StudentPost";
import StudentSearch from "./StudentSearch";
import ProfilePage from "./ProfilePage";
import StudentConversations from "./StudentConversations";
import StudentCourses from "./StudentCourses";
import StudentVideosPage from "./StudentVideosPage";
import StudentSettings from "./StudentSettings";
import StudentNotifications from "./StudentNotifications";







export default function Student() {
const [active, setActive] = useState(() => {
  return sessionStorage.getItem("studentActiveTab") || "Home";
});

useEffect(() => {
  sessionStorage.setItem("studentActiveTab", active);
}, [active]);



  const menuItems = [
    { name: "Home", icon: <Home size={20} /> },
    { name: "Search", icon: <Search size={20} /> },
    { name: "Jobs", icon: <Briefcase size={20} /> },
    { name: "Create Post", icon: <PlusSquare size={20} />, mobileHide: true },
    { name: "Courses", icon: <BookOpen size={20} /> },
   { name: "Conversations", icon: <MessageCircle size={20} /> },
    { name: "Notifications", icon: <Bell size={20} />, mobileHide: true },
        { name: "Reels", icon: <Clapperboard size={20} /> }, // ✅ added

    { name: "Profile", icon: <User size={20} /> },
    { name: "More", icon:  <TextAlignJustify size={20} />, mobileHide: true },
  ];

  const renderPage = () => {
    switch (active) {
      case "Home":
        return <StudentHomePage />;
      case "Search":
        return <StudentSearch />;
      case "Jobs":
        return <StudentJobs />;
      case "Create Post":
        return <StudentPost />;
      case "Courses":
        return <StudentCourses/>;
     case "Conversations":   // ✅ ADD THIS
      return <StudentConversations />;

        case "Reels":
        return <StudentVideosPage />; // ✅ reels page
      case "Notifications":
        return <StudentNotifications />;
      case "Profile":
        return <ProfilePage />;
        case "More":
        return <StudentSettings />;
      default:
        return <ProfilePage/>;
    }
  };

  return (
    <div className="dashboard-container">
<div className="sidebar">

  
 
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

      <div className="content">{renderPage()}</div>
    </div>
  );
}

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