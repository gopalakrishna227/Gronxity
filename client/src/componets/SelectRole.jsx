import React from "react";
import { useNavigate } from "react-router-dom";

const SelectRole = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome to GowayNxt 🚀</h1>
        <p style={styles.subtitle}>Choose how you want to continue</p>

        <div style={styles.buttonContainer}>
          <button
            style={{ ...styles.button, ...styles.studentBtn }}
            onClick={() => navigate("/register")}
          >
            🎓 As Student
          </button>

          <button
            style={{ ...styles.button, ...styles.recruiterBtn }}
            onClick={() => navigate("/recruiterregister")}
          >
            👨‍💼 As Recruiter
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    fontFamily: "Arial, sans-serif"
  },
  card: {
    background: "#fff",
    padding: "50px",
    borderRadius: "15px",
    textAlign: "center",
    boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
    width: "400px"
  },
  title: {
    marginBottom: "10px",
    fontSize: "28px",
    fontWeight: "bold"
  },
  subtitle: {
    marginBottom: "30px",
    color: "#555"
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  button: {
    padding: "15px",
    fontSize: "16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.3s ease",
    fontWeight: "bold"
  },
  studentBtn: {
    backgroundColor: "#4CAF50",
    color: "white"
  },
  recruiterBtn: {
    backgroundColor: "#ff5722",
    color: "white"
  }
};

export default SelectRole;