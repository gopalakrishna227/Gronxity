import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./components/AdminLogin";
import AdminRegister from "./components/AdminRegister";
import AdminDashboard from "./components/AdminDashboard";
import AdminStudents from "./components/AdminStudents";
import AdminStudentView from "./components/AdminStudentView";
import AdminRecruiters from "./components/AdminRecruiters";
import AdminRecruiterView from "./components/AdminRecruiterView";
import AdminJobs from "./components/AdminJobs";
import AdminJobView from "./components/AdminJobView";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import AdminCourses from "./components/AdminCourses";
import AdminSupportRequests from "./components/AdminSupportRequests";
import AdminUserReports from "./components/AdminUserReports";
import AdminDeletionRequests from "./components/AdminDeletionRequests";
import AdminGate from "./components/AdminGate";
import AdminMain from "./components/AdminMain";
import AdminPage from "./components/AdminPage";
import AdminSeeCourses from "./components/Adminseecourses";
import AdminCourseDetails from "./components/AdminCourseDetails";




export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/admin/:id" element={<AdminGate />} />
            <Route path="/admin-login" element={<AdminMain />} />
                        <Route path="/adminpage" element={<AdminPage />} />


                        <Route path="/admin/seecourses" element={<AdminSeeCourses />} />
<Route path="/admin/course/:courseId" element={<AdminCourseDetails />} />

 


      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/students/:id"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminStudentView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/recruiters"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminRecruiters />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/recruiters/:id"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminRecruiterView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/jobs"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminJobs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/jobs/:id"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminJobView />
          </ProtectedRoute>
        }
      />

<Route
  path="/admin/courses"
  element={
    <ProtectedRoute allowedRole="admin">
      <AdminCourses />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin/layout"
  element={
    <ProtectedRoute allowedRole="admin">
      <AdminLayout />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin/support-requests"
  element={
    <ProtectedRoute allowedRole="admin">
      <AdminSupportRequests />
    </ProtectedRoute>
  }
/>


<Route
  path="/admin/user-reports"
  element={
    <ProtectedRoute allowedRole="admin">
      <AdminUserReports />
    </ProtectedRoute>
  }
/>



<Route
  path="/admin/account-deletion-requests"
  element={
    <ProtectedRoute allowedRole="admin">
      <AdminDeletionRequests />
    </ProtectedRoute>
  }
/>







    </Routes>
  );
}


