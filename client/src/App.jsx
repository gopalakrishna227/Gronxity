import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route ,Navigate } from 'react-router-dom';

import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import JobScreen from './JobScreen';
import Dashboard from './componets/Dashboard';
import Logout from './componets/Logout';
import CreatePost from './componets/CreatePost';

import MyApplications from './MyApplications';
import RecruiterRegister from './componets/RecruiterRegister';
import ProtectedRoute from './componets/ProtectedRoute';
import StudentDashboard from './componets/StudentDashboard';
import SelectRole from './componets/SelectRole';
import PostJob from './Recutier/PostJob';

import MyJobs from "./Recutier/MyJobs";
import AIMatches from "./Recutier/AIMatches";
import Applications from "./Recutier/Applications";
import VideoProfiles from "./Recutier/VideoProfiles";
import Shortlisted from "./Recutier/Shortlisted";
import Interviews from "./Recutier/Interviews";
import Analytics from "./Recutier/Analytics";
import Settings from "./Recutier/Settings";
import RecutierDashboard from './Recutier/RecutierDashboard';
import RecutierPostJob from './Recutier/RecutierPostJob';
import Sidebar from './Recutier/Sidebar';
import StudentJobs from './componets/StudentJobs';
import Job from './Recutier/Job';
import EditJob from './Recutier/EditJob';

import StudentRequests from './componets/StudentRequests';
import StudentConnections from './componets/StudentConnections';
import StudentConversations from './componets/StudentConversations';
import StudentChat from './componets/StudentChat';
import StudentSearch from './componets/StudentSearch';
import ProfilePage from './componets/ProfilePage';
import StudentVideosPage from './componets/StudentVideosPage';
import StudentHomePage from './componets/StudentHomePage';
import StudentPost from './componets/StudentPost';
import Student from './componets/Student';
import StudentStatus from './componets/StudentStatus';
import StudentStatusViewer from './componets/StudentStatusViewer';
import StudentCourses from "./componets/StudentCourses";
import HelpSupport from './componets/HelpSupport';
import ReportUser from './componets/ReportUser';
import NotificationPreferences from './componets/NotificationPreferences';
import ProfileVisibility from './componets/ProfileVisibility';
import AccountSettings from './componets/AccountSettings';
import PrivacySettings from './componets/PrivacySettings';
import StudentPostsPage from './componets/StudentPostsPage';
import RecruiterApplications from './Recutier/RecruiterApplications';
import ShortlistedCandidates from "./Recutier/ShortlistedCandidates";
import StudentSettings from './componets/StudentSettings';
import StudentSaved from './componets/StudentSaved';
import StudentFollows from './componets/StudentFollows';

import CoursePlayerPage from "./componets/CoursePlayerPage";
import CourseProfilePage from './componets/CourseProfilePage';
import CourseNotificationsPage from './componets/CourseNotificationsPage';
import ATSResumePage from './componets/ATSResumePage';
import TrendingPostsPage from './componets/TrendingPostsPage';
import StudentNotificationPostDetails from './componets/StudentNotificationPostDetails';
import TrendingHashtagsPage from './componets/TrendingHashtagsPage';
import DummyStatusBar from './componets/DummyStatusBar';







function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/resetpassword/:id/:token" element={<ResetPassword />} />
        <Route path="/jobscreen" element={<JobScreen />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/createpost" element={<CreatePost />} />
        <Route path="/myapplications" element={<MyApplications />} />
        <Route path="/recruiterregister" element={<RecruiterRegister />} />
        <Route path="/selectrole" element={<SelectRole />} />
                <Route path="/statusbar" element={<DummyStatusBar />} />




        <Route path="/student/course/:courseId" element={<CoursePlayerPage />} />

                    <Route  path="/student/course-profile/:userId"  element={<CourseProfilePage />} />

<Route path="/student/ats-resume" element={<ATSResumePage />} />





<Route
  path="/student/trending/:tag"
  element={<TrendingPostsPage />}
/>














<Route
          path="/recutierpostjob"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <RecutierPostJob />
            </ProtectedRoute>
          }
        />




        <Route
          path="/student/trending"
          element={
            <ProtectedRoute allowedRole="student">
              <TrendingHashtagsPage />
            </ProtectedRoute>
          }
        />






      

       <Route
          path="/ai-matches"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <AIMatches />
            </ProtectedRoute>
          }
        />


 <Route
          path="/applications"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <Applications />
            </ProtectedRoute>
          }
        />




























            <Route
          path="/video-profiles"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <VideoProfiles />
            </ProtectedRoute>
          }
        />




        
        <Route path="/shortlisted" element={  <ProtectedRoute allowedRole="recruiter">
              <Shortlisted />
            </ProtectedRoute>} />
        

        <Route
          path="/interviews"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <Interviews />
            </ProtectedRoute>
          }
        />




  <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <Analytics />
            </ProtectedRoute>
          }
        />






  <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <Settings />
            </ProtectedRoute>
          }
        />



        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <RecutierDashboard />
            </ProtectedRoute>
          }
        />




        <Route
          path="/job"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <Job />
            </ProtectedRoute>
          }
        />













        <Route
          path="/postjob"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <PostJob />
            </ProtectedRoute>
          }
        />

        <Route
          path="/myjobs"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <MyJobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-job/:id"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <EditJob />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/jobs"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentJobs />
            </ProtectedRoute>
          }
        />

    

        <Route
          path="/student/requests"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/connections"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentConnections />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/conversations"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentConversations />
            </ProtectedRoute>
          }
        />





<Route
          path="/student/course-notifications"
          element={
            <ProtectedRoute allowedRole="student">
              <CourseNotificationsPage />
            </ProtectedRoute>
          }
        />








        <Route
          path="/student/chat/:conversationId"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentChat />
            </ProtectedRoute>
          }
        />





<Route
  path="/student/search"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentSearch />
    </ProtectedRoute>
  }
/>



<Route
  path="/student/profile/me"
  element={
    <ProtectedRoute allowedRole="student">
      <ProfilePage />
    </ProtectedRoute>
  }
/>

<Route
  path="/student/profile/:id"
  element={
    <ProtectedRoute allowedRole="student">
      <ProfilePage />
    </ProtectedRoute>
  }
/>


<Route
  path="/student/profile"
  element={
    <ProtectedRoute allowedRole="student">
      <ProfilePage />
    </ProtectedRoute>
  }
/>


<Route
  path="/student/videos"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentVideosPage />
    </ProtectedRoute>
  }
/>


<Route
  path="/student/homepage"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentHomePage/>
    </ProtectedRoute>
  }
/>


<Route
  path="/student/post"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentPost/>
    </ProtectedRoute>
  }
/>

<Route
  path="/student/student"
  element={
    <ProtectedRoute allowedRole="student">
      <Student/>
    </ProtectedRoute>
  }
/>


<Route
  path="/student/status"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentStatus/>
    </ProtectedRoute>
  }
/>


<Route
  path="/student/statusview"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentStatusViewer/>
    </ProtectedRoute>
  }
/>

<Route
  path="/student/courses"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentCourses />
    </ProtectedRoute>
  }
/>




<Route
  path="/student/help-support"
  element={
    <ProtectedRoute allowedRole="student">
      <HelpSupport />
    </ProtectedRoute>
  }
/>




<Route
  path="/student/report-user"
  element={
    <ProtectedRoute allowedRole="student">
      <ReportUser />
    </ProtectedRoute>
  }
/>





<Route
  path="/student/notification-preferences"
  element={
    <ProtectedRoute allowedRole="student">
      <NotificationPreferences/>
    </ProtectedRoute>
  }
/>





<Route
  path="/student/profile-visibility"
  element={
    <ProtectedRoute allowedRole="student">
      <ProfileVisibility/>
    </ProtectedRoute>
  }
/>




<Route
  path="/student/account-settings"
  element={
    <ProtectedRoute allowedRole="student">
      <AccountSettings/>
    </ProtectedRoute>
  }
/>


<Route
  path="/student/privacy-settings"
  element={
    <ProtectedRoute allowedRole="student">
      <PrivacySettings/>
    </ProtectedRoute>
  }
/>




<Route
  path="/student/settings"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentSettings/>
    </ProtectedRoute>
  }
/>


<Route
  path="/student/studentpostpage"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentPostsPage/>
    </ProtectedRoute>
  }
/>






<Route
  path="/student/saved"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentSaved/>
    </ProtectedRoute>
  }
/>



<Route
  path="/student/follow"
  element={
    <ProtectedRoute allowedRole="student">
      <StudentFollows/>
    </ProtectedRoute>
  }
/>







 <Route
          path="/recruiter/applications"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <RecruiterApplications />
            </ProtectedRoute>
          }
        />



      <Route path="recruiter/sidebar" element={
            <ProtectedRoute allowedRole="recruiter">
              <Sidebar />
            </ProtectedRoute>
          } />


          <Route
  path="/recruiter/shortlistedcandidates"
  
 element={
            <ProtectedRoute allowedRole="recruiter">
              <ShortlistedCandidates />
            </ProtectedRoute>
          }

/>


        <Route
          path="/student/trending/:tag"
          element={
            <ProtectedRoute allowedRole="student">
              <TrendingPostsPage/>
            </ProtectedRoute>
          }
        />





<Route
  path="/student/post/:id"

  element={
            <ProtectedRoute allowedRole="student">
              <StudentNotificationPostDetails/>
            </ProtectedRoute>
          }
  
/>












      </Routes>
    </BrowserRouter>
  );
}

export default App;
