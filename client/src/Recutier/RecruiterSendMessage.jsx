import { useState } from "react";
import axios from "axios";

export default function RecruiterSendMessage() {
  const token = localStorage.getItem("token"); // JWT from login
  const [messageForm, setMessageForm] = useState({ title: "", content: "" });

  const headers = {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true
  };

  const handleChange = (e) => {
    setMessageForm({ ...messageForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!messageForm.title || !messageForm.content) {
      alert("Please fill both title and content");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/create`,
        messageForm,
        headers
      );

      alert("Message sent to all students!");
      setMessageForm({ title: "", content: "" }); // reset form
    } catch (err) {
      alert(err.response?.data?.message || "Error sending message");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Send Message to All Students</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Message Title"
          value={messageForm.title}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <textarea
          name="content"
          placeholder="Message Content"
          value={messageForm.content}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", height: "120px", marginBottom: "10px" }}
        />
        <button type="submit" style={{ padding: "10px 20px" }}>Send Message</button>
      </form>
    </div>
  );
}