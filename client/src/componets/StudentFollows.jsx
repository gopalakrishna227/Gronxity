import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Check, X, Search } from "lucide-react";
import "./StudentFollows.css";

const API_BASE = import.meta.env.VITE_API_URL;
const DEFAULT_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export default function StudentFollows() {
  const [activeTab, setActiveTab] = useState("requests");

  const [requests, setRequests] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [requestsCount, setRequestsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllNetworkData();
  }, []);

 const fetchAllNetworkData = async () => {
  try {
    setLoading(true);

    const results = await Promise.allSettled([
      axios.get(`${API_BASE}/api/student/requests/incoming`, {
        withCredentials: true,
      }),
      axios.get(`${API_BASE}/api/student/followers`, {
        withCredentials: true,
      }),
      axios.get(`${API_BASE}/api/student/following`, {
        withCredentials: true,
      }),
    ]);

    const [requestsRes, followersRes, followingRes] = results;

    if (requestsRes.status === "fulfilled") {
      const incomingRequests = Array.isArray(requestsRes.value.data)
        ? requestsRes.value.data
        : [];
      setRequests(incomingRequests);
      setRequestsCount(incomingRequests.length);
    } else {
      console.error("Requests API failed:", requestsRes.reason);
    }

    if (followersRes.status === "fulfilled") {
      setFollowers(followersRes.value.data.followers || []);
      setFollowersCount(followersRes.value.data.count || 0);
    } else {
      console.error("Followers API failed:", followersRes.reason);
    }

    if (followingRes.status === "fulfilled") {
      setFollowing(followingRes.value.data.following || []);
      setFollowingCount(followingRes.value.data.count || 0);
    } else {
      console.error("Following API failed:", followingRes.reason);
    }
  } catch (err) {
    console.error("Fetch network data error:", err);
    alert("Failed to fetch network data");
  } finally {
    setLoading(false);
  }
};


const handleAccept = async (requestId) => {
  try {
    setActionId(requestId);

    const res = await axios.put(
      `${API_BASE}/api/student/request/accept/${requestId}`,
      {},
      { withCredentials: true }
    );

    alert(res.data.message || "Request accepted");
    await fetchAllNetworkData();
  } catch (err) {
    console.error("Accept request error:", err);
    alert(err.response?.data?.message || "Failed to accept request");
  } finally {
    setActionId("");
  }
};












  const handleReject = async (requestId) => {
    try {
      setActionId(requestId);

      const res = await axios.put(
        `${API_BASE}/api/student/request/reject/${requestId}`,
        {},
        { withCredentials: true }
      );

      setRequests((prev) => prev.filter((item) => item._id !== requestId));
      setRequestsCount((prev) => Math.max(prev - 1, 0));

      alert(res.data.message || "Request rejected");
    } catch (err) {
      console.error("Reject request error:", err);
      alert(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionId("");
    }
  };

  const handleRemoveFollower = async (studentId) => {
    try {
      setActionId(studentId);

      const res = await axios.delete(
        `${API_BASE}/api/student/follower/${studentId}`,
        { withCredentials: true }
      );

      setFollowers((prev) => prev.filter((item) => item._id !== studentId));
      setFollowersCount((prev) => Math.max(prev - 1, 0));

      alert(res.data.message || "Follower removed successfully");
    } catch (err) {
      console.error("Remove follower error:", err);
      alert(err.response?.data?.message || "Failed to remove follower");
    } finally {
      setActionId("");
    }
  };

  const handleUnfollow = async (studentId) => {
    try {
      setActionId(studentId);

      const res = await axios.delete(
        `${API_BASE}/api/student/following/${studentId}`,
        { withCredentials: true }
      );

      setFollowing((prev) => prev.filter((item) => item._id !== studentId));
      setFollowingCount((prev) => Math.max(prev - 1, 0));

      alert(res.data.message || "Unfollowed successfully");
    } catch (err) {
      console.error("Unfollow error:", err);
      alert(err.response?.data?.message || "Failed to unfollow");
    } finally {
      setActionId("");
    }
  };

  const currentList = useMemo(() => {
    if (activeTab === "requests") {
      return requests.filter((item) => {
        const sender = item.sender || {};
        const text = `${sender.name || ""} ${sender.headline || ""} ${
          sender.location || ""
        }`.toLowerCase();

        return text.includes(search.toLowerCase());
      });
    }

    if (activeTab === "followers") {
      return followers.filter((item) => {
        const text = `${item.name || ""} ${item.headline || ""} ${
          item.location || ""
        }`.toLowerCase();

        return text.includes(search.toLowerCase());
      });
    }

    return following.filter((item) => {
      const text = `${item.name || ""} ${item.headline || ""} ${
        item.location || ""
      }`.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [activeTab, requests, followers, following, search]);

  const getAvatar = (user) => {
    return user?.avatar?.trim()
      ? user.avatar
      : user?.profileImage?.trim()
      ? user.profileImage
      : DEFAULT_AVATAR;
  };

  const getTopText = () => {
    if (activeTab === "requests") {
      return `You have ${requestsCount} pending requests`;
    }
    if (activeTab === "followers") {
      return `${followersCount} people are following you`;
    }
    return `You are following ${followingCount} people`;
  };

  return (
    <div className="student-follows-page">
      <div className="student-follows-card">
        <div className="student-follows-tabs">
          <button
            className={activeTab === "requests" ? "active" : ""}
            onClick={() => setActiveTab("requests")}
          >
            Requests
            <span>{requestsCount}</span>
          </button>

          <button
            className={activeTab === "followers" ? "active" : ""}
            onClick={() => setActiveTab("followers")}
          >
            Followers
            <span>{followersCount}</span>
          </button>

          <button
            className={activeTab === "following" ? "active" : ""}
            onClick={() => setActiveTab("following")}
          >
            Following
            <span>{followingCount}</span>
          </button>
        </div>

        <div className="student-follows-topbar">
          <p>{getTopText()}</p>

          <div className="student-follows-searchbox">
            <Search size={16} />
            <input
              type="text"
              placeholder={`Search ${activeTab}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="student-follows-state">Loading...</p>
        ) : currentList.length === 0 ? (
          <p className="student-follows-state">
            {activeTab === "requests" && "No pending requests"}
            {activeTab === "followers" && "No followers found"}
            {activeTab === "following" && "No following members found"}
          </p>
        ) : (
          <div className="student-follows-list">
            {activeTab === "requests" &&
              currentList.map((item) => {
                const sender = item.sender || {};
                const isLoading = actionId === item._id;

                return (
                  <div className="student-follow-row" key={item._id}>
                    <div
                      className="student-follow-left"
                      onClick={() => navigate(`/student/profile/${sender._id}`)}
                    >
                      <img
                        src={getAvatar(sender)}
                        alt={sender.name || "Student"}
                        className="student-follow-avatar"
                      />

                      <div className="student-follow-info">
                        <h3>{sender.name || "Student"}</h3>
                        <p>{sender.headline || "Sent you a request"}</p>
                        <span>{sender.location || "Open profile"}</span>
                      </div>
                    </div>

                    <div className="student-follow-actions">
                      <button
                        type="button"
                        className="student-follow-accept-btn"
                        onClick={() => handleAccept(item._id)}
                        disabled={isLoading}
                      >
                        <Check size={16} />
                        <span>{isLoading ? "..." : "Accept"}</span>
                      </button>

                      <button
                        type="button"
                        className="student-follow-reject-btn"
                        onClick={() => handleReject(item._id)}
                        disabled={isLoading}
                      >
                        <X size={16} />
                        <span>{isLoading ? "..." : "Reject"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

            {activeTab === "followers" &&
              currentList.map((item) => {
                const isLoading = actionId === item._id;

                return (
                  <div className="student-follow-row" key={item._id}>
                    <div
                      className="student-follow-left"
                      onClick={() => navigate(`/student/profile/${item._id}`)}
                    >
                      <img
                        src={getAvatar(item)}
                        alt={item.name || "Student"}
                        className="student-follow-avatar"
                      />

                      <div className="student-follow-info">
                        <h3>{item.name || "Student"}</h3>
                        <p>{item.headline || "No headline added"}</p>
                        <span>{item.location || "Open profile"}</span>
                      </div>
                    </div>

                    <div className="student-follow-actions">
                      <button
                        type="button"
                        className="student-follow-remove-btn"
                        onClick={() => handleRemoveFollower(item._id)}
                        disabled={isLoading}
                      >
                        <span>{isLoading ? "..." : "Remove"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

            {activeTab === "following" &&
              currentList.map((item) => {
                const isLoading = actionId === item._id;

                return (
                  <div className="student-follow-row" key={item._id}>
                    <div
                      className="student-follow-left"
                      onClick={() => navigate(`/student/profile/${item._id}`)}
                    >
                      <img
                        src={getAvatar(item)}
                        alt={item.name || "Student"}
                        className="student-follow-avatar"
                      />

                      <div className="student-follow-info">
                        <h3>{item.name || "Student"}</h3>
                        <p>{item.headline || "No headline added"}</p>
                        <span>{item.location || "Open profile"}</span>
                      </div>
                    </div>

                    <div className="student-follow-actions">
                      <button
                        type="button"
                        className="student-follow-following-btn"
                        onClick={() => handleUnfollow(item._id)}
                        disabled={isLoading}
                      >
                        <span>{isLoading ? "..." : "Following"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}