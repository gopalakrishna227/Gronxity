import { useState } from "react";
import { Bell, MessageCircle, Briefcase, Mail, Megaphone, Shield } from "lucide-react";
import "./NotificationPreferences.css";

export default function NotificationPreferences() {
  const [settings, setSettings] = useState([
    {
      id: 1,
      key: "appNotifications",
      title: "App Notifications",
      description: "Enable or disable all general app notifications.",
      enabled: true,
      icon: <Bell size={20} />,
    },
    {
      id: 2,
      key: "messageNotifications",
      title: "Message Notifications",
      description: "Get notified when you receive new messages.",
      enabled: true,
      icon: <MessageCircle size={20} />,
    },
    {
      id: 3,
      key: "recruiterNotifications",
      title: "Recruiter Notifications",
      description: "Receive updates when recruiters view or contact you.",
      enabled: true,
      icon: <Briefcase size={20} />,
    },
    {
      id: 4,
      key: "jobAlerts",
      title: "Job Alerts",
      description: "Turn on notifications for matching jobs and opportunities.",
      enabled: false,
      icon: <Shield size={20} />,
    },
    {
      id: 5,
      key: "emailUpdates",
      title: "Email Updates",
      description: "Receive important updates and account activity by email.",
      enabled: true,
      icon: <Mail size={20} />,
    },
    {
      id: 6,
      key: "promoNotifications",
      title: "Promotional Notifications",
      description: "Get offers, feature releases, and promotional updates.",
      enabled: false,
      icon: <Megaphone size={20} />,
    },
  ]);

  const toggleSetting = (id) => {
    setSettings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  return (
    <div className="notify-page">
      <div className="notify-card">
        <div className="notify-header">
          <h1>Notifications & Preferences</h1>
          <p>Manage how you want to receive updates inside the platform.</p>
        </div>

        <div className="notify-list">
          {settings.map((item) => (
            <div className="notify-row" key={item.id}>
              <div className="notify-left">
                <div className="notify-icon">{item.icon}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </div>

              <button
                className={`toggle-switch ${item.enabled ? "active" : ""}`}
                onClick={() => toggleSetting(item.id)}
                type="button"
              >
                <span className="toggle-thumb"></span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}