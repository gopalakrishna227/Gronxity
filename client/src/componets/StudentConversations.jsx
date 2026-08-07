import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import {
  Search,
  Phone,
  Video,
  Info,
  Mic,
  Send,
  Image as ImageIcon,
  Sticker,
  Trash2,
  ShieldBan,
  ShieldCheck,
  Flag,
  X,
} from "lucide-react";
import "./StudentConversations.css";
import CallModal from "./CallModal";

const API_BASE = import.meta.env.VITE_API_URL;

const socket = io(API_BASE, {
  withCredentials: true,
  autoConnect: true,
});

const STICKERS = ["😀", "😂", "😍", "🔥", "👍", "❤️", "🎉", "😎", "😭", "🙌"];

export default function StudentConversations() {
  const [me, setMe] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);

  const [connections, setConnections] = useState([]);
  const [searchedConnections, setSearchedConnections] = useState([]);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioPreview, setAudioPreview] = useState("");

  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
const [showDetails, setShowDetails] = useState(false);
  const [callModal, setCallModal] = useState({
    open: false,
    type: "voice",
    mode: "outgoing",
    status: "ringing",
    localStream: null,
    remoteStream: null,
  });

  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const otherUser = useMemo(() => {
    return selectedConversation?.otherUser || null;
  }, [selectedConversation]);

  const isSearchingConnections = search.trim().length > 0;

  useEffect(() => {
    fetchMe();
    fetchConversations();
    fetchConnections();
  }, []);



  useEffect(() => {
  setShowDetails(false);
}, [selectedConversation?._id]);




  useEffect(() => {
    if (!me?._id) return;

    socket.emit("join_user_room", me._id);

    socket.on("new_message", handleIncomingMessage);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("messages_seen", handleMessagesSeen);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("conversation_blocked", handleBlocked);
    socket.on("conversation_unblocked", handleUnblocked);

    socket.on("incoming_call", handleIncomingCall);
    socket.on("call_answered", handleCallAnswered);
    socket.on("ice_candidate", handleIceCandidate);
    socket.on("call_rejected", handleCallRejected);
    socket.on("call_ended", handleCallEnded);

    return () => {
      socket.off("new_message", handleIncomingMessage);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("messages_seen", handleMessagesSeen);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("conversation_blocked", handleBlocked);
      socket.off("conversation_unblocked", handleUnblocked);

      socket.off("incoming_call", handleIncomingCall);
      socket.off("call_answered", handleCallAnswered);
      socket.off("ice_candidate", handleIceCandidate);
      socket.off("call_rejected", handleCallRejected);
      socket.off("call_ended", handleCallEnded);
    };
  }, [me, selectedConversation]);

  useEffect(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      setFilteredConversations(conversations);
      setSearchedConnections([]);
      return;
    }

    const filteredConv = conversations.filter((item) =>
      item.otherUser?.name?.toLowerCase().includes(q)
    );
    setFilteredConversations(filteredConv);

    const filteredConn = connections.filter((item) =>
      item.name?.toLowerCase().includes(q)
    );
    setSearchedConnections(filteredConn);
  }, [search, conversations, connections]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!selectedConversation?._id) return;
    socket.emit("join_conversation", selectedConversation._id);
    fetchMessages(selectedConversation._id);
    markSeen(selectedConversation._id);
  }, [selectedConversation?._id]);

  useEffect(() => {
    if (remoteAudioRef.current && callModal.remoteStream && callModal.type === "voice") {
      remoteAudioRef.current.srcObject = callModal.remoteStream;
    }
    if (remoteVideoRef.current && callModal.remoteStream && callModal.type === "video") {
      remoteVideoRef.current.srcObject = callModal.remoteStream;
    }
  }, [callModal.remoteStream, callModal.type]);

  const fetchMe = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/student/profile/me`, {
        withCredentials: true,
      });
      setMe(res.data.profile);
    } catch (err) {
      console.error("fetchMe error", err);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/student/connections`, {
        withCredentials: true,
      });

      const formatted = Array.isArray(res.data)
        ? res.data.map((item) => ({
            _id: item._id,
            name: item.name || "",
            email: item.email || "",
            avatar: item.avatar || item.profileImage || "",
            headline: item.headline || "",
          }))
        : [];

      setConnections(formatted);
    } catch (err) {
      console.error("fetchConnections error", err);
      setConnections([]);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await axios.get(`${API_BASE}/api/chat/conversations`, {
        withCredentials: true,
      });

      const list = Array.isArray(res.data) ? res.data : [];
      setConversations(list);
      setFilteredConversations(list);

      if (!selectedConversation && list.length) {
        setSelectedConversation(list[0]);
      } else if (selectedConversation?._id) {
        const updatedSelected = list.find(
          (item) => item._id === selectedConversation._id
        );
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        }
      }
    } catch (err) {
      console.error("fetchConversations error", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoadingMessages(true);
      const res = await axios.get(`${API_BASE}/api/chat/${conversationId}/messages`, {
        withCredentials: true,
      });
      setMessages(Array.isArray(res.data.messages) ? res.data.messages : []);
    } catch (err) {
      console.error("fetchMessages error", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markSeen = async (conversationId) => {
    try {
      await axios.put(
        `${API_BASE}/api/chat/${conversationId}/seen`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("markSeen error", err);
    }
  };

  const handleConversationUpdated = async () => {
    await fetchConversations();
  };

  const handleIncomingMessage = (incoming) => {
    if (selectedConversation?._id === incoming.conversationId) {
      setMessages((prev) => [...prev, incoming]);
      markSeen(incoming.conversationId);
    }
    fetchConversations();
  };

  const handleMessagesSeen = ({ conversationId, seenBy }) => {
    if (selectedConversation?._id !== conversationId) return;

    setMessages((prev) =>
      prev.map((msg) => {
        if (!msg.seenBy?.includes(seenBy)) {
          return { ...msg, seenBy: [...(msg.seenBy || []), seenBy] };
        }
        return msg;
      })
    );
  };

  const handleTyping = ({ conversationId, userId }) => {
    if (
      selectedConversation?._id === conversationId &&
      otherUser?._id === userId
    ) {
      setTypingUser(otherUser?.name || "Typing...");
    }
  };

  const handleStopTyping = ({ conversationId }) => {
    if (selectedConversation?._id === conversationId) {
      setTypingUser("");
    }
  };

  const handleBlocked = ({ conversationId, blockedBy }) => {
    if (selectedConversation?._id === conversationId) {
      setSelectedConversation((prev) => ({
        ...prev,
        blockedBy,
      }));
    }
    fetchConversations();
  };

  const handleUnblocked = ({ conversationId }) => {
    if (selectedConversation?._id === conversationId) {
      setSelectedConversation((prev) => ({
        ...prev,
        blockedBy: null,
      }));
    }
    fetchConversations();
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };




const openConversationFromConnection = async (connectionUser) => {
  try {
    let foundConversation = conversations.find(
      (conv) => String(conv.otherUser?._id) === String(connectionUser._id)
    );

    // ✅ If not found → CREATE conversation
    if (!foundConversation) {
      const res = await axios.post(
        `${API_BASE}/api/chat/create`,
        { userId: connectionUser._id },
        { withCredentials: true }
      );

      foundConversation = res.data.conversation;
    }

    if (foundConversation) {
      setSelectedConversation(foundConversation);
      setSearch("");
      fetchConversations(); // refresh list
    }
  } catch (err) {
    console.error("openConversation error:", err);
    alert(err?.response?.data?.message || "Failed to open chat");
  }
};


















  const onTextChange = (e) => {
    setText(e.target.value);

    if (selectedConversation?._id && me?._id) {
      socket.emit("typing", {
        conversationId: selectedConversation._id,
        userId: me._id,
      });

      clearTimeout(window.typingTimer);
      window.typingTimer = setTimeout(() => {
        socket.emit("stop_typing", {
          conversationId: selectedConversation._id,
          userId: me._id,
        });
      }, 900);
    }
  };

  const sendMessage = async (payload) => {
    try {
      if (!selectedConversation?._id) return;

      await axios.post(
        `${API_BASE}/api/chat/${selectedConversation._id}/message`,
        payload,
        { withCredentials: true }
      );

      setText("");
      setImageUrl("");
      setVideoUrl("");
      setAudioPreview("");
      setShowStickerPicker(false);
      setShowMediaModal(false);
    } catch (err) {
      console.error("sendMessage error", err);
      alert(err?.response?.data?.message || "Failed to send message");
    }
  };

  const handleSendText = async () => {
    const clean = text.trim();
    if (!clean) return;
    await sendMessage({
      text: clean,
      messageType: "text",
    });
  };

  const handleSendImage = async () => {
    if (!imageUrl.trim()) return;
    await sendMessage({
      image: imageUrl.trim(),
      messageType: "image",
    });
  };

  const handleSendVideo = async () => {
    if (!videoUrl.trim()) return;
    await sendMessage({
      video: videoUrl.trim(),
      messageType: "video",
    });
  };

  const handleSendSticker = async (emoji) => {
    await sendMessage({
      sticker: emoji,
      messageType: "sticker",
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      mediaChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(blob);
        setAudioPreview(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("recording error", err);
      alert("Microphone permission denied or unsupported browser");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const handleSendAudio = async () => {
    if (!audioPreview) return;
    await sendMessage({
      audio: audioPreview,
      messageType: "audio",
    });
  };

  const handleBlockToggle = async () => {
    try {
      if (!selectedConversation?._id) return;

      if (selectedConversation?.blockedBy === me?._id) {
        await axios.put(
          `${API_BASE}/api/chat/${selectedConversation._id}/unblock`,
          {},
          { withCredentials: true }
        );
      } else {
        await axios.put(
          `${API_BASE}/api/chat/${selectedConversation._id}/block`,
          { reason: "Blocked from chat" },
          { withCredentials: true }
        );
      }

      fetchConversations();
      if (selectedConversation?._id) fetchMessages(selectedConversation._id);
    } catch (err) {
      console.error("block toggle error", err);
      alert(err?.response?.data?.message || "Failed to update block");
    }
  };

  const handleReport = async () => {
    try {
      if (!selectedConversation?._id) return;

      await axios.post(
        `${API_BASE}/api/chat/${selectedConversation._id}/report`,
        {
          reason: reportReason,
          description: reportDescription,
        },
        { withCredentials: true }
      );

      setShowReportModal(false);
      setReportReason("");
      setReportDescription("");
      alert("Reported successfully");
    } catch (err) {
      console.error("report error", err);
      alert(err?.response?.data?.message || "Failed to report");
    }
  };

  const handleDeleteChat = async () => {
    try {
      if (!selectedConversation?._id) return;

      const ok = window.confirm("Delete this chat for you?");
      if (!ok) return;

      await axios.delete(
        `${API_BASE}/api/chat/${selectedConversation._id}/delete`,
        { withCredentials: true }
      );

      setSelectedConversation(null);
      setMessages([]);
      fetchConversations();
    } catch (err) {
      console.error("delete chat error", err);
      alert(err?.response?.data?.message || "Failed to delete chat");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const isBlockedForMe =
    selectedConversation?.blockedBy &&
    selectedConversation?.blockedBy !== me?._id;

  const iBlockedThisUser = selectedConversation?.blockedBy === me?._id;

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatConversationTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  };

  const renderMessage = (msg) => {
    const isMine = String(msg.sender?._id || msg.sender) === String(me?._id);

    return (
      <div
        key={msg._id}
        className={`chat-message-row ${isMine ? "mine" : "theirs"}`}
      >
        <div className={`chat-bubble ${isMine ? "mine" : "theirs"}`}>
          {msg.messageType === "text" && <p>{msg.text}</p>}

          {msg.messageType === "image" && msg.image && (
            <img src={msg.image} alt="chat-img" className="chat-media" />
          )}

          {msg.messageType === "video" && msg.video && (
            <video src={msg.video} controls className="chat-media" />
          )}

          {msg.messageType === "audio" && msg.audio && (
            <audio src={msg.audio} controls className="chat-audio" />
          )}

          {msg.messageType === "sticker" && (
            <div className="chat-sticker">{msg.sticker}</div>
          )}

          {msg.messageType === "call" && (
            <div className="chat-call-log">
              <span>📞 {msg.text}</span>
            </div>
          )}

          <div className="chat-meta">
            <span>{formatTime(msg.createdAt)}</span>
            {isMine && (
              <span className="seen-text">
                {msg.seenBy?.length > 1 ? "Seen" : "Sent"}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // CALLING SAME AS BEFORE
  const createPeerConnection = (toUserId, conversationId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice_candidate", {
          toUserId,
          candidate: event.candidate,
          conversationId,
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setCallModal((prev) => ({
        ...prev,
        remoteStream,
      }));
    };

    peerRef.current = pc;
    return pc;
  };

  const startCall = async (type) => {
    try {
      if (!selectedConversation || !otherUser) return;

      const constraints =
        type === "video"
          ? { audio: true, video: true }
          : { audio: true, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      const pc = createPeerConnection(otherUser._id, selectedConversation._id);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      setCallModal({
        open: true,
        type,
        mode: "outgoing",
        status: "ringing",
        localStream: stream,
        remoteStream: null,
      });

      socket.emit("call_user", {
        toUserId: otherUser._id,
        offer,
        conversationId: selectedConversation._id,
        callType: type,
        fromUser: {
          _id: me._id,
          name: me.name,
          avatar: me.avatar || "",
        },
      });
    } catch (err) {
      console.error("startCall error", err);
      alert("Unable to start call");
    }
  };

  const handleIncomingCall = async ({ offer, conversationId, callType, fromUser }) => {
    if (selectedConversation?._id !== conversationId) return;

    setCallModal({
      open: true,
      type: callType,
      mode: "incoming",
      status: "ringing",
      localStream: null,
      remoteStream: null,
      fromUser,
      offer,
    });
  };

  const acceptCall = async () => {
    try {
      const type = callModal.type;
      const constraints =
        type === "video"
          ? { audio: true, video: true }
          : { audio: true, video: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      const pc = createPeerConnection(otherUser._id, selectedConversation._id);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(callModal.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer_call", {
        toUserId: otherUser._id,
        answer,
        conversationId: selectedConversation._id,
      });

      setCallModal((prev) => ({
        ...prev,
        mode: "connected",
        status: "connected",
        localStream: stream,
      }));

      await saveCallLog(type, "answered");
    } catch (err) {
      console.error("accept call error", err);
      alert("Unable to accept call");
    }
  };

  const handleCallAnswered = async ({ answer, conversationId }) => {
    if (selectedConversation?._id !== conversationId || !peerRef.current) return;
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));

    setCallModal((prev) => ({
      ...prev,
      mode: "connected",
      status: "connected",
    }));

    await saveCallLog(callModal.type, "answered");
  };

  const handleIceCandidate = async ({ candidate, conversationId }) => {
    if (selectedConversation?._id !== conversationId || !peerRef.current) return;
    try {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("ICE candidate error", err);
    }
  };

  const rejectCall = async () => {
    if (!otherUser || !selectedConversation) return;

    socket.emit("reject_call", {
      toUserId: otherUser._id,
      conversationId: selectedConversation._id,
    });

    await saveCallLog(callModal.type, "rejected");
    closeCallModal();
  };

  const handleCallRejected = async () => {
    await saveCallLog(callModal.type, "rejected");
    closeCallModal();
    alert("Call rejected");
  };

  const endCall = async () => {
    if (otherUser && selectedConversation) {
      socket.emit("end_call", {
        toUserId: otherUser._id,
        conversationId: selectedConversation._id,
      });
    }

    await saveCallLog(callModal.type, "ended");
    closeCallModal();
  };

  const handleCallEnded = async () => {
    await saveCallLog(callModal.type, "ended");
    closeCallModal();
    alert("Call ended");
  };

  const closeCallModal = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setCallModal({
      open: false,
      type: "voice",
      mode: "outgoing",
      status: "ringing",
      localStream: null,
      remoteStream: null,
    });
  };

  const saveCallLog = async (callType, status) => {
    try {
      if (!selectedConversation?._id) return;
      await axios.post(
        `${API_BASE}/api/chat/${selectedConversation._id}/call-log`,
        {
          callType,
          status,
          startedAt: new Date(),
          endedAt: new Date(),
        },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("saveCallLog error", err);
    }
  };

  return (
    <div className="student-chat-layout">
      <div className="chat-sidebar">
        <div className="chat-sidebar-top">
          <h2>Messages</h2>

          <div className="chat-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search connections..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="chat-conversation-list">
          {loadingConversations ? (
            <div className="chat-empty">Loading...</div>
          ) : isSearchingConnections ? (
            searchedConnections.length === 0 ? (
              <div className="chat-empty">No connection found</div>
            ) : (
              searchedConnections.map((user) => (
                <div
                  key={user._id}
                  className="chat-conversation-item"
                  onClick={() => openConversationFromConnection(user)}
                >
                  <img
                    src={user.avatar || "https://ui-avatars.com/api/?name=User"}
                    alt="avatar"
                    className="chat-avatar"
                  />

                  <div className="chat-conversation-content">
                    <div className="chat-conversation-header">
                      <h4>{user.name || "Unknown User"}</h4>
                    </div>

                    <div className="chat-conversation-sub">
                      <p>{user.headline || "Connection"}</p>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : filteredConversations.length === 0 ? (
            <div className="chat-empty">No conversations found</div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation._id}
                className={`chat-conversation-item ${
                  selectedConversation?._id === conversation._id ? "active" : ""
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <img
                  src={
                    conversation.otherUser?.avatar ||
                    "https://ui-avatars.com/api/?name=User"
                  }
                  alt="avatar"
                  className="chat-avatar"
                />

                <div className="chat-conversation-content">
                  <div className="chat-conversation-header">
                    <h4>{conversation.otherUser?.name || "Unknown User"}</h4>
                    <span>{formatConversationTime(conversation.lastMessageAt)}</span>
                  </div>

                  <div className="chat-conversation-sub">
                    <p>{conversation.lastMessage || "Start chatting"}</p>
                    {conversation.unseenCount > 0 && (
                      <span className="chat-badge">{conversation.unseenCount}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {!selectedConversation ? (
          <div className="chat-main-empty">Select a conversation</div>
        ) : (
          <>
            <div className="chat-main-header">
              <div className="chat-main-user">
                <img
                  src={
                    otherUser?.avatar ||
                    "https://ui-avatars.com/api/?name=User"
                  }
                  alt="avatar"
                  className="chat-avatar"
                />
                <div>
                  <h3>{otherUser?.name || "User"}</h3>
                  <p>{typingUser || otherUser?.headline || "Connected"}</p>
                </div>
              </div>

              <div className="chat-main-actions">
                <button
                  className="icon-btn"
                  onClick={() => startCall("voice")}
                  disabled={!!isBlockedForMe || !!iBlockedThisUser}
                  title="Voice Call"
                >
                  <Phone size={20} />
                </button>

                <button
                  className="icon-btn"
                  onClick={() => startCall("video")}
                  disabled={!!isBlockedForMe || !!iBlockedThisUser}
                  title="Video Call"
                >
                  <Video size={20} />
                </button>

                <button
                  className="icon-btn"
                  onClick={() => setShowDetails((prev) => !prev)}
                  title="Details"
                >
                  <Info size={20} />
                </button>
              </div>
            </div>

            <div className="chat-messages-area">
              {loadingMessages ? (
                <div className="chat-empty">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="chat-empty">No messages yet</div>
              ) : (
                messages.map(renderMessage)
              )}
              <div ref={messagesEndRef} />
            </div>

            {audioPreview && (
              <div className="chat-audio-preview-bar">
                <audio src={audioPreview} controls />
                <button className="send-audio-btn" onClick={handleSendAudio}>
                  Send Voice
                </button>
                <button className="cancel-audio-btn" onClick={() => setAudioPreview("")}>
                  Cancel
                </button>
              </div>
            )}

            {isBlockedForMe ? (
              <div className="chat-blocked-banner">
                You are blocked. You cannot send messages or call this user.
              </div>
            ) : iBlockedThisUser ? (
              <div className="chat-blocked-banner">
                You blocked this user. Unblock to continue chat.
              </div>
            ) : (
              <div className="chat-composer">
                <button
                  className="icon-btn"
                  onClick={() => setShowStickerPicker((prev) => !prev)}
                  title="Stickers"
                >
                  <Sticker size={20} />
                </button>

                <button
                  className="icon-btn"
                  onClick={() => setShowMediaModal(true)}
                  title="Media URL"
                >
                  <ImageIcon size={20} />
                </button>

                <button
                  className={`icon-btn ${recording ? "recording" : ""}`}
                  onClick={recording ? stopRecording : startRecording}
                  title="Voice Record"
                >
                  <Mic size={20} />
                </button>

                <input
                  type="text"
                  placeholder="Message..."
                  value={text}
                  onChange={onTextChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendText();
                  }}
                />

                <button className="send-btn" onClick={handleSendText}>
                  <Send size={18} />
                </button>

                {showStickerPicker && (
                  <div className="sticker-picker">
                    {STICKERS.map((emoji) => (
                      <button
                        key={emoji}
                        className="sticker-btn"
                        onClick={() => handleSendSticker(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showDetails && selectedConversation && (
        <div className="chat-details-panel">
          <div className="chat-details-top">
            <img
              src={
                otherUser?.avatar || "https://ui-avatars.com/api/?name=User"
              }
              alt="avatar"
              className="chat-details-avatar"
            />
            <h3>{otherUser?.name || "User"}</h3>
            <p>{otherUser?.headline || "Student"}</p>
          </div>

          <div className="chat-details-actions">
            <button className="details-action-btn" onClick={handleBlockToggle}>
              {iBlockedThisUser ? (
                <>
                  <ShieldCheck size={18} /> Unblock User
                </>
              ) : (
                <>
                  <ShieldBan size={18} /> Block User
                </>
              )}
            </button>

            <button
              className="details-action-btn warn"
              onClick={() => setShowReportModal(true)}
            >
              <Flag size={18} /> Report
            </button>

            <button
              className="details-action-btn danger"
              onClick={handleDeleteChat}
            >
              <Trash2 size={18} /> Delete Chat
            </button>
          </div>
        </div>
      )}








      {showMediaModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <div className="chat-modal-head">
              <h3>Send Media URL</h3>
              <button className="icon-btn" onClick={() => setShowMediaModal(false)}>
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Paste image URL"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value.trim()) setVideoUrl("");
              }}
            />

            <button className="chat-modal-btn" onClick={handleSendImage}>
              Send Image
            </button>

            <input
              type="text"
              placeholder="Paste video URL"
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                if (e.target.value.trim()) setImageUrl("");
              }}
            />

            <button className="chat-modal-btn" onClick={handleSendVideo}>
              Send Video
            </button>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="chat-modal-overlay">
          <div className="chat-modal">
            <div className="chat-modal-head">
              <h3>Report User</h3>
              <button className="icon-btn" onClick={() => setShowReportModal(false)}>
                <X size={18} />
              </button>
            </div>

            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              <option value="">Select reason</option>
              <option value="spam">Spam</option>
              <option value="abuse">Abuse</option>
              <option value="harassment">Harassment</option>
              <option value="fake account">Fake account</option>
              <option value="other">Other</option>
            </select>

            <textarea
              rows="4"
              placeholder="Description"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
            />

            <button className="chat-modal-btn" onClick={handleReport}>
              Submit Report
            </button>
          </div>
        </div>
      )}

      <CallModal
        open={callModal.open}
        type={callModal.type}
        mode={callModal.mode}
        status={callModal.status}
        user={callModal.mode === "incoming" ? callModal.fromUser : otherUser}
        localStream={callModal.localStream}
        remoteStream={callModal.remoteStream}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        remoteAudioRef={remoteAudioRef}
        remoteVideoRef={remoteVideoRef}
      />
    </div>
  );
}