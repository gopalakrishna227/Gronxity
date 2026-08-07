import { useNavigate } from "react-router-dom";
import axios from "axios";

const StudentDashboard = () => {

  const navigate = useNavigate();

  // get logged in user
  const user = JSON.parse(localStorage.getItem("user"));

  const logout = async () => {
    try {

      await axios.post(
        `${import.meta.env.VITE_API_URL}/logout`,
        {},
        { withCredentials: true }
      );

      localStorage.removeItem("user");
      navigate("/login");

    } catch (err) {
      console.log(err);
    }
  };

  return (

    <div style={{ padding: "40px" }}>

      <h1>Student Dashboard</h1>

      <p>Welcome Student 👋</p>

      <div style={{ marginTop: "20px" }}>

        <button onClick={() => navigate(`/student/profile/${user._id}`)}>
          My Profile
        </button>

        <button
          onClick={() => navigate("/student/edit-profile")}
          style={{ marginLeft: "10px" }}
        >
          Edit Profile
        </button>

        <button
          onClick={() => navigate("/student/jobs")}
          style={{ marginLeft: "10px" }}
        >
          View Jobs
        </button>

        <button
          onClick={() => navigate("/student/requests")}
          style={{ marginLeft: "10px" }}
        >
          Requests
        </button>

        <button
          onClick={() => navigate("/student/connections")}
          style={{ marginLeft: "10px" }}
        >
          Connections
        </button>

        <button
          onClick={() => navigate("/student/conversations")}
          style={{ marginLeft: "10px" }}
        >
          Messages
        </button>


        <button
  onClick={() => navigate("/student/search")}
  style={{ marginLeft: "10px" }}
>
  Search Students
</button>

        <button
          onClick={logout}
          style={{ marginLeft: "10px" }}
        >
          Logout
        </button>

      </div>

    </div>
  );
};

export default StudentDashboard;