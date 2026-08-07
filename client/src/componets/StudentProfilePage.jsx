import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ProfileCard from "./ProfileCard";

export default function StudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [buttonState, setButtonState] = useState("connect");
  const [requestId, setRequestId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, [id]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [
        profileRes,
        incomingRes,
        outgoingRes,
        connectionsRes,
        conversationsRes,
      ] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/student/profile/${id}`, {
          withCredentials: true,
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/student/requests/incoming`, {
          withCredentials: true,
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/student/requests/outgoing`, {
          withCredentials: true,
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/student/connections`, {
          withCredentials: true,
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/student/conversations`, {
          withCredentials: true,
        }),
      ]);

      setProfile(profileRes.data);

      const incoming = incomingRes.data.find((req) => req.sender?._id === id);
      const outgoing = outgoingRes.data.find((req) => req.receiver?._id === id);
      const connected = connectionsRes.data.find((user) => user._id === id);

      if (connected) {
        setButtonState("message");

        const matchedConversation = conversationsRes.data.find((conv) => {
          const memberIds = conv.members.map((m) => m._id);
          return memberIds.includes(id);
        });

        if (matchedConversation) {
          setConversationId(matchedConversation._id);
        }
      } else if (incoming) {
        setButtonState("received");
        setRequestId(incoming._id);
      } else if (outgoing) {
        setButtonState("requested");
        setRequestId(outgoing._id);
      } else {
        setButtonState("connect");
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      alert(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/student/request/${id}`,
        {},
        { withCredentials: true }
      );
      setButtonState("requested");
    } catch (err) {
      console.error("Connect error:", err);
      alert(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleAccept = async () => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/student/request/accept/${requestId}`,
        {},
        { withCredentials: true }
      );

      setButtonState("message");
      setConversationId(res.data.conversation?._id || null);
    } catch (err) {
      console.error("Accept error:", err);
      alert(err.response?.data?.message || "Failed to accept request");
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/student/request/reject/${requestId}`,
        {},
        { withCredentials: true }
      );

      setButtonState("connect");
      setRequestId(null);
    } catch (err) {
      console.error("Reject error:", err);
      alert(err.response?.data?.message || "Failed to reject request");
    }
  };

  const handleMessage = () => {
    if (!conversationId) {
      alert("Conversation not found");
      return;
    }
    navigate(`/student/chat/${conversationId}`);
  };

  if (loading) return <div className="pageCenter">Loading profile...</div>;
  if (!profile) return <div className="pageCenter">Profile not found</div>;

  return (
    <div className="pageContainer">
      <ProfileCard
        profile={profile}
        buttonState={buttonState}
        onConnect={handleConnect}
        onAccept={handleAccept}
        onReject={handleReject}
        onMessage={handleMessage}
      />
    </div>
  );
}