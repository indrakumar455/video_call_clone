import React, { useContext, useState } from "react";
import withAuth from "../uitls/withAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import "../style/home.css";
import { IconButton, TextField } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/authContext";

function HomeComponent() {
  let navigate = useNavigate();

  const {addToUserHistory} = useContext(AuthContext);
  const [meetingCode, setMeetingCode] = useState("");
  let handleJoinVideoCall = async() => {
    await addToUserHistory(meetingCode)
    navigate(`/${meetingCode}`);
  }; 
  let handleHistory = ()=>{
    navigate("/history");
  }
  let handleLogout = () => {
    localStorage.removeItem("token"); // remove token
    navigate("/auth"); // navigate to auth page
  };
  return (
    <div className="homeContainer">
      <nav>
        <div className="navHeader">
          <h2>APNA VIDEO CALL</h2>
        </div>
        <div className="navlist">
          <IconButton onClick={handleHistory} className="button">
            <RestoreIcon  />
            <p>History</p>
          </IconButton>
          <p role="button" onClick={handleLogout}>
            logout
          </p>
        </div>
      </nav>
      <div className="homeHeader">
        <div className="leftPanel">
          <h2>Providing Quality Video Call Just Like Quality Education</h2>

          <input
            type="text"
            placeholder="Meeting Code"
            className="meetingAreaInput"
            onChange={(e) => setMeetingCode(e.target.value)}
          /> <br />
          <button className="meetingBtn" onClick={handleJoinVideoCall}>Joined Meeting</button>
        </div>
        <div className="rightpanel">
          <img src="logo3.png" alt="" />
        </div>
      </div>
    </div>
  );
}

export default withAuth(HomeComponent);
