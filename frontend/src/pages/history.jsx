import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import "../style/home.css";
import HomeIcon from "@mui/icons-material/Home";
import { IconButton } from "@mui/material";

export default function History() {
  const { getUserHistory } = useContext(AuthContext);

  const [meetings, setMeetings] = useState([]);

  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getUserHistory();
        setMeetings(history);
      } catch (e) {
        console.log(e);
      }
    };
    fetchHistory();
  }, []);
  console.log(meetings);

  let formateDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear(); // ❌ WRONG
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="HistoryContainer">
      <IconButton onClick={() => routeTo("/home")} style={{ color: "black" }}>
        <HomeIcon />
      </IconButton>

      {meetings.map((elm, index) => (
        <div key={index} className="historyCard">
          <strong>Meeting Code: {elm.meetingCode}</strong>
          <p>{formateDate(elm.date)}</p>
        </div>
      ))}
    </div>
  );
}
