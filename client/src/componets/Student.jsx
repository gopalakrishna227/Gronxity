
import React, { useState, useEffect } from "react";

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
  Clapperboard,
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

  /* =====================================================
     ACTIVE TAB
  ===================================================== */

  const [active, setActive] = useState(() => {
    try {
      return sessionStorage.getItem("studentActiveTab") || "Home";
    } catch (error) {
      return "Home";
    }
  });


  /* =====================================================
     PREVIOUS TAB

     Used for Notifications Back Arrow
  ===================================================== */

  const [previousActive, setPreviousActive] = useState("Home");


  /* =====================================================
     MOBILE DETECTION
  ===================================================== */

  const [isMobile, setIsMobile] = useState(() => {
    return window.innerWidth <= 768;
  });


  /* =====================================================
     SAVE ACTIVE TAB
  ===================================================== */

  useEffect(() => {

    try {

      sessionStorage.setItem(
        "studentActiveTab",
        active
      );

    } catch (error) {

      console.log(
        "Session storage error:",
        error
      );

    }

  }, [active]);


  /* =====================================================
     CHECK SCREEN SIZE
  ===================================================== */

  useEffect(() => {

    const handleResize = () => {

      setIsMobile(
        window.innerWidth <= 768
      );

    };


    window.addEventListener(
      "resize",
      handleResize
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      );

    };

  }, []);


  /* =====================================================
     CHANGE TAB

     This remembers the current page before
     opening another page.
  ===================================================== */

  const handleTabChange = (nextTab) => {

    if (nextTab !== active) {

      setPreviousActive(active);

      setActive(nextTab);

    }

  };


  /* =====================================================
     BACK FROM NOTIFICATIONS
  ===================================================== */

  const handleNotificationBack = () => {

    setActive(previousActive || "Home");

  };


  /* =====================================================
     MENU ITEMS
  ===================================================== */

  const menuItems = [

    {
      name: "Home",
      icon: <Home size={20} />,
    },

    {
      name: "Search",
      icon: <Search size={20} />,
    },

    {
      name: "Jobs",
      icon: <Briefcase size={20} />,
    },

    {
      name: "Create Post",
      icon: <PlusSquare size={20} />,
      mobileHide: true,
    },

    {
      name: "Courses",
      icon: <BookOpen size={20} />,
    },

    {
      name: "Conversations",
      icon: <MessageCircle size={20} />,
    },

    {
      name: "Notifications",
      icon: <Bell size={20} />,
      mobileHide: true,
    },

    {
      name: "Reels",
      icon: <Clapperboard size={20} />,
      mobileHide: true,
    },

    {
      name: "Profile",
      icon: <User size={20} />,
    },

    {
      name: "More",
      icon: <TextAlignJustify size={20} />,
      mobileHide: true,
    },

  ];


  /* =====================================================
     RENDER PAGE
  ===================================================== */

  const renderPage = () => {

    switch (active) {


      /* =================================================
         HOME
      ================================================= */

      case "Home":

        return (

          <StudentHomePage

            onNotificationClick={() =>
              handleTabChange("Notifications")
            }

            onCreatePostClick={() =>
              handleTabChange("Create Post")
            }

          />

        );


      /* =================================================
         SEARCH

         DESKTOP:
         StudentSearch

         MOBILE:
         StudentVideosPage
      ================================================= */

      case "Search":

        if (isMobile) {

          return <StudentVideosPage />;

        }

        return <StudentSearch />;


      /* =================================================
         JOBS
      ================================================= */

      case "Jobs":

        return <StudentJobs />;


      /* =================================================
         CREATE POST
      ================================================= */

      case "Create Post":

        return (
    <StudentPost
      onBack={() => setActive(previousActive || "Home")}
    />
  );

      /* =================================================
         COURSES
      ================================================= */

      case "Courses":

        return <StudentCourses />;


      /* =================================================
         CONVERSATIONS
      ================================================= */

      case "Conversations":

        return <StudentConversations />;


      /* =================================================
         REELS
      ================================================= */

      case "Reels":

        return <StudentVideosPage />;


      /* =================================================
         NOTIFICATIONS
      ================================================= */

      case "Notifications":

        return (

          <StudentNotifications

            onBack={handleNotificationBack}

          />

        );


      /* =================================================
         PROFILE
      ================================================= */

      case "Profile":

        return (

          <ProfilePage

            onSettingsClick={() =>
              handleTabChange("More")
            }

          />

        );


      /* =================================================
         MORE / SETTINGS
      ================================================= */

      case "More":

        return <StudentSettings />;


      /* =================================================
         DEFAULT
      ================================================= */

      default:

        return <ProfilePage />;

    }

  };


  /* =====================================================
     MAIN UI
  ===================================================== */

  return (

    <div className="dashboard-container">


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <div className="sidebar">

        {menuItems.map((item) => (

          <SidebarItem

            key={item.name}

            icon={item.icon}

            text={item.name}

            active={
              active === item.name
            }

            onClick={() =>
              handleTabChange(item.name)
            }

            mobileHide={
              item.mobileHide
            }

          />

        ))}

      </div>


      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="content">

        {renderPage()}

      </div>


    </div>

  );

}


/* =====================================================
   SIDEBAR ITEM
===================================================== */

function SidebarItem({

  icon,
  text,
  active,
  onClick,
  mobileHide,

}) {

  return (

    <div

      onClick={onClick}

      className={`sidebar-item ${
        active ? "active" : ""
      } ${
        mobileHide ? "mobile-hide" : ""
      }`}

    >

      {icon}

      <span>

        {text}

      </span>

    </div>

  );

}
