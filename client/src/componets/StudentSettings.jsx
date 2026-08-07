import React, { useState, useRef, useEffect } from "react";import axios from "axios";
import {
  Shield,
  UserCog,
  Eye,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  Settings,
  Bookmark,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./StudentSettings.css";
import AccountSettings from "./AccountSettings";
import PrivacySettings from "./PrivacySettings";
import ProfileVisibility from "./ProfileVisibility";
import NotificationPreferences from "./NotificationPreferences";
import HelpSupport from "./HelpSupport";
import ReportUser from "./ReportUser";
import StudentSaved from "./StudentSaved";








export default function StudentSettings() {
  const navigate = useNavigate();
  const [active, setActive] = useState("Privacy Settings");
  const contentRef = useRef(null);

  const menuItems = [
    { name: "Privacy Settings", icon: <Shield size={20} /> },
    { name: "Account Settings", icon: <UserCog size={20} /> },
     { name: "Saved", icon: <Bookmark size={20} /> },
    { name: "Profile Visibility", icon: <Eye size={20} /> },
    { name: "Notification Preferences", icon: <Bell size={20} /> },
    { name: "Blocked Users", icon: <Lock size={20} /> },
    { name: "Help & Support", icon: <HelpCircle size={20} /> },
    { name: "Logout", icon: <LogOut size={20} /> },
   
  ];



  useEffect(() => {
  if (contentRef.current) {
    contentRef.current.scrollTo({
      top: 0,
      behavior: "smooth", // use "auto" if you don't want animation
    });
  }
}, [active]);




  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/logout`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout error:", err.response?.data || err.message);
    } finally {
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const renderRightPage = () => {
    switch (active) {
      case "Privacy Settings":
        return <PrivacySettings />;
      case "Account Settings":
        return <AccountSettings />;
      case "Profile Visibility":
        return <ProfileVisibility />;

      case "Saved":
        return <StudentSaved />;
      case "Notification Preferences":
        return <NotificationPreferences />;
      case "Blocked Users":
        return <ReportUser />;
      case "Help & Support":
        return <HelpSupport />;
      case "Logout":
        return (
          <div className="settings-page-box">
            <h2>Logout</h2>
            <p className="settings-page-desc">
              Click the button below to logout from your account.
            </p>

            <button className="logout-main-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        );
      default:
        return <PrivacySettingsPage />;
    }
  };

  return (
    <div className="student-settings-page">
      <div className="student-settings-layout">
        <div className="student-settings-sidebar">
          <div className="student-settings-sidebar-top">
            <div className="student-settings-logo-wrap">
              <div className="student-settings-logo-icon">
                <Settings size={20} />
              </div>
              <div>
                <h2 className="student-settings-logo-text">Settings</h2>
                <p className="student-settings-tagline">Manage your account</p>
              </div>
            </div>
          </div>

          <div className="student-settings-menu">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.name}
                icon={item.icon}
                text={item.name}
                active={active === item.name}
                onClick={() => setActive(item.name)}
              />
            ))}
          </div>
        </div>

        <div
  ref={contentRef}
  className="student-settings-content"
>
  {renderRightPage()}
</div>




      </div>
    </div>
  );
}

function SidebarItem({ icon, text, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`student-settings-sidebar-item ${active ? "active" : ""}`}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}