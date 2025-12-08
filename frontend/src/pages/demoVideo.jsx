// src/pages/VideoMeetComponent.jsx
import React, { useEffect, useRef, useState } from "react";
import "../style/videoComponent.css";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import { io } from "socket.io-client";

// MUI icons
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";

const server_url = "http://localhost:9000"; // adjust if needed
const pcConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

export default function VideoMeetComponent() {
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);

  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);

  // UI state
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

  // media toggles
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // chat badge
  const [newMessages, setNewMessages] = useState(0);
  const [messages, setMessages] = useState([]);

  // peers and remote streams
  const pcsRef = useRef({}); // { socketId: RTCPeerConnection }
  const [remotes, setRemotes] = useState([]); // [{ socketId, stream }]

  // ----- get camera + mic permission -----
  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(s);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => {});
        }
      } catch (e) {
        console.error("getUserMedia failed:", e);
      }
    })();
  }, []);

  // Helper: set remote stream in state (ensures useEffect in RemoteVideo handles srcObject)
  const addOrUpdateRemote = (socketId, stream) => {
    setRemotes((prev) => {
      const exists = prev.find((r) => r.socketId === socketId);
      if (exists) {
        return prev.map((r) =>
          r.socketId === socketId ? { ...r, stream } : r
        );
      }
      return [...prev, { socketId, stream }];
    });
  };

  // Helper: remove remote
  const removeRemote = (socketId) => {
    setRemotes((prev) => prev.filter((r) => r.socketId !== socketId));
    const pc = pcsRef.current[socketId];
    if (pc) {
      try {
        pc.close();
      } catch (e) {}
      delete pcsRef.current[socketId];
    }
  };

  // ----- socket connect & signaling -----
  const connectToServer = () => {
    if (socketRef.current) return; // already connected
    const socket = io(server_url);
    socketRef.current = socket;

    socket.on("connect", () => {
      socketIdRef.current = socket.id;
      console.log("socket connected:", socket.id);
      // tell server which room / page
      socket.emit("join-call", window.location.href);
      setJoined(true);
    });

    // server sends signals as: (fromId, data) where data is object { sdp?, ice? }
    socket.on("signal", async (fromId, data) => {
      // ignore our own signals
      if (fromId === socketIdRef.current) return;

      // ensure pc exists
      let pc = pcsRef.current[fromId];
      if (!pc) {
        pc = createPeerConnection(fromId);
        pcsRef.current[fromId] = pc;

        // add local tracks (if available)
        if (localStream) {
          for (const track of localStream.getTracks()) {
            pc.addTrack(track, localStream);
          }
        }
      }

      if (data.sdp) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } catch (e) {
          console.error("setRemoteDescription error", e);
          return;
        }
        if (data.sdp.type === "offer") {
          try {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("signal", fromId, { sdp: pc.localDescription });
          } catch (e) {
            console.error("createAnswer error", e);
          }
        }
      } else if (data.ice) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.ice));
        } catch (e) {
          console.warn("addIceCandidate failed", e);
        }
      }
    });

    socket.on("user-joined", (newId, clients) => {
      console.log("user-joined", newId, clients);
      // create peer connections for existing clients (server may send list)
      clients.forEach((clientId) => {
        if (clientId === socketIdRef.current) return;
        if (pcsRef.current[clientId]) return; // already have
        const pc = createPeerConnection(clientId);
        pcsRef.current[clientId] = pc;

        // add local tracks
        if (localStream) {
          for (const track of localStream.getTracks()) {
            pc.addTrack(track, localStream);
          }
        }

        // create offer
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit("signal", clientId, { sdp: pc.localDescription });
          })
          .catch((e) => console.error("offer error", e));
      });
    });

    socket.on("user-left", (id) => {
      console.log("user-left", id);
      removeRemote(id);
    });

    // simple chat
    socket.on("chat-message", (msg) => {
      setMessages((m) => [...m, msg]);
      setNewMessages((n) => n + 1);
    });
  };

  // create RTCPeerConnection and handlers
  const createPeerConnection = (peerId) => {
    const pc = new RTCPeerConnection(pcConfig);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("signal", peerId, { ice: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const incomingStream = event.streams[0];
      if (incomingStream) {
        addOrUpdateRemote(peerId, incomingStream);
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected" ||
        pc.connectionState === "closed"
      ) {
        // cleanup if needed
        // removeRemote(peerId);
      }
    };

    return pc;
  };

  // ----- UI actions -----
  const start = () => {
    setAskForUsername(false);
    connectToServer();
  };

  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setVideoEnabled((v) => !v);
  };

  const toggleAudio = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setAudioEnabled((a) => !a);
  };

  const endCall = () => {
    // stop local tracks
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }
    // close peer connections
    Object.values(pcsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    pcsRef.current = {};
    // disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setRemotes([]);
    setJoined(false);
    setAskForUsername(true);
  };

  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
        // replace local video element view (optional)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
          localVideoRef.current.play().catch(() => {});
        }

        // replace sender tracks on each pc (replaceTrack)
        const screenTrack = s.getVideoTracks()[0];
        for (const pc of Object.values(pcsRef.current)) {
          // find sender for video
          const senders = pc
            .getSenders()
            .filter((s) => s.track && s.track.kind === "video");
          if (senders.length > 0) {
            try {
              await senders[0].replaceTrack(screenTrack);
            } catch (e) {
              // fallback: addTrack (less ideal)
              pc.addTrack(screenTrack, s);
            }
          } else {
            pc.addTrack(screenTrack, s);
          }
        }

        // when screen sharing stops, restore camera
        screenTrack.onended = async () => {
          // restore local camera to video element and to peers
          if (localStream) {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
            }
            for (const pc of Object.values(pcsRef.current)) {
              const cameraTrack = localStream.getVideoTracks()[0];
              const senders = pc
                .getSenders()
                .filter((s) => s.track && s.track.kind === "video");
              if (senders.length > 0 && cameraTrack) {
                try {
                  await senders[0].replaceTrack(cameraTrack);
                } catch (e) {}
              } else if (cameraTrack) {
                pc.addTrack(cameraTrack, localStream);
              }
            }
          }
          setScreenSharing(false);
        };

        setScreenSharing(true);
      } catch (e) {
        console.warn("screen share failed", e);
      }
    } else {
      // user requested stop - trigger onended by stopping track
      // but we don't keep a reference to the screen stream here; simplest: endCall or rely on onended above
      // for now: just set state
      setScreenSharing(false);
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    }
  };

  const sendMessage = (text) => {
    if (!socketRef.current) return;
    const msg = {
      from: socketIdRef.current,
      text,
      time: new Date().toLocaleTimeString(),
    };
    socketRef.current.emit("chat-message", msg);
    setMessages((m) => [...m, msg]);
  };

  // ----- Render -----
  return (
    <div className="meetWrapper">
      {askForUsername ? (
        <div className="lobby">
          <h2>Enter lobby</h2>
          <TextField
            label="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button variant="contained" onClick={start} style={{ marginLeft: 8 }}>
            Connect
          </Button>
          <div style={{ marginTop: 12 }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ width: 320, height: 240, background: "black" }}
            />
          </div>
        </div>
      ) : (
        <div className="meetVideoContainer">
          <div
            className="buttonContainer"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <IconButton
              onClick={toggleVideo}
              color={videoEnabled ? "primary" : "default"}
            >
              {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={endCall}>
              <CallEndIcon style={{ color: "red" }} />
            </IconButton>

            <IconButton
              onClick={toggleAudio}
              color={audioEnabled ? "primary" : "default"}
            >
              {audioEnabled ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            <IconButton onClick={toggleScreenShare}>
              {screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </IconButton>

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton
                onClick={() => setNewMessages(0)}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <div>
              <h4>Local</h4>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: 320, height: 240, background: "black" }}
              />
            </div>

            <div
              className="conferenceView"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, 220px)",
                gap: 12,
              }}
            >
              {remotes.map((r) => (
                <RemoteVideo
                  key={r.socketId}
                  socketId={r.socketId}
                  stream={r.stream}
                />
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <h4>Chat</h4>
            <div
              style={{
                maxHeight: 160,
                overflowY: "auto",
                border: "1px solid #ddd",
                padding: 8,
              }}
            >
              {messages.map((m, i) => (
                <div key={i}>
                  <strong>
                    {m.from === socketIdRef.current ? "Me" : m.from}
                  </strong>{" "}
                  [{m.time}]: {m.text || m}
                </div>
              ))}
            </div>

            <ChatInput onSend={(text) => sendMessage(text)} />
          </div>
        </div>
      )}
    </div>
  );
}

// small chat input component
function ChatInput({ onSend }) {
  const [txt, setTxt] = useState("");
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      <input
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        placeholder="Type message..."
        style={{ flex: 1, padding: 8 }}
      />
      <Button
        variant="contained"
        onClick={() => {
          if (txt.trim()) {
            onSend(txt.trim());
            setTxt("");
          }
        }}
      >
        Send
      </Button>
    </div>
  );
}

// Remote video component: sets srcObject cleanly with useEffect
function RemoteVideo({ socketId, stream }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream || null;
      ref.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div
      style={{ background: "#111", color: "#fff", padding: 6, borderRadius: 6 }}
    >
      <div style={{ fontSize: 12, marginBottom: 6 }}>{socketId}</div>
      <video
        ref={ref}
        autoPlay
        playsInline
        style={{ width: 220, height: 140, background: "black" }}
      />
    </div>
  );
}

// {videos.map((video) => (
//   <div key={video.socketId}>
//     <h2>{video.socketId}</h2>
//     <video
//       ref={(ref) => {
//         if (ref && video.stream) {
//           ref.srcObject = video.stream;
//           ref.play().catch((e) => console.log("Play error:", e));
//         }
//       }}
//       autoPlay
//       playsInline
//       muted
//       style={{ width: 300, height: 200, backgroundColor: "black" }}
//     />
//   </div>
// ))}
