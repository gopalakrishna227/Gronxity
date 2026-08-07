export default function ATSResumeDownload({
  profile = {},
  experience = [],
  education = [],
  projects = [],
}) {
  const safe = (value) => value || "—";

  const handleDownloadResume = () => {
    const resumeHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>${safe(profile.name)} - Resume</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: #eef3fb;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
          padding: 28px;
        }

        .page {
          max-width: 960px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
        }

        .top {
          background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 45%, #7c3aed 100%);
          color: #fff;
          padding: 34px 36px 28px;
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .avatar {
          width: 110px;
          height: 110px;
          border-radius: 22px;
          overflow: hidden;
          background: rgba(255,255,255,0.18);
          border: 4px solid rgba(255,255,255,0.9);
          flex-shrink: 0;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .head h1 {
          margin: 0 0 8px;
          font-size: 34px;
          line-height: 1.1;
        }

        .head p {
          margin: 0 0 8px;
          font-size: 16px;
          opacity: 0.96;
        }

        .meta {
          font-size: 14px;
          opacity: 0.92;
        }

        .content {
          display: grid;
          grid-template-columns: 300px 1fr;
        }

        .sidebar {
          background: #f8faff;
          padding: 28px 24px;
          border-right: 1px solid #e9eef7;
        }

        .main {
          padding: 28px 30px;
        }

        .section {
          margin-bottom: 26px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #4338ca;
          margin: 0 0 12px;
        }

        .para {
          color: #475569;
          line-height: 1.7;
          font-size: 14px;
          margin: 0;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chip {
          background: #eaf1ff;
          color: #2551c7;
          border-radius: 999px;
          padding: 7px 11px;
          font-size: 12px;
          font-weight: 700;
        }

        .item {
          margin-bottom: 18px;
          padding-bottom: 16px;
          border-bottom: 1px solid #edf2f8;
        }

        .item:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }

        .item-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 6px;
        }

        .item-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }

        .item-time {
          color: #6366f1;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .item-sub {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .item-desc {
          font-size: 14px;
          color: #475569;
          line-height: 1.7;
        }

        .edu-card {
          background: #fbfcff;
          border: 1px solid #e7edf8;
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 12px;
        }

        .edu-type {
          display: inline-block;
          background: #eef2ff;
          color: #4f46e5;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .edu-school {
          font-size: 15px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .edu-degree,
        .edu-grade,
        .edu-period {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 4px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="top">
          <div class="avatar">
            ${
              profile.avatar
                ? `<img src="${profile.avatar}" alt="${safe(profile.name)}" />`
                : ``
            }
          </div>
          <div class="head">
            <h1>${safe(profile.name)}</h1>
            <p>${safe(profile.headline)}</p>
            <div class="meta">${safe(profile.location)} | ${safe(profile.profileType)} | ${safe(profile.openTo)}</div>
          </div>
        </div>

        <div class="content">
          <div class="sidebar">
            <div class="section">
              <div class="section-title">Summary</div>
              <p class="para">${safe(profile.about)}</p>
            </div>

            <div class="section">
              <div class="section-title">Career Goal</div>
              <p class="para">${safe(profile.careerGoal)}</p>
            </div>

            <div class="section">
              <div class="section-title">Skills</div>
              <div class="chips">
                ${
                  (profile.skills || []).length
                    ? profile.skills
                        .map((skill) => `<span class="chip">${skill}</span>`)
                        .join("")
                    : `<span class="chip">No skills added</span>`
                }
              </div>
            </div>

            <div class="section">
              <div class="section-title">Highlights</div>
              <p class="para"><strong>Top Skill:</strong> ${safe(profile.topSkill)}</p>
              <p class="para" style="margin-top:8px;"><strong>Best Area:</strong> ${safe(profile.bestArea)}</p>
            </div>
          </div>

          <div class="main">
            <div class="section">
              <div class="section-title">Experience</div>
              ${
                experience.length
                  ? experience
                      .map(
                        (job) => `
                    <div class="item">
                      <div class="item-top">
                        <div class="item-title">${safe(job.role)}</div>
                        <div class="item-time">${safe(job.period)}</div>
                      </div>
                      <div class="item-sub">${safe(job.company)}</div>
                      <div class="item-desc">${safe(job.description)}</div>
                      ${
                        (job.tags || []).length
                          ? `<div class="chips" style="margin-top:10px;">${job.tags
                              .map((tag) => `<span class="chip">${tag}</span>`)
                              .join("")}</div>`
                          : ""
                      }
                    </div>
                  `
                      )
                      .join("")
                  : `<p class="para">No experience added.</p>`
              }
            </div>

            <div class="section">
              <div class="section-title">Projects</div>
              ${
                projects.length
                  ? projects
                      .map(
                        (project) => `
                    <div class="item">
                      <div class="item-top">
                        <div class="item-title">${safe(project.title)}</div>
                        <div class="item-time">${safe(project.period)}</div>
                      </div>
                      <div class="item-sub">${safe(project.techStack)}</div>
                      <div class="item-desc">${safe(project.description)}</div>
                      ${
                        project.link
                          ? `<div class="item-sub" style="margin-top:8px;">Project Link: ${safe(project.link)}</div>`
                          : ""
                      }
                    </div>
                  `
                      )
                      .join("")
                  : `<p class="para">No projects added.</p>`
              }
            </div>

            <div class="section">
              <div class="section-title">Education</div>
              ${
                education.length
                  ? education
                      .map(
                        (edu) => `
                    <div class="edu-card">
                      <div class="edu-type">${safe(edu.degree)}</div>
                      <div class="edu-school">${safe(edu.school)}</div>
                      <div class="edu-degree">${safe(edu.degree)}</div>
                      <div class="edu-period">${safe(edu.period)}</div>
                      <div class="edu-grade">Grade: ${safe(edu.grade)}</div>
                    </div>
                  `
                      )
                      .join("")
                  : `<p class="para">No education added.</p>`
              }
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    const blob = new Blob([resumeHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(profile.name || "student-profile").replace(/\s+/g, "-")}-resume.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { handleDownloadResume };
}