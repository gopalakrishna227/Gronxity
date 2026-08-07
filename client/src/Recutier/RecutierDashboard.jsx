import { useNavigate } from "react-router-dom";
import axios from "axios";

const RecruiterDashboard = () => {

  const navigate = useNavigate();

  const logout = async () => {
    try {

      await axios.post(
        `${import.meta.env.VITE_API_URL}/logout`,
        {},
        { withCredentials: true }
      );

      navigate("/login");

    } catch (err) {
      console.log(err);
    }
  };

  return (

    <div style={{ padding: "40px" }}>

      <h1>Recruiter Dashboard</h1>

      <p>Welcome Recruiter 👋</p>

      <div style={{ marginTop: "20px" }}>

        <button
          onClick={() => navigate("/postjob")}
        >
          Post Job
        </button>

        <button
          onClick={() => navigate("/recruiter/jobs")}
          style={{ marginLeft: "10px" }}
        >
          My Jobs
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

export default RecruiterDashboard;