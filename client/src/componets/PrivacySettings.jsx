import { useState } from "react";
import {
  Eye,
  Mail,
  Phone,
  Search,
  FileText,
  MessageCircle,
} from "lucide-react";
import "./PrivacySettings.css";

export default function PrivacySettings() {
  const [settings, setSettings] = useState({
    profileVisibility: true,
    emailVisibility: false,
    phoneVisibility: false,
    searchVisibility: true,
    resumeAccess: true,
    messagePermissions: "everyone",
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDropdownChange = (e) => {
    setSettings((prev) => ({
      ...prev,
      messagePermissions: e.target.value,
    }));
  };

  return (
    <div className="privacy-page">
      <div className="privacy-card">
        <div className="privacy-header">
          <h1>Privacy Settings</h1>
          <p>Control who can see your information and interact with you.</p>
        </div>

        <div className="privacy-list">

          {/* Profile Visibility */}
          <div className="privacy-row">
            <div className="privacy-left">
              <div className="privacy-icon"><Eye size={20} /></div>
              <div>
                <h3>Profile Visibility</h3>
                <p>Show profile to recruiters and users.</p>
              </div>
            </div>
            <button
              className={`toggle-switch ${settings.profileVisibility ? "active" : ""}`}
              onClick={() => toggleSetting("profileVisibility")}
            >
              <span className="toggle-thumb"></span>
            </button>
          </div>

          {/* Email Visibility */}
          <div className="privacy-row">
            <div className="privacy-left">
              <div className="privacy-icon"><Mail size={20} /></div>
              <div>
                <h3>Email Visibility</h3>
                <p>Show email on your profile.</p>
              </div>
            </div>
            <button
              className={`toggle-switch ${settings.emailVisibility ? "active" : ""}`}
              onClick={() => toggleSetting("emailVisibility")}
            >
              <span className="toggle-thumb"></span>
            </button>
          </div>

          {/* Phone Visibility */}
          <div className="privacy-row">
            <div className="privacy-left">
              <div className="privacy-icon"><Phone size={20} /></div>
              <div>
                <h3>Phone Number Visibility</h3>
                <p>Show phone number on your profile.</p>
              </div>
            </div>
            <button
              className={`toggle-switch ${settings.phoneVisibility ? "active" : ""}`}
              onClick={() => toggleSetting("phoneVisibility")}
            >
              <span className="toggle-thumb"></span>
            </button>
          </div>

          {/* Search Visibility */}
          <div className="privacy-row">
            <div className="privacy-left">
              <div className="privacy-icon"><Search size={20} /></div>
              <div>
                <h3>Search Visibility</h3>
                <p>Show your profile in search results.</p>
              </div>
            </div>
            <button
              className={`toggle-switch ${settings.searchVisibility ? "active" : ""}`}
              onClick={() => toggleSetting("searchVisibility")}
            >
              <span className="toggle-thumb"></span>
            </button>
          </div>

          {/* Resume Access */}
          <div className="privacy-row">
            <div className="privacy-left">
              <div className="privacy-icon"><FileText size={20} /></div>
              <div>
                <h3>Resume Access</h3>
                <p>Allow recruiters to view/download your resume.</p>
              </div>
            </div>
            <button
              className={`toggle-switch ${settings.resumeAccess ? "active" : ""}`}
              onClick={() => toggleSetting("resumeAccess")}
            >
              <span className="toggle-thumb"></span>
            </button>
          </div>

          {/* Message Permissions (Dropdown) */}
          <div className="privacy-row">
            <div className="privacy-left">
              <div className="privacy-icon"><MessageCircle size={20} /></div>
              <div>
                <h3>Message Permissions</h3>
                <p>Choose who can send you messages.</p>
              </div>
            </div>

            <select
              className="privacy-dropdown"
              value={settings.messagePermissions}
              onChange={handleDropdownChange}
            >
              <option value="everyone">Everyone</option>
              <option value="recruiters">Recruiters Only</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  );
}