import { NavLink, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminLayout.css";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/api/admin/logout`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("user");
      navigate("/admin/login");
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div>
          <h2 className="admin-logo">Admin Panel</h2>
          <p className="admin-user-name">{user?.name || "Admin"}</p>

          <nav className="admin-nav">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                isActive ? "admin-link active" : "admin-link"
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/admin/students"
              className={({ isActive }) =>
                isActive ? "admin-link active" : "admin-link"
              }
            >
              Students
            </NavLink>

            <NavLink
              to="/admin/recruiters"
              className={({ isActive }) =>
                isActive ? "admin-link active" : "admin-link"
              }
            >
              Recruiters
            </NavLink>

            <NavLink
  to="/admin/courses"
  className={({ isActive }) =>
    isActive ? "admin-link active" : "admin-link"
  }
>
  Courses
</NavLink>

            <NavLink
              to="/admin/jobs"
              className={({ isActive }) =>
                isActive ? "admin-link active" : "admin-link"
              }
            >
              Jobs
            </NavLink>
          </nav>
        </div>

        <NavLink
  to="/admin/support-requests"
  className={({ isActive }) =>
    isActive ? "admin-link active" : "admin-link"
  }
>
  Help Requests
</NavLink>



<NavLink
  to="/admin/user-reports"
  className={({ isActive }) =>
    isActive ? "admin-link active" : "admin-link"
  }
>
  User Reports
</NavLink>


<NavLink
  to="/admin/account-deletion-requests"
  className={({ isActive }) =>
    isActive ? "admin-link active" : "admin-link"
  }
>
  Account Deletion Requests
</NavLink>

<NavLink
  to="/admin/seecourses"
  className={({ isActive }) =>
    isActive ? "admin-link active" : "admin-link"
  }
>
  see the courses
</NavLink>




        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}