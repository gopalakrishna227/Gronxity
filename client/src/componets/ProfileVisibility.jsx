import { useState } from "react";
import { Eye, Briefcase } from "lucide-react";
import "./ProfileVisibility.css";

export default function ProfileVisibility() {
  const [visibleToRecruiters, setVisibleToRecruiters] = useState(true);

  return (
    <div className="profile-visibility-page">
      <div className="profile-visibility-card">
        <div className="profile-visibility-header">
          <h1>Profile Visibility</h1>
          <p>
            Control whether recruiters can view your profile. This is dummy data
            for now and can be connected to backend later.
          </p>
        </div>

        <div className="profile-visibility-list">
          <div className="profile-visibility-row">
            <div className="profile-visibility-left">
              <div className="profile-visibility-icon">
                <Eye size={20} />
              </div>

              <div>
                <h3>Visible to Recruiters</h3>
                <p>
                  Allow recruiters to view your profile and discover your
                  account for jobs and opportunities.
                </p>
              </div>
            </div>

            <button
              type="button"
              className={`yes-no-toggle ${visibleToRecruiters ? "yes" : "no"}`}
              onClick={() => setVisibleToRecruiters((prev) => !prev)}
            >
              <span className="yes-no-thumb">
                {visibleToRecruiters ? <Briefcase size={14} /> : "×"}
              </span>
              <span className="yes-no-label">
                {visibleToRecruiters ? "Yes" : "No"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}