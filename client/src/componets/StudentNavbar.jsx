import React, { useState } from "react";
import { FiSearch, FiHeart,FiPlus } from "react-icons/fi";
import "./StudentNavbar.css";

function StudentNavbar({
  searchText,
  setSearchText,
  feedType,
  setFeedType,
  selectedTags,
  setSelectedTags,
  onNotificationClick,
   onCreatePostClick,
}) {
  const [showFilter, setShowFilter] = useState(false);

  const tabs = ["For You", "All", "Trending", "Other"];

  const technologies = [
    "AI/ML",
    "Python",
    "Java",
    "React",
    "Node.js",
    "MongoDB",
    "AWS",
    "Docker",
    "Kubernetes",
    "Cyber Security",
  ];

  const toggleTechnology = (tech) => {
    if (selectedTags.includes(tech)) {
      setSelectedTags(selectedTags.filter((t) => t !== tech));
    } else {
      setSelectedTags([...selectedTags, tech]);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === "Other") {
      setShowFilter(!showFilter);
      return;
    }

    setFeedType(tab);
    setShowFilter(false);
  };

  return (
    <nav className="navbar">

      {/* LINE 1 - LOGO + HEART */}
      <div className="logo-container">

       <button
  className="mobile-plus-btn"
  type="button"
  onClick={() => {
    if (typeof onCreatePostClick === "function") {
      onCreatePostClick();
    } else {
      console.error("onCreatePostClick is not passed to StudentNavbar");
    }
  }}
  aria-label="Create"
>
  <FiPlus />
</button>


        <h1 className="logo-name">Gronxtiy</h1>

        <button
          className="mobile-heart-btn"
          type="button"
          onClick={onNotificationClick}
          aria-label="Notifications"
        >
          <FiHeart />
        </button>
      </div>

      {/* LINE 2 - SEARCH */}
      <div className="search-box">
        <FiSearch className="search-icon" />

        <input
          type="text"
          placeholder="Search Posts, Jobs..."
          className="search-input"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* LINE 3 - TABS */}
      <div className="nav-links">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={
              (feedType === tab ? "activeTab " : "") +
              (tab === "Other" && showFilter ? "activeTab" : "")
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OTHER FILTER */}
      {showFilter && (
        <div className="filter-dropdown">
          <h3>Select Technologies</h3>

          <div className="filter-grid">
            {technologies.map((tech) => (
              <label key={tech}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tech)}
                  onChange={() => toggleTechnology(tech)}
                />

                <span>{tech}</span>
              </label>
            ))}
          </div>

          <button
            className="apply-filter-btn"
            onClick={() => setShowFilter(false)}
          >
            Apply
          </button>
        </div>
      )}
    </nav>
  );
}

export default StudentNavbar;



