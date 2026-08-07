import React, { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";

export default function CallModal({
  open,
  type,
  mode,
  status,
  user,
  localStream,
  remoteStream,
  onAccept,
  onReject,
  onEnd,
  remoteAudioRef,
  remoteVideoRef,
}) 

{
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream && type === "video") {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, type]);

  if (!open) return null;

  return (
    <div className="call-modal-overlay">
      <div className="call-modal-box">
        <div className="call-user-top">
          <img
            src={user?.avatar || "https://ui-avatars.com/api/?name=User"}
            alt="user"
            className="call-user-avatar"
          />
          <h3>{user?.name || "User"}</h3>
          <p>
            {type === "video" ? "Video Call" : "Voice Call"} • {status}
          </p>
        </div>

        {type === "video" ? (
          <div className="call-video-area">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="call-local-video"
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="call-remote-video"
            />
          </div>
        ) : (
          <audio ref={remoteAudioRef} autoPlay />
        )}

        <div className="call-actions">
          {mode === "incoming" && status === "ringing" ? (
            <>
              <button className="call-accept-btn" onClick={onAccept}>
                {type === "video" ? <Video size={20} /> : <Phone size={20} />}
              </button>
              <button className="call-reject-btn" onClick={onReject}>
                <PhoneOff size={20} />
              </button>
            </>
          ) : (
            <button className="call-reject-btn" onClick={onEnd}>
              <PhoneOff size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}